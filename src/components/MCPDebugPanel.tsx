import React, { useEffect, useState } from 'react';
import { mcpService } from '../services/mcpService';
import { invoke } from '@tauri-apps/api/core';

/**
 * Minimal MCP test component for debugging
 * Use this to test individual parts of the MCP implementation
 */
const MCPDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [tauriWorking, setTauriWorking] = useState<boolean | null>(null);
  const [mcpServiceWorking, setMcpServiceWorking] = useState<boolean | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('MCPDebugPanel mounted');

    // Test MCP Service
    try {
      const servers = mcpService.getServers();
      addLog(`MCP Service working: ${servers.length} servers found`);
      setMcpServiceWorking(true);
    } catch (error) {
      addLog(`MCP Service error: ${error}`);
      setMcpServiceWorking(false);
    }

    // Test Tauri Commands
    const testTauri = async () => {
      try {
        const result = await invoke<string>('greet', { name: 'MCP Test' });
        addLog(`Tauri working: ${result}`);
        setTauriWorking(true);
      } catch (error) {
        addLog(`Tauri error: ${error}`);
        setTauriWorking(false);
      }
    };

    testTauri();
  }, []);

  const testMCPCommands = async () => {
    addLog('Testing MCP commands...');

    try {
      // Test server list
      const servers = await invoke<string[]>('list_mcp_servers');
      addLog(`Current servers: ${servers.join(', ') || 'none'}`);

      // Test starting a simple server
      const result = await invoke<string>('start_mcp_server', {
        serverName: 'test-echo',
        command: 'echo',
        args: ['Hello MCP']
      });
      addLog(`Start server result: ${result}`);

      // List servers again
      const serversAfter = await invoke<string[]>('list_mcp_servers');
      addLog(`Servers after start: ${serversAfter.join(', ')}`);
    } catch (error) {
      addLog(`MCP command error: ${error}`);
    }
  };

  const testMCPService = async () => {
    addLog('Testing MCP service...');

    try {
      // Add a test server
      mcpService.addServer({
        name: 'debug-test',
        command: 'echo',
        args: ['test'],
        description: 'Debug test server',
        category: 'custom'
      });
      addLog('Added test server to MCP service');

      // List servers
      const servers = mcpService.getServers();
      addLog(`MCP service servers: ${servers.map(s => s.config.name).join(', ')}`);

      // Try to start server
      const success = await mcpService.startServer('debug-test');
      addLog(`Start server success: ${success}`);

    } catch (error) {
      addLog(`MCP service test error: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-4 bg-gray-800 text-white min-h-screen">
      <h1 className="text-xl font-bold mb-4">🔧 MCP Debug Panel</h1>
      
      {/* Status Indicators */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            tauriWorking === null ? 'bg-yellow-500' :
            tauriWorking ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span>Tauri Commands: {tauriWorking === null ? 'Testing...' : tauriWorking ? 'Working' : 'Failed'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            mcpServiceWorking === null ? 'bg-yellow-500' :
            mcpServiceWorking ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span>MCP Service: {mcpServiceWorking === null ? 'Testing...' : mcpServiceWorking ? 'Working' : 'Failed'}</span>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-4 space-x-2">
        <button
          onClick={testMCPCommands}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Test MCP Commands
        </button>
        
        <button
          onClick={testMCPService}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Test MCP Service
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 rounded p-4 font-mono text-sm max-h-96 overflow-y-auto">
        <h3 className="text-lg mb-2">📝 Debug Logs</h3>
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-green-400 mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Quick Info */}
      <div className="mt-4 text-sm text-gray-400">
        <p>💡 This debug panel helps identify issues with:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Tauri command communication</li>
          <li>MCP service initialization</li>
          <li>Server management functionality</li>
        </ul>
        <p className="mt-2">Check browser console for additional error details.</p>
      </div>
    </div>
  );
};

export default MCPDebugPanel;