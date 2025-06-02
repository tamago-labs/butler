import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  FolderPlus,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import type { MCPServer } from '../App';
import type { FileNode } from '../hooks/useFileManager';

interface SidebarProps {
  activePanel: 'explorer' | 'search' | 'git' | 'mcp';
  onPanelChange: (panel: 'explorer' | 'search' | 'git' | 'mcp') => void;
  mcpServers: MCPServer[];
  onMCPAction: (serverName: string, action: 'start' | 'stop') => void;
  width: number;
  fileTree: FileNode[];
  workspaceRoot: string | null;
  isLoading: boolean;
  onOpenFile: (filePath: string) => void;
  onOpenFolder: () => void;
  onExpandDirectory: (node: FileNode) => void;
  onRefreshWorkspace: () => void;
  onCreateFile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePanel,
  onPanelChange,
  mcpServers,
  onMCPAction,
  width,
  fileTree,
  workspaceRoot,
  isLoading,
  onOpenFile,
  onOpenFolder,
  onExpandDirectory,
  onRefreshWorkspace,
  onCreateFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileNode[]>([]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchInTree = (nodes: FileNode[], query: string): FileNode[] => {
      const results: FileNode[] = [];
      
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(node);
        }
        
        if (node.children) {
          results.push(...searchInTree(node.children, query));
        }
      }
      
      return results;
    };

    const results = searchInTree(fileTree, searchQuery);
    setSearchResults(results);
  }, [searchQuery, fileTree]);

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <Folder className="w-4 h-4 text-blue-400" />;
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
      'js': { icon: <File className="w-4 h-4" />, color: 'text-yellow-400' },
      'jsx': { icon: <File className="w-4 h-4" />, color: 'text-yellow-400' },
      'ts': { icon: <File className="w-4 h-4" />, color: 'text-blue-400' },
      'tsx': { icon: <File className="w-4 h-4" />, color: 'text-blue-400' },
      'py': { icon: <File className="w-4 h-4" />, color: 'text-green-400' },
      'rs': { icon: <File className="w-4 h-4" />, color: 'text-orange-400' },
      'json': { icon: <File className="w-4 h-4" />, color: 'text-gray-400' },
      'css': { icon: <File className="w-4 h-4" />, color: 'text-blue-300' },
      'html': { icon: <File className="w-4 h-4" />, color: 'text-red-400' },
      'md': { icon: <File className="w-4 h-4" />, color: 'text-purple-400' },
    };
    
    const iconInfo = iconMap[extension] || { icon: <File className="w-4 h-4" />, color: 'text-text-muted' };
    return <span className={iconInfo.color}>{iconInfo.icon}</span>;
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm group"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (node.isDirectory) {
              onExpandDirectory(node);
            } else {
              onOpenFile(node.path);
            }
          }}
        >
          {node.isDirectory ? (
            <>
              {node.expanded ? (
                <ChevronDown className="w-3 h-3 text-text-muted" />
              ) : (
                <ChevronRight className="w-3 h-3 text-text-muted" />
              )}
              {getFileIcon(node.name, true)}
            </>
          ) : (
            <>
              <div className="w-3 h-3" /> {/* Spacer */}
              {getFileIcon(node.name, false)}
            </>
          )}
          <span className="truncate flex-1">{node.name}</span>
        </div>
        
        {node.isDirectory && node.expanded && node.children && (
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">Explorer</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onCreateFile}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="New File"
            >
              <FileText className="w-4 h-4 text-text-muted" />
            </button>
            <button
              onClick={onOpenFolder}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Open Folder"
            >
              <FolderPlus className="w-4 h-4 text-text-muted" />
            </button>
            {workspaceRoot && (
              <button
                onClick={onRefreshWorkspace}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Refresh"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-text-muted" />
                )}
              </button>
            )}
          </div>
        </div>

        {workspaceRoot ? (
          <div className="space-y-1">
            <div className="text-xs text-text-muted mb-2 truncate" title={workspaceRoot}>
              {workspaceRoot.split(/[/\\]/).pop()}
            </div>
            {fileTree.map(node => renderFileNode(node))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="w-8 h-8 mx-auto mb-3 text-text-muted" />
            <p className="text-sm text-text-muted mb-3">No folder opened</p>
            <button
              onClick={onOpenFolder}
              className="px-3 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors text-sm"
            >
              Open Folder
            </button>
          </div>
        )}
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
        
        <div className="mt-4 space-y-1">
          {searchQuery && searchResults.length === 0 && (
            <div className="text-xs text-text-muted py-4 text-center">
              No files found for "{searchQuery}"
            </div>
          )}
          
          {searchResults.map(result => (
            <div
              key={result.path}
              className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm rounded"
              onClick={() => !result.isDirectory && onOpenFile(result.path)}
            >
              {getFileIcon(result.name, result.isDirectory)}
              <span className="truncate flex-1">{result.name}</span>
              <span className="text-xs text-text-muted truncate max-w-24" title={result.path}>
                {result.path.split(/[/\\]/).slice(-2, -1)[0]}
              </span>
            </div>
          ))}
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
              {workspaceRoot ? 'Repository detected' : 'No repository'}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-muted">Recent commits:</div>
            <div className="space-y-1">
              <div className="text-xs p-2 bg-gray-700 rounded">
                <div className="text-text-primary">Add file management</div>
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
