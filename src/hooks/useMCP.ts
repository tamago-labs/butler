import { useState, useEffect, useCallback } from 'react';
import { 
  mcpService, 
  MCPServerInstance, 
  MCPServerConfig, 
  MCPTool, 
  MCPResource,
  MCPServerEvent 
} from '../services/mcpService';

export interface UseMCPReturn {
  servers: MCPServerInstance[];
  runningServers: MCPServerInstance[];
  availableTools: { serverName: string; tools: MCPTool[] }[];
  availableResources: { serverName: string; resources: MCPResource[] }[];
  serverTemplates: MCPServerConfig[];
  isLoading: boolean;
  error: string | null;
  
  // Server management
  startServer: (serverName: string) => Promise<boolean>;
  stopServer: (serverName: string) => Promise<boolean>;
  restartServer: (serverName: string) => Promise<boolean>;
  addServer: (config: MCPServerConfig) => void;
  removeServer: (serverName: string) => void;
  updateServerConfig: (serverName: string, config: Partial<MCPServerConfig>) => void;
  
  // Tool execution
  callTool: (serverName: string, toolName: string, args: Record<string, any>) => Promise<any>;
  readResource: (serverName: string, uri: string) => Promise<any>;
  
  // Server status
  getServerStatus: (serverName: string) => 'stopped' | 'starting' | 'running' | 'error';
  getServerError: (serverName: string) => string | undefined;
  
  // Utilities
  refreshServers: () => void;
  clearError: () => void;
}

export function useMCP(): UseMCPReturn {
  const [servers, setServers] = useState<MCPServerInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh servers from service
  const refreshServers = useCallback(() => {
    setServers(mcpService.getServers());
  }, []);

  // Initialize and set up event listeners
  useEffect(() => {
    refreshServers();

    // Set up event listeners
    const handleServerStatusChanged = (event: MCPServerEvent) => {
      refreshServers();
      if (event.data.status === 'error') {
        setError(`Server ${event.data.serverName}: ${event.data.error}`);
      }
    };

    const handleServerStarted = (event: MCPServerEvent) => {
      refreshServers();
      console.log(`MCP Server ${event.data.serverName} started with ${event.data.tools.length} tools`);
    };

    const handleServerStopped = (event: MCPServerEvent) => {
      refreshServers();
      console.log(`MCP Server ${event.data.serverName} stopped`);
    };

    const handleServerAdded = (event: MCPServerEvent) => {
      refreshServers();
    };

    const handleServerRemoved = (event: MCPServerEvent) => {
      refreshServers();
    };

    const handleToolCalled = (event: MCPServerEvent) => {
      console.log(`Tool ${event.data.toolName} called on ${event.data.serverName}:`, event.data.result);
    };

    const handleToolError = (event: MCPServerEvent) => {
      setError(`Tool execution failed: ${event.data.error}`);
    };

    // Add event listeners
    mcpService.addEventListener('serverStatusChanged', handleServerStatusChanged);
    mcpService.addEventListener('serverStarted', handleServerStarted);
    mcpService.addEventListener('serverStopped', handleServerStopped);
    mcpService.addEventListener('serverAdded', handleServerAdded);
    mcpService.addEventListener('serverRemoved', handleServerRemoved);
    mcpService.addEventListener('toolCalled', handleToolCalled);
    mcpService.addEventListener('toolError', handleToolError);

    // Cleanup event listeners
    return () => {
      mcpService.removeEventListener('serverStatusChanged', handleServerStatusChanged);
      mcpService.removeEventListener('serverStarted', handleServerStarted);
      mcpService.removeEventListener('serverStopped', handleServerStopped);
      mcpService.removeEventListener('serverAdded', handleServerAdded);
      mcpService.removeEventListener('serverRemoved', handleServerRemoved);
      mcpService.removeEventListener('toolCalled', handleToolCalled);
      mcpService.removeEventListener('toolError', handleToolError);
    };
  }, [refreshServers]);

  // Server management functions
  const startServer = useCallback(async (serverName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mcpService.startServer(serverName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start server ${serverName}: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopServer = useCallback(async (serverName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mcpService.stopServer(serverName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to stop server ${serverName}: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restartServer = useCallback(async (serverName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mcpService.restartServer(serverName);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to restart server ${serverName}: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addServer = useCallback((config: MCPServerConfig) => {
    try {
      mcpService.addServer(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to add server: ${errorMessage}`);
    }
  }, []);

  const removeServer = useCallback((serverName: string) => {
    try {
      mcpService.removeServer(serverName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to remove server: ${errorMessage}`);
    }
  }, []);

  const updateServerConfig = useCallback((serverName: string, config: Partial<MCPServerConfig>) => {
    try {
      mcpService.updateServerConfig(serverName, config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update server config: ${errorMessage}`);
    }
  }, []);

  // Tool execution functions
  const callTool = useCallback(async (serverName: string, toolName: string, args: Record<string, any>): Promise<any> => {
    setError(null);
    try {
      return await mcpService.callTool(serverName, toolName, args);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Tool execution failed: ${errorMessage}`);
      throw err;
    }
  }, []);

  const readResource = useCallback(async (serverName: string, uri: string): Promise<any> => {
    setError(null);
    try {
      return await mcpService.readResource(serverName, uri);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Resource read failed: ${errorMessage}`);
      throw err;
    }
  }, []);

  // Status functions
  const getServerStatus = useCallback((serverName: string): 'stopped' | 'starting' | 'running' | 'error' => {
    const server = mcpService.getServer(serverName);
    return server?.status || 'stopped';
  }, [servers]);

  const getServerError = useCallback((serverName: string): string | undefined => {
    const server = mcpService.getServer(serverName);
    return server?.error;
  }, [servers]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const runningServers = mcpService.getRunningServers();
  const availableTools = mcpService.getAvailableTools();
  const availableResources = mcpService.getAvailableResources();
  const serverTemplates = mcpService.getServerTemplates();

  return {
    servers,
    runningServers,
    availableTools,
    availableResources,
    serverTemplates,
    isLoading,
    error,
    
    // Server management
    startServer,
    stopServer,
    restartServer,
    addServer,
    removeServer,
    updateServerConfig,
    
    // Tool execution
    callTool,
    readResource,
    
    // Server status
    getServerStatus,
    getServerError,
    
    // Utilities
    refreshServers,
    clearError
  };
}
