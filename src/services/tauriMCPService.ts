import { invoke } from '@tauri-apps/api/core';

export interface TauriMCPService {
  startServer(serverName: string, command: string, args: string[]): Promise<string>;
  stopServer(serverName: string): Promise<string>;
  listServers(): Promise<string[]>;
  sendMessage(serverName: string, message: any): Promise<any>;
}

export class TauriMCPServiceImpl implements TauriMCPService {
  async startServer(serverName: string, command: string, args: string[]): Promise<string> {
    try {
      const result = await invoke<string>('start_mcp_server', {
        serverName,
        command,
        args
      });
      return result;
    } catch (error) {
      console.error(`Failed to start MCP server ${serverName}:`, error);
      throw new Error(`Failed to start server: ${error}`);
    }
  }

  async stopServer(serverName: string): Promise<string> {
    try {
      const result = await invoke<string>('stop_mcp_server', {
        serverName
      });
      return result;
    } catch (error) {
      console.error(`Failed to stop MCP server ${serverName}:`, error);
      throw new Error(`Failed to stop server: ${error}`);
    }
  }

  async listServers(): Promise<string[]> {
    try {
      const result = await invoke<string[]>('list_mcp_servers');
      return result;
    } catch (error) {
      console.error('Failed to list MCP servers:', error);
      throw new Error(`Failed to list servers: ${error}`);
    }
  }

  async sendMessage(serverName: string, message: any): Promise<any> {
    try {
      const result = await invoke<any>('send_mcp_message', {
        serverName,
        message: JSON.stringify(message)
      });
      return JSON.parse(result);
    } catch (error) {
      console.error(`Failed to send message to MCP server ${serverName}:`, error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }
}

// Create singleton instance
export const tauriMCPService = new TauriMCPServiceImpl();