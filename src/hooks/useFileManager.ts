import { useState, useCallback } from 'react';
import { 
  readTextFile, 
  writeTextFile, 
  readDir
} from '@tauri-apps/plugin-fs';
import { 
  open as openDialog, 
  save as saveDialog 
} from '@tauri-apps/plugin-dialog';

export interface FileTab {
  id: string;
  name: string;
  path?: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

export const useFileManager = () => {
  const [files, setFiles] = useState<FileTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createNewFile = useCallback((language: string = 'javascript') => {
    const newFile: FileTab = {
      id: `untitled-${Date.now()}`,
      name: 'Untitled',
      content: '',
      language,
      isDirty: false
    };
    
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    return newFile;
  }, []);

  const openFile = useCallback(async (filePath?: string) => {
    try {
      setIsLoading(true);
      let selectedPath = filePath;
      
      if (!selectedPath) {
        const selected = await openDialog({
          multiple: false,
          filters: [
            { name: 'All Files', extensions: ['*'] },
            { name: 'JavaScript', extensions: ['js', 'jsx', 'mjs'] },
            { name: 'TypeScript', extensions: ['ts', 'tsx', 'mts'] },
            { name: 'Python', extensions: ['py', 'pyw'] },
            { name: 'Rust', extensions: ['rs'] },
            { name: 'JSON', extensions: ['json'] },
            { name: 'CSS', extensions: ['css', 'scss', 'sass', 'less'] },
            { name: 'HTML', extensions: ['html', 'htm'] },
            { name: 'Markdown', extensions: ['md', 'mdx'] }
          ]
        });
        
        if (!selected || Array.isArray(selected)) return null;
        selectedPath = selected;
      }

      // Check if file is already open
      const existingFile = files.find(f => f.path === selectedPath);
      if (existingFile) {
        setActiveFileId(existingFile.id);
        return existingFile;
      }

      const content = await readTextFile(selectedPath);
      const fileName = selectedPath.split(/[/\\]/).pop() || 'Unknown';
      const extension = fileName.split('.').pop() || '';
      const language = getLanguageFromExtension(extension);
      
      const newFile: FileTab = {
        id: `file-${Date.now()}`,
        name: fileName,
        path: selectedPath,
        content,
        language,
        isDirty: false
      };
      
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      return newFile;
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  const openFolder = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const selected = await openDialog({
        directory: true,
        multiple: false,
      });

      if (!selected || Array.isArray(selected)) return;

      setWorkspaceRoot(selected);
      
      // Load folder structure
      const tree = await loadDirectoryTree(selected);
      setFileTree(tree);
      
      return selected;
    } catch (error) {
      console.error('Failed to open folder:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDirectoryTree = async (dirPath: string): Promise<FileNode[]> => {
    try {
      const entries = await readDir(dirPath);
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        
        // Skip hidden files and common ignore patterns
        if (entry.name.startsWith('.') || 
            entry.name === 'node_modules' || 
            entry.name === 'target' ||
            entry.name === 'dist' ||
            entry.name === 'build') {
          continue;
        }

        const node: FileNode = {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory,
          expanded: false
        };

        if (entry.isDirectory) {
          // For directories, we'll load children on demand
          node.children = [];
        }

        nodes.push(node);
      }

      // Sort: directories first, then files, both alphabetically
      return nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to load directory:', dirPath, error);
      return [];
    }
  };

  const expandDirectory = useCallback(async (node: FileNode) => {
    if (!node.isDirectory) return;

    try {
      const children = await loadDirectoryTree(node.path);
      
      setFileTree(prevTree => {
        const updateNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(n => {
            if (n.path === node.path) {
              return { ...n, children, expanded: !n.expanded };
            }
            if (n.children) {
              return { ...n, children: updateNode(n.children) };
            }
            return n;
          });
        };
        return updateNode(prevTree);
      });
    } catch (error) {
      console.error('Failed to expand directory:', error);
    }
  }, []);

  const saveFile = useCallback(async (fileId: string, content?: string) => {
    try {
      setIsLoading(true);
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      let savePath = file.path;
      const saveContent = content || file.content;

      if (!savePath) {
        const selected = await saveDialog({
          filters: [
            { name: 'JavaScript', extensions: ['js'] },
            { name: 'TypeScript', extensions: ['ts'] },
            { name: 'Python', extensions: ['py'] },
            { name: 'Rust', extensions: ['rs'] },
            { name: 'JSON', extensions: ['json'] },
            { name: 'CSS', extensions: ['css'] },
            { name: 'HTML', extensions: ['html'] },
            { name: 'Markdown', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!selected) return false;
        savePath = selected;
      }

      await writeTextFile(savePath, saveContent);

      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              path: savePath,
              name: savePath!.split(/[/\\]/).pop() || f.name,
              content: saveContent,
              isDirty: false 
            }
          : f
      ));

      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [files]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, content, isDirty: true }
        : f
    ));
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    if (activeFileId === fileId) {
      setActiveFileId(prev => {
        const remainingFiles = files.filter(f => f.id !== fileId);
        return remainingFiles.length > 0 ? remainingFiles[0].id : null;
      });
    }
  }, [activeFileId, files]);

  const getActiveFile = useCallback(() => {
    return files.find(f => f.id === activeFileId) || null;
  }, [files, activeFileId]);

  const isFileOpen = useCallback((filePath: string) => {
    return files.some(f => f.path === filePath);
  }, [files]);

  const getFileById = useCallback((fileId: string) => {
    return files.find(f => f.id === fileId) || null;
  }, [files]);

  const refreshWorkspace = useCallback(async () => {
    if (!workspaceRoot) return;
    
    try {
      const tree = await loadDirectoryTree(workspaceRoot);
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to refresh workspace:', error);
    }
  }, [workspaceRoot]);

  // Add a simple function to refresh after AI completion
  const refreshAfterAI = useCallback(async () => {
    if (workspaceRoot) {
      console.log('🔄 Refreshing file tree after AI completion...');
      await refreshWorkspace();
    }
  }, [workspaceRoot, refreshWorkspace]);

  return {
    // State
    files,
    activeFileId,
    workspaceRoot,
    fileTree,
    isLoading,
    
    // Actions
    setActiveFileId,
    createNewFile,
    openFile,
    openFolder,
    saveFile,
    updateFileContent,
    closeFile,
    expandDirectory,
    refreshWorkspace,
    refreshAfterAI, // New simple refresh function
    
    // Getters
    getActiveFile,
    isFileOpen,
    getFileById
  };
};

function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mts': 'typescript',
    'py': 'python',
    'pyw': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'md': 'markdown',
    'mdx': 'markdown',
    'txt': 'plaintext',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'sql': 'sql',
    'dockerfile': 'dockerfile',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'clj': 'clojure',
    'elm': 'elm',
    'lua': 'lua',
    'r': 'r',
    'dart': 'dart',
  };
  
  return languageMap[extension.toLowerCase()] || 'plaintext';
}
