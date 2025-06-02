// import { useState, useCallback, useEffect } from 'react';
// // import { invoke } from '@tauri-apps/api';

// export interface MCPServer {
//   name: string;
//   command: string;
//   args: string[];
//   status: 'running' | 'stopped' | 'error' | 'starting';
// }

// export const useMCP = () => {
//   const [servers, setServers] = useState<MCPServer[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const loadServers = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       // const serverList = await invoke<MCPServer[]>('list_mcp_servers');
//       // setServers(serverList);
//     } catch (error) {
//       console.error('Failed to load MCP servers:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const startServer = useCallback(async (name: string) => {
//     try {
//       const server = servers.find(s => s.name === name);
//       if (!server) throw new Error('Server not found');

//       // Update status to starting
//       setServers(prev => prev.map(s => 
//         s.name === name ? { ...s, status: 'starting' } : s
//       ));

//       await invoke('start_mcp_server', {
//         name: server.name,
//         command: server.command,
//         args: server.args
//       });

//       // Update status to running
//       setServers(prev => prev.map(s => 
//         s.name === name ? { ...s, status: 'running' } : s
//       ));
//     } catch (error) {
//       console.error(`Failed to start MCP server ${name}:`, error);
      
//       // Update status to error
//       setServers(prev => prev.map(s => 
//         s.name === name ? { ...s, status: 'error' } : s
//       ));
//     }
//   }, [servers]);

//   const stopServer = useCallback(async (name: string) => {
//     try {
//       await invoke('stop_mcp_server', { name });
      
//       setServers(prev => prev.map(s => 
//         s.name === name ? { ...s, status: 'stopped' } : s
//       ));
//     } catch (error) {
//       console.error(`Failed to stop MCP server ${name}:`, error);
//     }
//   }, []);

//   const refreshServers = useCallback(async () => {
//     await loadServers();
//   }, [loadServers]);

//   const addServer = useCallback(async (server: Omit<MCPServer, 'status'>) => {
//     const newServer: MCPServer = {
//       ...server,
//       status: 'stopped'
//     };
    
//     setServers(prev => [...prev, newServer]);
    
//     // In a real implementation, you might want to persist this to a config file
//     // await invoke('add_mcp_server', { server: newServer });
//   }, []);

//   const removeServer = useCallback(async (name: string) => {
//     setServers(prev => prev.filter(s => s.name !== name));
    
//     // In a real implementation, you might want to persist this change
//     // await invoke('remove_mcp_server', { name });
//   }, []);

//   const getServerStatus = useCallback((name: string) => {
//     const server = servers.find(s => s.name === name);
//     return server?.status || 'stopped';
//   }, [servers]);

//   const getRunningServers = useCallback(() => {
//     return servers.filter(s => s.status === 'running');
//   }, [servers]);

//   const executeServerCommand = useCallback(async (
//     serverName: string, 
//     command: string, 
//     args: Record<string, any> = {}
//   ) => {
//     try {
//       const server = servers.find(s => s.name === serverName);
//       if (!server || server.status !== 'running') {
//         throw new Error(`Server ${serverName} is not running`);
//       }

//       // This would be implemented to send commands to the MCP server
//       // The actual implementation would depend on the MCP protocol
//       const result = await invoke('execute_mcp_command', {
//         serverName,
//         command,
//         args
//       });

//       return result;
//     } catch (error) {
//       console.error(`Failed to execute command on ${serverName}:`, error);
//       throw error;
//     }
//   }, [servers]);

//   const getAvailableTools = useCallback(async (serverName: string) => {
//     try {
//       const tools = await invoke<string[]>('get_mcp_tools', { serverName });
//       return tools;
//     } catch (error) {
//       console.error(`Failed to get tools for ${serverName}:`, error);
//       return [];
//     }
//   }, []);

//   // Load servers on mount
//   useEffect(() => {
//     loadServers();
//   }, [loadServers]);

//   return {
//     servers,
//     isLoading,
//     startServer,
//     stopServer,
//     refreshServers,
//     addServer,
//     removeServer,
//     getServerStatus,
//     getRunningServers,
//     executeServerCommand,
//     getAvailableTools,
//     loadServers
//   };
// };