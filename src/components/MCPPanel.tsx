import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Terminal, 
  Play, 
  Square, 
  RefreshCw, 
  Plus, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Wrench,
  Database,
  FileText
} from 'lucide-react';
import { useMCP } from '../hooks/useMCP';

const MCPPanel: React.FC = () => {
  const {
    servers,
    runningServers,
    availableTools,
    availableResources,
    serverTemplates,
    isLoading,
    error,
    startServer,
    stopServer,
    restartServer,
    addServer,
    getServerStatus,
    getServerError,
    clearError
  } = useMCP();

  const [showAddServer, setShowAddServer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customArgs, setCustomArgs] = useState<string>('');

  // Auto-refresh server status
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a refresh of the server list
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartServer = async (serverName: string) => {
    await startServer(serverName);
  };

  const handleStopServer = async (serverName: string) => {
    await stopServer(serverName);
  };

  const handleRestartServer = async (serverName: string) => {
    await restartServer(serverName);
  };

  const handleAddCustomServer = () => {
    const template = serverTemplates.find(t => t.name === selectedTemplate);
    if (!template) return;

    const args = customArgs.trim() ? customArgs.split(' ') : template.args;
    
    addServer({
      ...template,
      name: `${template.name}-${Date.now()}`,
      args
    });

    setShowAddServer(false);
    setSelectedTemplate('');
    setCustomArgs('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'starting':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTotalToolCount = () => {
    return availableTools.reduce((total, server) => total + server.tools.length, 0);
  };

  const getTotalResourceCount = () => {
    return availableResources.reduce((total, server) => total + server.resources.length, 0);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar-bg">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-accent" />
            <h3 className="font-medium text-text-primary">MCP Servers</h3>
          </div>
          <button
            onClick={() => setShowAddServer(true)}
            className="p-1 hover:bg-gray-700 rounded text-text-muted hover:text-text-primary"
            title="Add Server"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-800 rounded p-2 text-center">
            <div className="text-text-primary font-medium">{runningServers.length}</div>
            <div className="text-text-muted">Running</div>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <div className="text-text-primary font-medium">{getTotalToolCount()}</div>
            <div className="text-text-muted">Tools</div>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <div className="text-text-primary font-medium">{getTotalResourceCount()}</div>
            <div className="text-text-muted">Resources</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-2 bg-red-900/50 border border-red-500 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="text-red-200">{error}</span>
              <button 
                onClick={clearError}
                className="text-red-400 hover:text-red-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {servers.map((server) => (
            <div
              key={server.config.name}
              className="border border-border rounded-lg p-3 bg-gray-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(server.status)}
                  <span className="font-medium text-text-primary text-sm">
                    {server.config.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {server.status === 'running' ? (
                    <>
                      <button
                        onClick={() => handleRestartServer(server.config.name)}
                        className="p-1 hover:bg-gray-700 rounded text-text-muted hover:text-text-primary"
                        title="Restart"
                        disabled={isLoading}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStopServer(server.config.name)}
                        className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300"
                        title="Stop"
                        disabled={isLoading}
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartServer(server.config.name)}
                      className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300"
                      title="Start"
                      disabled={isLoading || server.status === 'starting'}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-text-muted mb-2">
                {server.config.description}
              </div>

              {server.status === 'error' && server.error && (
                <div className="text-xs text-red-400 mb-2">
                  Error: {server.error}
                </div>
              )}

              {server.status === 'running' && (
                <div className="space-y-2">
                  {/* Tools */}
                  {server.tools.length > 0 && (
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Wrench className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-text-muted">Tools ({server.tools.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {server.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool.name}
                            className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs"
                            title={tool.description}
                          >
                            {tool.name}
                          </span>
                        ))}
                        {server.tools.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-700 text-text-muted rounded text-xs">
                            +{server.tools.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {server.resources.length > 0 && (
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Database className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-text-muted">Resources ({server.resources.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {server.resources.slice(0, 2).map((resource) => (
                          <span
                            key={resource.uri}
                            className="px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded text-xs"
                            title={resource.description || resource.uri}
                          >
                            {resource.name}
                          </span>
                        ))}
                        {server.resources.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-700 text-text-muted rounded text-xs">
                            +{server.resources.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {server.tools.length === 0 && server.resources.length === 0 && (
                    <div className="text-xs text-text-muted italic">
                      No tools or resources available
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {servers.length === 0 && (
            <div className="text-center text-text-muted py-8">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No MCP servers configured</p>
              <p className="text-xs mt-1">Click + to add a server</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Server Modal */}
      {showAddServer && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-sidebar-bg border border-border rounded-lg p-4 w-full max-w-md">
            <h4 className="font-medium text-text-primary mb-3">Add MCP Server</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Server Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-gray-700 border border-border rounded px-2 py-1 text-sm text-text-primary"
                >
                  <option value="">Select a template...</option>
                  {serverTemplates.map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div>
                  <label className="block text-xs text-text-muted mb-1">
                    Custom Arguments (optional)
                  </label>
                  <input
                    type="text"
                    value={customArgs}
                    onChange={(e) => setCustomArgs(e.target.value)}
                    placeholder="Enter custom arguments..."
                    className="w-full bg-gray-700 border border-border rounded px-2 py-1 text-sm text-text-primary"
                  />
                  <div className="text-xs text-text-muted mt-1">
                    Leave empty to use default arguments
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddCustomServer}
                disabled={!selectedTemplate}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-1.5 px-3 rounded text-sm font-medium"
              >
                Add Server
              </button>
              <button
                onClick={() => setShowAddServer(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-text-primary py-1.5 px-3 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPPanel;
