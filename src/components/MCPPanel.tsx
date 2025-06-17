import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Activity,
  Database,
  FileText,
  GitBranch,
  Globe,
  Server,
  X,
  Clock,
  Wrench,
  Book,
  ArrowLeft,
  Loader,
  ExternalLink
} from 'lucide-react';
import { useMCP } from '../hooks/useMCP';
import { MCPServerConfig } from '../services/mcpService';


const MCPPanel = () => {
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
    removeServer,
    refreshServers,
    clearError
  } = useMCP();

  const [activeSection, setActiveSection] = useState<'servers' | 'templates' | 'tools' | 'logs'>('servers');
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [customServerForm, setCustomServerForm] = useState<MCPServerConfig>({
    name: '',
    command: '',
    args: [],
    description: '',
    category: 'custom'
  });
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const getServerIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'filesystem': <FileText className="w-4 h-4" />,
      'git': <GitBranch className="w-4 h-4" />,
      'database': <Database className="w-4 h-4" />,
      'web': <Globe className="w-4 h-4" />,
      'custom': <Server className="w-4 h-4" />,
    };
    return iconMap[category] || <Server className="w-4 h-4" />;
  };

  const getStatusColor = (status: 'stopped' | 'starting' | 'running' | 'error') => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'starting':
        return 'text-yellow-400';
      case 'stopped':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: 'stopped' | 'starting' | 'running' | 'error') => {
    switch (status) {
      case 'running':
        return <CheckCircle className={`w-4 h-4 ${getStatusColor(status)}`} />;
      case 'error':
        return <AlertCircle className={`w-4 h-4 ${getStatusColor(status)}`} />;
      case 'starting':
        return <Loader className={`w-4 h-4 ${getStatusColor(status)} animate-spin`} />;
      case 'stopped':
        return <Square className={`w-4 h-4 ${getStatusColor(status)}`} />;
      default:
        return <Square className={`w-4 h-4 ${getStatusColor(status)}`} />;
    }
  };

  const handleAddServerFromTemplate = (template: MCPServerConfig) => {
    // If adding filesystem server and none exists, use current workspace or root directory
    if (template.category === 'filesystem' && !servers.find(s => s.config.category === 'filesystem')) {
      const workingDir = '/home/pisuthd/Desktop/tamago-labs/butler'; // Current project directory
      const filesystemConfig: MCPServerConfig = {
        ...template,
        args: [...template.args, workingDir]
      };
      addServer(filesystemConfig);
    } else {
      addServer(template);
    }
    setActiveSection('servers');
  };
  
  const renderServers = () => (
    <div className="p-4 space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">MCP Servers</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('templates')}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Add Server"
          >
            <Plus className="w-4 h-4 text-accent" />
          </button>
          <button
            onClick={refreshServers}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 text-text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {servers.map((server) => (
          <div
            key={server.config.name}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getServerIcon(server.config.category)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary capitalize">
                      {server.config.name}
                    </span>
                    {getStatusIcon(server.status)}
                  </div>
                  <div className={`text-xs ${getStatusColor(server.status)}`}>
                    {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                    {server.error && ` - ${server.error}`}
                  </div>
                  <div className="text-xs text-text-muted">
                    {server.config.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {server.status === 'running' && (
                  <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">
                    {server.tools.length} tools
                  </span>
                )}
                <button
                  onClick={() => setSelectedServer(server.config.name)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                  title="Server Details"
                >
                  <Settings className="w-4 h-4 text-text-muted" />
                </button>
                <button
                  onClick={() => removeServer(server.config.name)}
                  className="p-1 hover:bg-red-600 rounded transition-colors"
                  title="Remove Server"
                >
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
                <button
                  onClick={() => {
                    const action = server.status === 'running' ? stopServer : startServer;
                    action(server.config.name);
                  }}
                  className={`p-2 rounded transition-colors ${server.status === 'running'
                    ? 'hover:bg-red-600 text-red-400'
                    : 'hover:bg-green-600 text-green-400'
                    }`}
                  title={
                    server.status === 'running'
                      ? `Stop ${server.config.name}`
                      : `Start ${server.config.name}`
                  }
                  disabled={isLoading || server.status === 'starting'}
                >
                  {server.status === 'running' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {server.status === 'running' && server.tools.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                  <Activity className="w-3 h-3" />
                  <span>Active • {server.tools.length} tools available</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {server.tools.slice(0, 3).map((tool) => (
                    <span
                      key={tool.name}
                      className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded"
                    >
                      {tool.name}
                    </span>
                  ))}
                  {server.tools.length > 3 && (
                    <span className="text-xs text-text-muted">+{server.tools.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {servers.length === 0 && (
          <div className="text-center py-8">
            <Terminal className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <h4 className="text-sm font-medium text-text-primary mb-2">No MCP Servers</h4>
            <p className="text-sm text-text-muted mb-4">
              Add MCP servers to extend AI capabilities with external tools and data sources.
            </p>
            <button
              onClick={() => setActiveSection('templates')}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm"
            >
              Browse Templates
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Server Templates</h3>
        <button
          onClick={() => setActiveSection('servers')}
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servers
        </button>
      </div>

      <div className="space-y-3">
        {serverTemplates.map((template) => {
          const isInstalled = servers.some(s => s.config.name === template.name);
          return (
            <div
              key={template.name}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getServerIcon(template.category)}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text-primary mb-1">
                      {template.name}
                      {isInstalled && (
                        <span className="ml-2 text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">
                          Installed
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-text-muted mb-2">
                      {template.description}
                    </p>
                    <div className="text-xs text-text-muted">
                      Command: <code className="bg-gray-800 px-1 rounded">{template.command} {template.args.join(' ')}</code>
                    </div>
                  </div>
                </div>

                <button
                  className={`px-3 py-1 rounded transition-colors text-sm ${isInstalled
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-hover'
                    }`}
                  onClick={() => !isInstalled && handleAddServerFromTemplate(template)}
                  disabled={isInstalled}
                >
                  {isInstalled ? 'Added' : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );

  const renderTools = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Available Tools</h3>
        <button
          onClick={() => setActiveSection('servers')}
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servers
        </button>
      </div>

      {availableTools.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h4 className="text-sm font-medium text-text-primary mb-2">No Tools Available</h4>
          <p className="text-sm text-text-muted mb-4">
            Start an MCP server to see available tools.
          </p>
          <button
            onClick={() => setActiveSection('servers')}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm"
          >
            Manage Servers
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {availableTools.map(({ serverName, tools }) => (
            <div key={serverName} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getServerIcon(servers.find(s => s.config.name === serverName)?.config.category || 'custom')}
                <h4 className="text-sm font-medium text-text-primary capitalize">{serverName}</h4>
                <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                  {tools.length} tools
                </span>
              </div>
              <div className="space-y-2">
                {tools.map((tool) => (
                  <div key={tool.name} className="bg-gray-800 rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-text-primary mb-1">{tool.name}</h5>
                        <p className="text-xs text-text-muted mb-2">{tool.description}</p>
                        {tool.inputSchema && tool.inputSchema.properties && (
                          <div className="text-xs text-text-muted">
                            <span className="font-medium">Parameters:</span>
                            <div className="mt-1 space-y-1">
                              {Object.entries(tool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <code className="bg-gray-700 px-1 rounded">{key}</code>
                                  <span className="text-gray-400">({schema.type || 'any'})</span>
                                  {tool.inputSchema.required?.includes(key) && (
                                    <span className="text-red-400">*</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        onClick={() => {
                          // Tool execution would be handled here
                          console.log(`Execute tool: ${tool.name} on ${serverName}`);
                        }}
                      >
                        Execute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Server Logs</h3>
        <button
          onClick={() => setActiveSection('servers')}
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Servers
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
        {runningServers.length > 0 ? (
          runningServers.map((server) => (
            <div key={server.config.name}>
              <div className="text-green-400">
                [{new Date().toLocaleTimeString()}] {server.config.name}: Server running
              </div>
              <div className="text-blue-400">
                [{new Date().toLocaleTimeString()}] {server.config.name}: {server.tools.length} tools loaded
              </div>
              {server.lastStarted && (
                <div className="text-text-muted">
                  [{server.lastStarted.toLocaleTimeString()}] {server.config.name}: Started successfully
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-text-muted text-center py-8">
            No active servers to display logs for.
          </div>
        )}

        {servers.filter(s => s.status === 'error').map((server) => (
          <div key={`error-${server.config.name}`} className="text-red-400">
            [{new Date().toLocaleTimeString()}] {server.config.name}: Error - {server.error}
          </div>
        ))}
      </div>
    </div>
  );

  const sections = [
    { id: 'servers' as const, label: 'Servers', count: servers.length },
    { id: 'templates' as const, label: 'Templates', count: serverTemplates.length },
    { id: 'tools' as const, label: 'Tools', count: availableTools.reduce((acc, server) => acc + server.tools.length, 0) },
    { id: 'logs' as const, label: 'Logs' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Section Tabs */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeSection === section.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              <span>{section.label}</span>
              {section.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeSection === section.id
                  ? 'bg-accent text-white'
                  : 'bg-gray-600 text-text-muted'
                  }`}>
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'servers' && renderServers()}
        {activeSection === 'templates' && renderTemplates()}
        {activeSection === 'tools' && renderTools()}
        {activeSection === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default MCPPanel;
