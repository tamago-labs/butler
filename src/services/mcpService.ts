import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { 
  ListToolsRequest,
  ListToolsResult,
  CallToolRequest,
  CallToolResult,
  ListResourcesRequest,
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult
} from '@modelcontextprotocol/sdk/types.js';
import { tauriMCPService } from './tauriMCPService';
import { readTextFile, readDir, writeTextFile } from '@tauri-apps/plugin-fs';
import { resolveResource } from '@tauri-apps/api/path';

export interface MCPServerEvent {
  type: string;
  data: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description: string;
  category: 'filesystem' | 'database' | 'web' | 'git' | 'custom';
}

export interface MCPServerInstance {
  config: MCPServerConfig;
  client?: Client;
  transport?: StdioClientTransport;
  status: 'stopped' | 'starting' | 'running' | 'error';
  error?: string;
  tools: MCPTool[];
  resources: MCPResource[];
  lastStarted?: Date;
}

export class MCPService {
  private servers: Map<string, MCPServerInstance> = new Map();
  private eventListeners: Map<string, ((event: MCPServerEvent) => void)[]> = new Map();
  private workspaceRoot: string | null = null;

  constructor() {
    this.setupDefaultServers();
  }

  // Set workspace root for filesystem operations
  setWorkspaceRoot(path: string | null) {
    this.workspaceRoot = path;
    // Update filesystem server with new path if it exists
    const fsServer = this.servers.get('filesystem');
    if (fsServer && path) {
      // Update the server config with the new path
      fsServer.config.args = ['-y', '@modelcontextprotocol/server-filesystem', path];
      
      // If server is running, restart it with new path
      if (fsServer.status === 'running') {
        console.log('Restarting filesystem server with new workspace:', path);
        this.restartServer('filesystem').catch(err => {
          console.log('Failed to restart filesystem server:', err.message);
        });
      } else {
        // Start the server with the workspace path
        console.log('Starting filesystem server with workspace:', path);
        this.startServer('filesystem').catch(err => {
          console.log('Failed to start filesystem server:', err.message);
        });
      }
    }
  }

  // Execute filesystem tools directly using Tauri APIs
  private async executeFilesystemTool(toolName: string, arguments_: Record<string, any>): Promise<any> {
    const workspaceRoot = this.workspaceRoot;
    
    switch (toolName) {
      case 'list_directory': {
        let targetPath = arguments_.path;
        
        // If no path provided, use workspace root
        if (!targetPath && workspaceRoot) {
          targetPath = workspaceRoot;
        } else if (!targetPath) {
          return {
            content: [{
              type: 'text',
              text: 'No directory path provided and no workspace is open. Please open a folder first using File > Open Folder.'
            }]
          };
        }
        
        // If it's a relative path, make it relative to workspace
        if (!targetPath.startsWith('/') && workspaceRoot) {
          targetPath = `${workspaceRoot}/${targetPath}`.replace(/\/+/g, '/');
        }
        
        try {
          const entries = await readDir(targetPath);
          const fileList = entries.map(entry => {
            return `${entry.isDirectory ? 'd' : '-'} ${entry.name}`;
          }).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `Directory listing for ${targetPath}:\n\n${fileList}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Unable to access directory ${targetPath}. This might be because:\n\n1. The folder wasn't opened through File > Open Folder\n2. The path doesn't exist\n3. Insufficient permissions\n\nTauri only allows access to folders you explicitly open through the file dialog.\n\nError: ${error}`
            }]
          };
        }
      }
      
      case 'read_file': {
        let filePath = arguments_.path;
        if (!filePath) {
          throw new Error('File path is required');
        }
        
        // If it's a relative path, make it relative to workspace
        if (!filePath.startsWith('/') && workspaceRoot) {
          filePath = `${workspaceRoot}/${filePath}`.replace(/\/+/g, '/');
        }
        
        try {
          const content = await readTextFile(filePath);
          return {
            content: [{
              type: 'text',
              text: content
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text', 
              text: `Unable to read file ${filePath}. This might be because:\n\n1. The file is outside the opened workspace folder\n2. The file doesn't exist\n3. The file is not a text file\n\nTauri only allows reading files within folders you've opened through File > Open Folder.\n\nError: ${error}`
            }]
          };
        }
      }
      
      case 'write_file': {
        let filePath = arguments_.path;
        const content = arguments_.content;
        
        if (!filePath || content === undefined) {
          throw new Error('File path and content are required');
        }
        
        // If it's a relative path, make it relative to workspace
        if (!filePath.startsWith('/') && workspaceRoot) {
          filePath = `${workspaceRoot}/${filePath}`.replace(/\/+/g, '/');
        }
        
        try {
          await writeTextFile(filePath, content);
          return {
            content: [{
              type: 'text',
              text: `Successfully wrote to ${filePath}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Unable to write to file ${filePath}. This might be because:\n\n1. The location is outside the opened workspace folder\n2. The directory doesn't exist\n3. Insufficient write permissions\n\nTauri only allows writing files within folders you've opened through File > Open Folder.\n\nError: ${error}`
            }]
          };
        }
      }
      
      default:
        throw new Error(`Unknown filesystem tool: ${toolName}`);
    }
  }

  // Get current workspace root
  getWorkspaceRoot(): string | null {
    return this.workspaceRoot;
  }

  private setupDefaultServers() {
    // Filesystem server as default - but don't auto-start until folder is opened
    const defaultPath = '/';
    const filesystemServer: MCPServerConfig = {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', defaultPath],
      description: 'Provides file system operations and navigation',
      category: 'filesystem'
    };

    this.servers.set('filesystem', {
      config: filesystemServer,
      status: 'stopped',
      tools: [],
      resources: []
    });

    // Don't auto-start - wait for workspace to be opened
  }

  // Event handling
  addEventListener(event: string, callback: (event: MCPServerEvent) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (event: MCPServerEvent) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventData: MCPServerEvent = { type: event, data };
      listeners.forEach(callback => callback(eventData));
    }
  }

  // Server management
  async startServer(serverName: string): Promise<boolean> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    if (server.status === 'running') {
      return true;
    }

    try {
      server.status = 'starting';
      this.emit('serverStatusChanged', { serverName, status: 'starting' });

      // Only start the process using Tauri backend - don't create browser-side transport
      await tauriMCPService.startServer(
        serverName,
        server.config.command,
        server.config.args
      );
      
      server.status = 'running';
      server.lastStarted = new Date();
      server.error = undefined;

      // Load mock capabilities for now since we can't use stdio transport in browser
      await this.loadMockCapabilities(serverName);

      this.emit('serverStatusChanged', { serverName, status: 'running' });
      this.emit('serverStarted', { serverName, tools: server.tools, resources: server.resources });

      return true;
    } catch (error) {
      console.error(`Failed to start MCP server ${serverName}:`, error);
      server.status = 'error';
      server.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('serverStatusChanged', { serverName, status: 'error', error: server.error });
      return false;
    }
  }

  async stopServer(serverName: string): Promise<boolean> {
    const server = this.servers.get(serverName);
    if (!server || server.status === 'stopped') {
      return true;
    }

    try {
      // Stop the process using Tauri backend
      await tauriMCPService.stopServer(serverName);
      
      server.client = undefined;
      server.transport = undefined;
      server.status = 'stopped';
      server.tools = [];
      server.resources = [];

      this.emit('serverStatusChanged', { serverName, status: 'stopped' });
      this.emit('serverStopped', { serverName });

      return true;
    } catch (error) {
      console.error(`Failed to stop MCP server ${serverName}:`, error);
      server.status = 'error';
      server.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('serverStatusChanged', { serverName, status: 'error', error: server.error });
      return false;
    }
  }

  async restartServer(serverName: string): Promise<boolean> {
    await this.stopServer(serverName);
    return await this.startServer(serverName);
  }

  // Server configuration
  addServer(config: MCPServerConfig): void {
    if (this.servers.has(config.name)) {
      throw new Error(`Server ${config.name} already exists`);
    }

    this.servers.set(config.name, {
      config,
      status: 'stopped',
      tools: [],
      resources: []
    });

    this.emit('serverAdded', { serverName: config.name, config });
  }

  removeServer(serverName: string): void {
    const server = this.servers.get(serverName);
    if (!server) {
      return;
    }

    if (server.status === 'running') {
      this.stopServer(serverName);
    }

    this.servers.delete(serverName);
    this.emit('serverRemoved', { serverName });
  }

  updateServerConfig(serverName: string, config: Partial<MCPServerConfig>): void {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    server.config = { ...server.config, ...config };
    this.emit('serverConfigUpdated', { serverName, config: server.config });
  }

  // Load mock server capabilities for now
  private async loadMockCapabilities(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      return;
    }

    // Mock tools based on server category
    switch (server.config.category) {
      case 'filesystem':
        server.tools = [
          {
            name: 'read_file',
            description: 'Read the contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Path to the file' }
              },
              required: ['path']
            }
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to write' }
              },
              required: ['path', 'content']
            }
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Path to the directory' }
              },
              required: ['path']
            }
          }
        ];
        server.resources = [
          { uri: 'file:///home', name: 'Home Directory' },
          { uri: 'file:///tmp', name: 'Temporary Directory' }
        ];
        break;
      
      case 'git':
        server.tools = [
          {
            name: 'git_status',
            description: 'Get git repository status',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'git_log',
            description: 'Get git commit history',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Number of commits to show' }
              }
            }
          }
        ];
        break;
        
      default:
        server.tools = [];
        server.resources = [];
    }
  }

  // Tool execution - Use direct filesystem operations for now
  async callTool(serverName: string, toolName: string, arguments_: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${serverName} is not running`);
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverName}`);
    }

    try {
      let result;
      
      // Handle filesystem tools directly using Tauri APIs
      if (serverName === 'filesystem') {
        result = await this.executeFilesystemTool(toolName, arguments_);
      } else {
        // For other servers, try Tauri messaging (when backend is implemented)
        try {
          result = await tauriMCPService.sendMessage(serverName, {
            method: 'tools/call',
            params: {
              name: toolName,
              arguments: arguments_
            }
          });
        } catch (error) {
          throw new Error(`MCP backend not implemented for ${serverName}`);
        }
      }
      
      this.emit('toolCalled', { serverName, toolName, arguments: arguments_, result });
      
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on server ${serverName}:`, error);
      this.emit('toolError', { serverName, toolName, arguments: arguments_, error });
      throw error;
    }
  }

  // Resource access - Use Tauri messaging
  async readResource(serverName: string, uri: string): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${serverName} is not running`);
    }

    try {
      const result = await tauriMCPService.sendMessage(serverName, {
        method: 'resources/read',
        params: {
          uri
        }
      });
      
      this.emit('resourceRead', { serverName, uri, result });
      
      return result;
    } catch (error) {
      console.error(`Failed to read resource ${uri} from server ${serverName}:`, error);
      this.emit('resourceError', { serverName, uri, error });
      throw error;
    }
  }

  // Getters
  getServers(): MCPServerInstance[] {
    return Array.from(this.servers.values());
  }

  getServer(serverName: string): MCPServerInstance | undefined {
    return this.servers.get(serverName);
  }

  getRunningServers(): MCPServerInstance[] {
    return Array.from(this.servers.values()).filter(server => server.status === 'running');
  }

  getAvailableTools(): { serverName: string; tools: MCPTool[] }[] {
    return Array.from(this.servers.values())
      .filter(server => server.status === 'running')
      .map(server => ({
        serverName: server.config.name,
        tools: server.tools
      }));
  }

  getAvailableResources(): { serverName: string; resources: MCPResource[] }[] {
    return Array.from(this.servers.values())
      .filter(server => server.status === 'running')
      .map(server => ({
        serverName: server.config.name,
        resources: server.resources
      }));
  }

  // Pre-configured server templates
  getServerTemplates(): MCPServerConfig[] {
    return [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        description: 'Provides file system operations and navigation',
        category: 'filesystem'
      }
    ];
  }

  // Cleanup
  async cleanup(): Promise<void> {
    const runningServers = this.getRunningServers();
    await Promise.all(
      runningServers.map(server => this.stopServer(server.config.name))
    );
    this.servers.clear();
    this.eventListeners.clear();
  }
}

// Create singleton instance
export const mcpService = new MCPService();
