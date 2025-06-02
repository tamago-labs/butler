// import { useState, useCallback } from 'react';
// // import { invoke } from '@tauri-apps/api/tauri';
// // import { open, save } from '@tauri-apps/api/dialog';
// // import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

// export interface FileTab {
//   id: string;
//   name: string;
//   path?: string;
//   content: string;
//   language: string;
//   isDirty: boolean;
// }

// export const useFileManager = () => {
//   const [files, setFiles] = useState<FileTab[]>([]);
//   const [activeFileId, setActiveFileId] = useState<string | null>(null);

//   const createNewFile = useCallback((language: string = 'javascript') => {
//     const newFile: FileTab = {
//       id: `untitled-${Date.now()}`,
//       name: 'Untitled',
//       content: '',
//       language,
//       isDirty: false
//     };
    
//     setFiles(prev => [...prev, newFile]);
//     setActiveFileId(newFile.id);
//     return newFile;
//   }, []);

//   const openFile = useCallback(async (filePath?: string) => {
//     try {
//       let selectedPath = filePath;
      
//       if (!selectedPath) {
//         const selected = await open({
//           multiple: false,
//           filters: [
//             { name: 'All Files', extensions: ['*'] },
//             { name: 'JavaScript', extensions: ['js', 'jsx'] },
//             { name: 'TypeScript', extensions: ['ts', 'tsx'] },
//             { name: 'Python', extensions: ['py'] },
//             { name: 'Rust', extensions: ['rs'] },
//             { name: 'JSON', extensions: ['json'] }
//           ]
//         });
        
//         if (!selected || typeof selected !== 'string') return null;
//         selectedPath = selected;
//       }

//       const content = await readTextFile(selectedPath);
//       const fileName = selectedPath.split('/').pop() || 'Unknown';
//       const extension = fileName.split('.').pop() || '';
//       const language = getLanguageFromExtension(extension);
      
//       const newFile: FileTab = {
//         id: `file-${Date.now()}`,
//         name: fileName,
//         path: selectedPath,
//         content,
//         language,
//         isDirty: false
//       };
      
//       setFiles(prev => [...prev, newFile]);
//       setActiveFileId(newFile.id);
//       return newFile;
//     } catch (error) {
//       console.error('Failed to open file:', error);
//       throw error;
//     }
//   }, []);

//   const saveFile = useCallback(async (fileId: string, content?: string) => {
//     try {
//       const file = files.find(f => f.id === fileId);
//       if (!file) throw new Error('File not found');

//       let savePath = file.path;
//       const saveContent = content || file.content;

//       if (!savePath) {
//         const selected = await save({
//           filters: [
//             { name: 'JavaScript', extensions: ['js'] },
//             { name: 'TypeScript', extensions: ['ts'] },
//             { name: 'Python', extensions: ['py'] },
//             { name: 'Rust', extensions: ['rs'] },
//             { name: 'JSON', extensions: ['json'] },
//             { name: 'All Files', extensions: ['*'] }
//           ]
//         });

//         if (!selected) return false;
//         savePath = selected;
//       }

//       await writeTextFile(savePath, saveContent);

//       setFiles(prev => prev.map(f => 
//         f.id === fileId 
//           ? { 
//               ...f, 
//               path: savePath,
//               name: savePath!.split('/').pop() || f.name,
//               content: saveContent,
//               isDirty: false 
//             }
//           : f
//       ));

//       return true;
//     } catch (error) {
//       console.error('Failed to save file:', error);
//       throw error;
//     }
//   }, [files]);

//   const updateFileContent = useCallback((fileId: string, content: string) => {
//     setFiles(prev => prev.map(f => 
//       f.id === fileId 
//         ? { ...f, content, isDirty: true }
//         : f
//     ));
//   }, []);

//   const closeFile = useCallback((fileId: string) => {
//     setFiles(prev => prev.filter(f => f.id !== fileId));
    
//     if (activeFileId === fileId) {
//       setActiveFileId(prev => {
//         const remainingFiles = files.filter(f => f.id !== fileId);
//         return remainingFiles.length > 0 ? remainingFiles[0].id : null;
//       });
//     }
//   }, [activeFileId, files]);

//   const getActiveFile = useCallback(() => {
//     return files.find(f => f.id === activeFileId) || null;
//   }, [files, activeFileId]);

//   const searchInFiles = useCallback(async (query: string) => {
//     try {
//       const results = await invoke<string[]>('search_files', {
//         path: '.',
//         query
//       });
//       return results;
//     } catch (error) {
//       console.error('Search failed:', error);
//       return [];
//     }
//   }, []);

//   return {
//     files,
//     activeFileId,
//     setActiveFileId,
//     createNewFile,
//     openFile,
//     saveFile,
//     updateFileContent,
//     closeFile,
//     getActiveFile,
//     searchInFiles
//   };
// };

// function getLanguageFromExtension(extension: string): string {
//   const languageMap: Record<string, string> = {
//     'js': 'javascript',
//     'jsx': 'javascript',
//     'ts': 'typescript',
//     'tsx': 'typescript',
//     'py': 'python',
//     'rs': 'rust',
//     'go': 'go',
//     'java': 'java',
//     'cpp': 'cpp',
//     'c': 'c',
//     'html': 'html',
//     'css': 'css',
//     'scss': 'scss',
//     'sass': 'sass',
//     'json': 'json',
//     'xml': 'xml',
//     'yaml': 'yaml',
//     'yml': 'yaml',
//     'toml': 'toml',
//     'md': 'markdown',
//     'txt': 'plaintext',
//     'sh': 'shell',
//     'bash': 'shell',
//     'zsh': 'shell',
//     'fish': 'shell',
//     'ps1': 'powershell',
//     'sql': 'sql',
//     'dockerfile': 'dockerfile',
//   };
  
//   return languageMap[extension.toLowerCase()] || 'plaintext';
// }