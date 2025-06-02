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
  Server
} from 'lucide-react';
import type { MCPServer } from '../App';

interface MCPPanelProps {
  mcpServers: MCPServer[];
  onMCPAction: (serverName: string, action: 'start' | 'stop') => void;
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
}

interface MCPServerTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
  command: string;
  category: 'filesystem' | 'database' | 'web' | 'git' | 'custom';
}

const MCPPanel: React.FC<MCPPanelProps> = ({
  mcpServers,
  onMCPAction,
  isAuthenticated = false,
  onShowAuth
}) => {
  const [activeSection, setActiveSection] = useState<'servers' | 'templates' | 'logs'>('servers');
  const [isAddingServer, setIsAddingServer] = useState(false);

  const serverTemplates: MCPServerTemplate[] = [
    {
      name: 'Filesystem',
      description: 'File system operations and navigation',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      command: 'mcp-server-filesystem',
      category: 'filesystem'
    },
    {
      name: 'Git',
      description: 'Git repository management and operations',
      icon: <GitBranch className="w-5 h-5 text-orange-400" />,
      command: 'mcp-server-git',
      category: 'git'
    },
    {
      name: 'Database',
      description: 'Database connections and queries',
      icon: <Database className="w-5 h-5 text-green-400" />,
      command: 'mcp-server-database',
      category: 'database'
    },
    {
      name: 'Web Search',
      description: 'Web search and content retrieval',
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      command: 'mcp-server-web',
      category: 'web'
    }
  ];

  const getServerIcon = (serverName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'filesystem': <FileText className="w-4 h-4" />,
      'git': <GitBranch className="w-4 h-4" />,
      'database': <Database className="w-4 h-4" />,
      'web': <Globe className="w-4 h-4" />,
    };
    return iconMap[serverName] || <Server className="w-4 h-4" />;
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'stopped':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className={`w-4 h-4 ${getStatusColor(status)}`} />;
      case 'error':
        return <AlertCircle className={`w-4 h-4 ${getStatusColor(status)}`} />;
      case 'stopped':
        return <Square className={`w-4 h-4 ${getStatusColor(status)}`} />;
      default:
        return <Square className={`w-4 h-4 ${getStatusColor(status)}`} />;
    }
  };

  const renderServers = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">MCP Servers</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingServer(true)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Add Server"
          >
            <Plus className="w-4 h-4 text-accent" />
          </button>
          <button
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {mcpServers.map((server) => (
          <div
            key={server.name}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getServerIcon(server.name)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary capitalize">
                      {server.name}
                    </span>
                    {getStatusIcon(server.status)}
                  </div>
                  <div className={`text-xs ${getStatusColor(server.status)}`}>
                    {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 text-text-muted" />
                </button>
                <button
                  onClick={() =>
                    onMCPAction(
                      server.name,
                      server.status === 'running' ? 'stop' : 'start'
                    )
                  }
                  className={`p-2 rounded transition-colors ${
                    server.status === 'running'
                      ? 'hover:bg-red-600 text-red-400'
                      : 'hover:bg-green-600 text-green-400'
                  }`}
                  title={
                    server.status === 'running'
                      ? `Stop ${server.name}`
                      : `Start ${server.name}`
                  }
                >
                  {server.status === 'running' ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            {server.status === 'running' && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Activity className="w-3 h-3" />
                  <span>Active • Ready for commands</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {mcpServers.length === 0 && (
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
          className="text-sm text-accent hover:text-accent-hover"
        >
          Back to Servers
        </button>
      </div>

      <div className="space-y-3">
        {serverTemplates.map((template) => (
          <div
            key={template.name}
            className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {template.icon}
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-text-primary mb-1">
                    {template.name}
                  </h4>
                  <p className="text-sm text-text-muted mb-2">
                    {template.description}
                  </p>
                  <div className="text-xs text-text-muted">
                    Command: <code className="bg-gray-800 px-1 rounded">{template.command}</code>
                  </div>
                </div>
              </div>
              
              <button
                className="px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm"
                onClick={() => {
                  console.log(`Add ${template.name} server`);
                  setActiveSection('servers');
                }}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Server Logs</h3>
        <button
          onClick={() => setActiveSection('servers')}
          className="text-sm text-accent hover:text-accent-hover"
        >
          Back to Servers
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
        <div className="text-green-400">[12:34:56] filesystem: Server started successfully</div>
        <div className="text-blue-400">[12:34:57] filesystem: Listening on port 3001</div>
        <div className="text-yellow-400">[12:35:02] git: Connection attempt failed</div>
        <div className="text-red-400">[12:35:03] database: Authentication failed</div>
        <div className="text-text-muted">[12:35:10] filesystem: Ready for commands</div>
      </div>
    </div>
  );

  const sections = [
    { id: 'servers' as const, label: 'Servers', count: mcpServers.length },
    { id: 'templates' as const, label: 'Templates', count: serverTemplates.length },
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span>{section.label}</span>
              {section.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeSection === section.id 
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
        {activeSection === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default MCPPanel;
