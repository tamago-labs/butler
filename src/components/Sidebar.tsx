import React, { useState } from 'react';
import { 
  FolderOpen, 
  Search, 
  GitBranch, 
  Terminal, 
  Play, 
  Square, 
  AlertCircle,
  CheckCircle,
  Folder,
  File,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { MCPServer } from '../App';

interface SidebarProps {
  activePanel: 'explorer' | 'search' | 'git' | 'mcp';
  onPanelChange: (panel: 'explorer' | 'search' | 'git' | 'mcp') => void;
  mcpServers: MCPServer[];
  onMCPAction: (serverName: string, action: 'start' | 'stop') => void;
  width: number;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  expanded?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePanel,
  onPanelChange,
  mcpServers,
  onMCPAction,
  width
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [searchQuery, setSearchQuery] = useState('');

  // Mock file tree for demonstration
  const fileTree: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      expanded: true,
      children: [
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: [
            { name: 'Editor.tsx', type: 'file', path: 'src/components/Editor.tsx' },
            { name: 'AIChat.tsx', type: 'file', path: 'src/components/AIChat.tsx' },
            { name: 'Sidebar.tsx', type: 'file', path: 'src/components/Sidebar.tsx' },
          ]
        },
        {
          name: 'hooks',
          type: 'folder',
          path: 'src/hooks',
          children: [
            { name: 'useAI.ts', type: 'file', path: 'src/hooks/useAI.ts' },
            { name: 'useMCP.ts', type: 'file', path: 'src/hooks/useMCP.ts' },
          ]
        },
        { name: 'App.tsx', type: 'file', path: 'src/App.tsx' },
        { name: 'main.tsx', type: 'file', path: 'src/main.tsx' },
      ]
    },
    { name: 'package.json', type: 'file', path: 'package.json' },
    { name: 'README.md', type: 'file', path: 'README.md' },
  ];

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              console.log('Open file:', node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-text-muted" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-muted" />
              )}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-3 h-3" /> {/* Spacer */}
              <File className="w-4 h-4 text-text-muted" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderExplorer = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary mb-3">Explorer</h3>
        <div className="space-y-1">
          {fileTree.map(node => renderFileNode(node))}
        </div>
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary mb-3">Search</h3>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full bg-gray-700 border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
        <div className="mt-4 space-y-2">
          {searchQuery && (
            <div className="text-xs text-text-muted">
              Searching for "{searchQuery}"...
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGit = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary mb-3">Source Control</h3>
        <div className="space-y-3">
          <div className="bg-gray-700 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">main</span>
            </div>
            <div className="text-xs text-text-muted">
              No changes to commit
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-muted">Recent commits:</div>
            <div className="space-y-1">
              <div className="text-xs p-2 bg-gray-700 rounded">
                <div className="text-text-primary">Add AI chat layout</div>
                <div className="text-text-muted">2 hours ago</div>
              </div>
              <div className="text-xs p-2 bg-gray-700 rounded">
                <div className="text-text-primary">Update editor components</div>
                <div className="text-text-muted">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMCP = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary mb-3">MCP Servers</h3>
        <div className="space-y-2">
          {mcpServers.map((server) => (
            <div
              key={server.name}
              className="flex items-center justify-between p-3 bg-gray-700 rounded"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {server.status === 'running' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {server.status === 'stopped' && (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  {server.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium capitalize">
                    {server.name}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() =>
                  onMCPAction(
                    server.name,
                    server.status === 'running' ? 'stop' : 'start'
                  )
                }
                className={`p-1 rounded transition-colors ${
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
          ))}
        </div>
      </div>
    </div>
  );

  const panels = [
    { id: 'explorer' as const, icon: FolderOpen, label: 'Explorer' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'git' as const, icon: GitBranch, label: 'Source Control' },
    { id: 'mcp' as const, icon: Terminal, label: 'MCP Servers' },
  ];

  return (
    <div 
      className="bg-sidebar-bg border-r border-border flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Panel Tabs */}
      <div className="flex border-b border-border">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => onPanelChange(panel.id)}
            className={`flex-1 flex items-center justify-center p-3 transition-colors ${
              activePanel === panel.id
                ? 'bg-editor-bg text-accent border-b-2 border-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-gray-700'
            }`}
            title={panel.label}
          >
            <panel.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Panel Content */}
      {activePanel === 'explorer' && renderExplorer()}
      {activePanel === 'search' && renderSearch()}
      {activePanel === 'git' && renderGit()}
      {activePanel === 'mcp' && renderMCP()}
    </div>
  );
};

export default Sidebar;