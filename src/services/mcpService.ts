import { tauriMCPService } from './tauriMCPService';
import { Logger } from '../components/LogsPanel';

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
  private logger = Logger.getInstance();

  constructor() {
    this.setupDefaultServers();
    this.logger.info('mcp', 'MCP Service initialized');
  }

  setWorkspaceRoot(path: string | null) {
    this.logger.info('mcp', `Setting current folder to: ${path}`);
    this.workspaceRoot = path;
    const fsServer = this.servers.get('filesystem');
    if (fsServer && path) {
      this.logger.info('mcp', `Updating filesystem server args with new folder: ${path}`);
      fsServer.config.args = ['-y', '@modelcontextprotocol/server-filesystem', path];
      
      if (fsServer.status === 'running') {
        this.logger.info('mcp', `Restarting filesystem server with new folder: ${path}`);
        this.restartServer('filesystem').then(() => {
          this.logger.info('mcp', `Filesystem server restarted successfully with folder: ${path}`);
        }).catch(err => {
          this.logger.error('mcp', `Failed to restart filesystem server: ${err.message}`);
        });
      } else {
        this.logger.info('mcp', `Starting filesystem server with folder: ${path}`);
        this.startServer('filesystem').then(() => {
          this.logger.info('mcp', `Filesystem server started successfully with folder: ${path}`);
        }).catch(err => {
          this.logger.error('mcp', `Failed to start filesystem server: ${err.message}`);
        });
      }
    } else if (!path) {
      this.logger.info('mcp', 'No folder path provided, stopping filesystem server');
      if (fsServer && fsServer.status === 'running') {
        this.stopServer('filesystem');
      }
    }
  }

  getWorkspaceRoot(): string | null {
    return this.workspaceRoot;
  }

  private setupDefaultServers() {
    const filesystemServer: MCPServerConfig = {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/'],
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

      this.logger.info('mcp', `Starting MCP server ${serverName}`, {
        command: server.config.command,
        args: server.config.args
      });

      // Connect to MCP server using real protocol
      await tauriMCPService.connectServer(
        serverName,
        server.config.command,
        server.config.args
      );
      
      // Load real tools from the server
      const toolsResponse = await tauriMCPService.listTools(serverName);
      server.tools = this.formatMCPTools(toolsResponse);
      this.logger.info('mcp', `Loaded ${server.tools.length} tools from ${serverName}`, {
        tools: server.tools.map(t => t.name)
      });

      // Only try to load resources if server supports it (skip for filesystem)
      if (serverName !== 'filesystem') {
        try {
          const resourcesResponse = await tauriMCPService.listResources(serverName);
          server.resources = this.formatMCPResources(resourcesResponse);
        } catch (error) {
          console.log(`Server ${serverName} doesn't support resources:`, error);
          server.resources = [];
        }
      } else {
        server.resources = [];
      }

      server.status = 'running';
      server.lastStarted = new Date();
      server.error = undefined;

      this.logger.info('mcp', `MCP server ${serverName} started successfully`);
      this.emit('serverStatusChanged', { serverName, status: 'running' });
      this.emit('serverStarted', { serverName, tools: server.tools, resources: server.resources });

      return true;
    } catch (error) {
      this.logger.error('mcp', `Failed to start MCP server ${serverName}`, { error: error.message });
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
      await tauriMCPService.disconnectServer(serverName);
      
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
    console.log(`Restarting server ${serverName}`);
    
    // For filesystem server, make sure it fully stops before starting
    if (serverName === 'filesystem') {
      const server = this.servers.get(serverName);
      if (server) {
        console.log('Filesystem server config before restart:', server.config);
      }
    }
    
    await this.stopServer(serverName);
    
    // Add a small delay to ensure complete shutdown
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await this.startServer(serverName);
  }

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
    // Prevent removing the default filesystem server
    if (serverName === 'filesystem') {
      throw new Error('Cannot remove the default filesystem server');
    }

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

  private formatMCPTools(toolsResponse: any): MCPTool[] {
    if (!toolsResponse || !toolsResponse.result || !toolsResponse.result.tools) {
      return [];
    }

    return toolsResponse.result.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description || tool.name,
      inputSchema: tool.inputSchema || {}
    }));
  }

  private formatMCPResources(resourcesResponse: any): MCPResource[] {
    if (!resourcesResponse || !resourcesResponse.result || !resourcesResponse.result.resources) {
      return [];
    }

    return resourcesResponse.result.resources.map((resource: any) => ({
      uri: resource.uri,
      name: resource.name || resource.uri,
      description: resource.description,
      mimeType: resource.mimeType
    }));
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    
    console.log("calltool: ", serverName, toolName, args)
    
    const server = this.servers.get(serverName);
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${serverName} is not running`);
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverName}`);
    }

    try {

      console.log("before tauri mcp...")

      const result = await tauriMCPService.callTool(serverName, toolName, args);
      
      this.emit('toolCalled', { serverName, toolName, arguments: args, result });
      
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on server ${serverName}:`, error);
      this.emit('toolError', { serverName, toolName, arguments: args, error });
      throw error;
    }
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server || server.status !== 'running') {
      throw new Error(`Server ${serverName} is not running`);
    }

    try {
      const result = await tauriMCPService.readResource(serverName, uri);
      
      this.emit('resourceRead', { serverName, uri, result });
      
      return result;
    } catch (error) {
      console.error(`Failed to read resource ${uri} from server ${serverName}:`, error);
      this.emit('resourceError', { serverName, uri, error });
      throw error;
    }
  }

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

  getServerTemplates(): MCPServerConfig[] {
    return [
      {
        name: 'git',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git'],
        description: 'Git repository operations and history',
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
        name: 'web-search',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-web-search'],
        description: 'Web search and scraping capabilities',
        category: 'web'
      }
    ];
  }

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
