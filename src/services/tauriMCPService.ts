import { invoke } from '@tauri-apps/api/core';

export interface TauriMCPService {
  connectServer(serverName: string, command: string, args: string[]): Promise<string>;
  connectServerWithEnv(serverName: string, command: string, args: string[], env: Record<string, string>): Promise<string>;
  disconnectServer(serverName: string): Promise<string>;
  listConnectedServers(): Promise<string[]>;
  listTools(serverName: string): Promise<any>;
  callTool(serverName: string, toolName: string, args: any): Promise<any>;
  listResources(serverName: string): Promise<any>;
  readResource(serverName: string, uri: string): Promise<any>;
}

export class TauriMCPServiceImpl implements TauriMCPService {
  async connectServer(serverName: string, command: string, args: string[]): Promise<string> {
    try {
      const result = await invoke<string>('connect_mcp_server', {
        serverName,
        command,
        args
      });
      return result;
    } catch (error) {
      console.error(`Failed to connect MCP server ${serverName}:`, error);
      throw new Error(`Failed to connect server: ${error}`);
    }
  }

  async connectServerWithEnv(serverName: string, command: string, args: string[], env: Record<string, string>): Promise<string> {
    try {
      const result = await invoke<string>('connect_mcp_server_with_env', {
        serverName,
        command,
        args,
        env
      });
      return result;
    } catch (error) {
      console.error(`Failed to connect MCP server ${serverName} with env:`, error);
      // Fallback to regular connect if Tauri backend doesn't support env yet
      console.warn('Falling back to regular connect without env vars');
      return this.connectServer(serverName, command, args);
    }
  }

  async disconnectServer(serverName: string): Promise<string> {
    try {
      const result = await invoke<string>('disconnect_mcp_server', {
        serverName
      });
      return result;
    } catch (error) {
      console.error(`Failed to disconnect MCP server ${serverName}:`, error);
      throw new Error(`Failed to disconnect server: ${error}`);
    }
  }

  async listConnectedServers(): Promise<string[]> {
    try {
      const result = await invoke<string[]>('list_connected_servers');
      return result;
    } catch (error) {
      console.error('Failed to list connected MCP servers:', error);
      throw new Error(`Failed to list servers: ${error}`);
    }
  }

  async listTools(serverName: string): Promise<any> {
    try {
      const result = await invoke<any>('list_mcp_tools', {
        serverName
      });
      return result;
    } catch (error) {
      console.error(`Failed to list tools from MCP server ${serverName}:`, error);
      throw new Error(`Failed to list tools: ${error}`);
    }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    try {
      const result = await invoke<any>('call_mcp_tool', {
        serverName,
        toolName,
        arguments: args
      });
      
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName} on MCP server ${serverName}:`, error);
      throw new Error(`Failed to call tool: ${error}`);
    }
  }

  async listResources(serverName: string): Promise<any> {
    try {
      const result = await invoke<any>('list_mcp_resources', {
        serverName
      });
      return result;
    } catch (error) {
      console.error(`Failed to list resources from MCP server ${serverName}:`, error);
      throw new Error(`Failed to list resources: ${error}`);
    }
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    try {
      const result = await invoke<any>('read_mcp_resource', {
        serverName,
        uri
      });
      return result;
    } catch (error) {
      console.error(`Failed to read resource ${uri} from MCP server ${serverName}:`, error);
      throw new Error(`Failed to read resource: ${error}`);
    }
  }

  // Legacy methods for backward compatibility
  async startServer(serverName: string, command: string, args: string[]): Promise<string> {
    return this.connectServer(serverName, command, args);
  }

  async stopServer(serverName: string): Promise<string> {
    return this.disconnectServer(serverName);
  }

  async listServers(): Promise<string[]> {
    return this.listConnectedServers();
  }

  async sendMessage(serverName: string, message: any): Promise<any> {
    // This method was used for generic messaging, now we have specific methods
    if (message.method === 'tools/list') {
      return this.listTools(serverName);
    } else if (message.method === 'tools/call') {
      return this.callTool(serverName, message.params.name, message.params.arguments);
    } else if (message.method === 'resources/list') {
      return this.listResources(serverName);
    } else if (message.method === 'resources/read') {
      return this.readResource(serverName, message.params.uri);
    } else {
      throw new Error(`Unsupported message method: ${message.method}`);
    }
  }
}

// Create singleton instance
export const tauriMCPService = new TauriMCPServiceImpl();
