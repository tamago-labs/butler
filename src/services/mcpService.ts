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

  constructor() {
    this.setupDefaultServers();
  }

  private setupDefaultServers() {
    // Filesystem server as default - Use a safe default path
    const defaultPath = typeof window !== 'undefined' ? '/' : process.cwd() || '/';
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

      // Start the process using Tauri backend
      await tauriMCPService.startServer(
        serverName,
        server.config.command,
        server.config.args
      );

      // For now, we'll simulate the MCP client connection
      // In a real implementation, we'd need to establish stdio communication
      // with the process started by Tauri
      
      // Simulate successful connection
      server.status = 'running';
      server.lastStarted = new Date();
      server.error = undefined;

      // Load mock capabilities for demo purposes
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

  // Capabilities - Mock implementation for demo
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
        
      case 'database':
        server.tools = [
          {
            name: 'execute_query',
            description: 'Execute a SQL query',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL query to execute' }
              },
              required: ['query']
            }
          }
        ];
        break;
        
      case 'web':
        server.tools = [
          {
            name: 'search_web',
            description: 'Search the web',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          }
        ];
        break;
        
      default:
        server.tools = [];
        server.resources = [];
    }
  }

  // Tool execution - Mock implementation for demo
  async callTool(serverName: string, toolName: string, arguments_: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server ${serverName} is not running`);
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverName}`);
    }

    try {
      // Mock tool execution
      let mockResult;
      
      switch (toolName) {
        case 'read_file':
          mockResult = {
            content: [
              {
                type: 'text',
                text: `Mock file content for: ${arguments_.path}`
              }
            ]
          };
          break;
          
        case 'write_file':
          mockResult = {
            content: [
              {
                type: 'text',
                text: `Successfully wrote to ${arguments_.path}`
              }
            ]
          };
          break;
          
        case 'list_directory':
          mockResult = {
            content: [
              {
                type: 'text',
                text: `Directory listing for ${arguments_.path}:\nfile1.txt\nfile2.js\nsubfolder/`
              }
            ]
          };
          break;
          
        case 'git_status':
          mockResult = {
            content: [
              {
                type: 'text',
                text: 'On branch main\nYour branch is up to date with origin/main.\n\nnothing to commit, working tree clean'
              }
            ]
          };
          break;
          
        default:
          mockResult = {
            content: [
              {
                type: 'text',
                text: `Mock result for tool ${toolName} with arguments: ${JSON.stringify(arguments_)}`
              }
            ]
          };
      }
      
      this.emit('toolCalled', { serverName, toolName, arguments: arguments_, result: mockResult });
      
      return mockResult;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on server ${serverName}:`, error);
      this.emit('toolError', { serverName, toolName, arguments: arguments_, error });
      throw error;
    }
  }

  // Resource access - Mock implementation for demo
  async readResource(serverName: string, uri: string): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server ${serverName} is not running`);
    }

    try {
      // Mock resource reading
      const mockResult = {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Mock resource content for: ${uri}`
          }
        ]
      };
      
      this.emit('resourceRead', { serverName, uri, result: mockResult });
      
      return mockResult;
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
      },
      {
        name: 'git',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git'],
        description: 'Git repository management and operations',
        category: 'git'
      },
      {
        name: 'sqlite',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite'],
        description: 'SQLite database operations',
        category: 'database'
      },
      {
        name: 'postgres',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        description: 'PostgreSQL database operations',
        category: 'database'
      },
      {
        name: 'brave-search',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        description: 'Web search using Brave Search API',
        category: 'web'
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
