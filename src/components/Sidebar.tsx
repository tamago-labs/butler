import React, { useState, useEffect } from 'react';
import { 
  FolderPlus,
  FileText,
  RefreshCw,
  Loader2,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Search,
  X
} from 'lucide-react';
import type { FileNode } from '../hooks/useFileManager';

interface SidebarProps {
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
  const [showSearch, setShowSearch] = useState(false);

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

  const renderSearchResults = () => (
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
  );

  return (
    <div 
      className="bg-sidebar-bg border-r border-border flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">Explorer</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1 rounded transition-colors ${
                showSearch ? 'bg-accent text-white' : 'hover:bg-gray-700 text-text-muted'
              }`}
              title="Search Files"
            >
              <Search className="w-4 h-4" />
            </button>
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

        {/* Search Bar */}
        {showSearch && (
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-gray-700 border border-border rounded px-3 py-2 pr-8 text-sm text-text-primary focus:outline-none focus:border-accent"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Root Info */}
        {workspaceRoot && (
          <div className="text-xs text-text-muted mb-2 truncate" title={workspaceRoot}>
            📁 {workspaceRoot.split(/[/\\]/).pop()}
          </div>
        )}
      </div>

      {/* File Tree / Search Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          {workspaceRoot ? (
            showSearch && searchQuery ? (
              renderSearchResults()
            ) : (
              <div className="space-y-1">
                {fileTree.map(node => renderFileNode(node))}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="w-8 h-8 mx-auto mb-3 text-text-muted" />
              <p className="text-sm text-text-muted mb-3">No folder opened</p>
              <p className="text-xs text-text-muted mb-4">
                Open a folder to start browsing your project files
              </p>
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
    </div>
  );
};

export default Sidebar;
