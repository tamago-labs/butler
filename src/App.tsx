import React, { useState, useCallback, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIChat from './components/AIChat';
import ToolPalette from './components/ToolPalette';
import StatusBar from './components/StatusBar';
import MenuBar from './components/MenuBar';
import { NotificationContainer, useNotifications } from './components/ui/Notifications';
import { useFileManager } from './hooks/useFileManager';
import type { FileTab } from './hooks/useFileManager';

export interface MCPServer {
  name: string;
  status: 'running' | 'stopped' | 'error';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type PanelType = 'explorer' | 'search' | 'git' | 'mcp';

function App() {
  const [activePanel, setActivePanel] = useState<PanelType>('explorer');
  const [isToolPaletteOpen, setIsToolPaletteOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isMenuBarVisible, setIsMenuBarVisible] = useState(true);

  // Notifications Hook
  const { notifications, removeNotification, success, error, warning, info } = useNotifications();

  // File Manager Hook
  const {
    files,
    activeFileId,
    workspaceRoot,
    fileTree,
    isLoading,
    setActiveFileId,
    createNewFile,
    openFile,
    openFolder,
    saveFile,
    updateFileContent,
    closeFile,
    expandDirectory,
    refreshWorkspace,
    getActiveFile
  } = useFileManager();

  // Get current file or create a default one
  const currentFile = getActiveFile() || {
    id: 'untitled-1',
    name: 'Untitled',
    content: '// Welcome to Butler - Your AI-Powered Code Editor\n// Open a folder or create files to get started\n\nfunction welcome() {\n  console.log("Ready to code with AI assistance!");\n}\n\nwelcome();',
    language: 'javascript',
    isDirty: false
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Welcome to Butler! I\'m your AI coding assistant. I can help you with code analysis, debugging, suggestions, and more. Open a folder or file to get started!',
      timestamp: new Date()
    }
  ]);
  
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  // Mock MCP servers for UI demonstration
  const [mcpServers] = useState<MCPServer[]>([
    { name: 'filesystem', status: 'running' },
    { name: 'git', status: 'stopped' },
    { name: 'database', status: 'error' },
  ]);

  const handleEditorChange = useCallback((value: string) => {
    if (activeFileId) {
      updateFileContent(activeFileId, value);
    }
  }, [activeFileId, updateFileContent]);

  const handleNewFile = useCallback(() => {
    createNewFile();
  }, [createNewFile]);

  const handleOpenFile = useCallback(async (filePath?: string) => {
    try {
      const file = await openFile(filePath);
      if (file) {
        success('File Opened', `Successfully opened ${file.name}`);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      error('Failed to Open File', 'Could not open the selected file. Please check if the file exists and you have permission to access it.');
    }
  }, [openFile, success, error]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await openFolder();
      if (folderPath) {
        success('Folder Opened', `Successfully opened ${folderPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      error('Failed to Open Folder', 'Could not open the selected folder. Please check if the folder exists and you have permission to access it.');
    }
  }, [openFolder, success, error]);

  const handleSaveFile = useCallback(async () => {
    if (!activeFileId) return;
    
    try {
      const saved = await saveFile(activeFileId);
      if (saved) {
        success('File Saved', `Successfully saved ${currentFile.name}`);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      error('Failed to Save File', 'Could not save the file. Please check if you have write permissions to the directory.');
    }
  }, [activeFileId, saveFile, success, error, currentFile.name]);

  const handleCloseFile = useCallback((fileId: string) => {
    closeFile(fileId);
  }, [closeFile]);

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: message,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    // Simulate AI thinking delay
    setTimeout(() => {
      // Mock AI response with file context
      let response = `Thanks for your message: "${message}". `;
      
      if (message.toLowerCase().includes('analyze')) {
        response += `I can see you're working with ${currentFile.language} code in "${currentFile.name}". The current file has ${currentFile.content.split('\n').length} lines. Here are some observations about your code structure and suggestions for improvement.`;
      } else if (message.toLowerCase().includes('help')) {
        response += 'I can help you with code analysis, debugging, suggestions, refactoring, and more. What would you like me to help you with?';
      } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('bug')) {
        response += "I'll help you debug that! Here are some common issues to check for and potential solutions based on your current file.";
      } else if (message.toLowerCase().includes('explain')) {
        response += `Let me explain your ${currentFile.language} code. I can see the structure and will break down what each part does.`;
      } else if (message.toLowerCase().includes('optimize')) {
        response += `I'll analyze your ${currentFile.language} code for optimization opportunities. Here are some performance improvements you could consider.`;
      } else {
        response += `I'm ready to help with your ${currentFile.language} development in "${currentFile.name}". I can analyze your code, suggest improvements, help debug issues, and much more!`;
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiMessage]);
    }, 1000);
  }, [currentFile]);

  const handleMCPAction = useCallback((serverName: string, action: 'start' | 'stop') => {
    console.log(`${action} MCP server: ${serverName} (mock)`);
    // In real implementation, this would manage actual MCP servers
  }, []);

  const toggleToolPalette = useCallback(() => {
    setIsToolPaletteOpen(prev => !prev);
  }, []);

  const handleMenuAction = useCallback((action: string) => {
    switch (action) {
      case 'new-file':
        handleNewFile();
        break;
      case 'open-file':
        handleOpenFile();
        break;
      case 'save-file':
        handleSaveFile();
        break;
      case 'toggle-menu':
        setIsMenuBarVisible(prev => !prev);
        break;
      case 'analyze-code':
        handleSendMessage(`Please analyze my ${currentFile.language} code`);
        break;
      case 'command-palette':
        setIsToolPaletteOpen(true);
        break;
      case 'toggle-explorer':
        setActivePanel('explorer');
        break;
      case 'toggle-search':
        setActivePanel('search');
        break;
      case 'toggle-git':
        setActivePanel('git');
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSendMessage, currentFile.language]);

  const handleToolCommand = useCallback((command: string) => {
    switch (command) {
      case 'New File':
        handleNewFile();
        break;
      case 'Open File':
        handleOpenFile();
        break;
      case 'Save File':
        handleSaveFile();
        break;
      case 'Analyze Code':
        handleSendMessage(`Please analyze my ${currentFile.language} code`);
        break;
      case 'Find Issues':
        handleSendMessage(`Review my ${currentFile.language} code for potential bugs and issues`);
        break;
      case 'Explain Code':
        handleSendMessage(`Explain what this ${currentFile.language} code does and how it works`);
        break;
      case 'Optimize Code':
        handleSendMessage(`How can I optimize this ${currentFile.language} code for better performance?`);
        break;
      case 'MCP Tools':
        setActivePanel('mcp');
        break;
      case 'Search Files':
        setActivePanel('search');
        break;
      case 'Source Control':
        setActivePanel('git');
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSendMessage, currentFile.language]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            handleNewFile();
            break;
          case 'o':
            e.preventDefault();
            if (e.shiftKey) {
              handleOpenFolder();
            } else {
              handleOpenFile();
            }
            break;
          case 's':
            e.preventDefault();
            handleSaveFile();
            break;
          case 'p':
            if (e.shiftKey) {
              e.preventDefault();
              toggleToolPalette();
            }
            break;
          case 'b':
            e.preventDefault();
            setIsMenuBarVisible(prev => !prev);
            break;
          case 'w':
            e.preventDefault();
            if (activeFileId) {
              handleCloseFile(activeFileId);
            }
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setIsToolPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleOpenFile, handleOpenFolder, handleSaveFile, toggleToolPalette, activeFileId, handleCloseFile]);

  // Calculate the main content area width (excluding sidebar)
  const mainContentWidth = `calc(100% - ${sidebarWidth}px)`;

  return (
    <div className="h-screen bg-editor-bg text-text-primary flex flex-col overflow-hidden">
      <TitleBar currentFileName={currentFile.name} />
      
      {isMenuBarVisible && (
        <MenuBar onAction={handleMenuAction} />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          mcpServers={mcpServers}
          onMCPAction={handleMCPAction}
          width={sidebarWidth}
          fileTree={fileTree}
          workspaceRoot={workspaceRoot}
          isLoading={isLoading}
          onOpenFile={handleOpenFile}
          onOpenFolder={handleOpenFolder}
          onExpandDirectory={expandDirectory}
          onRefreshWorkspace={refreshWorkspace}
          onCreateFile={handleNewFile}
        />
        
        {/* Main Content Area - 50/50 Split */}
        <div className="flex flex-1 overflow-hidden" style={{ width: mainContentWidth }}>
          {/* Editor Section - 50% */}
          <div className="w-1/2 flex flex-col overflow-hidden border-r border-border">
            {/* Tab Bar */}
            <div className="flex h-9 bg-titlebar-bg border-b border-border items-center px-3 overflow-x-auto">
              {files.length === 0 ? (
                <div className="flex items-center gap-2 bg-editor-bg px-3 py-1 rounded-t border-t border-l border-r border-border">
                  <span className="text-sm">Welcome</span>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t border-t border-l border-r border-border cursor-pointer ${
                      file.id === activeFileId 
                        ? 'bg-editor-bg text-text-primary' 
                        : 'bg-gray-700 text-text-muted hover:text-text-primary'
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <span className="text-sm">{file.name}</span>
                    {file.isDirty && <span className="text-warning text-xs">●</span>}
                    <button
                      className="text-text-muted hover:text-text-primary text-sm ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseFile(file.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <Editor
              value={currentFile.content}
              language={currentFile.language}
              onChange={handleEditorChange}
              onCursorPositionChange={setCursorPosition}
            />
          </div>
          
          {/* AI Chat Section - 50% */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <AIChat
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              currentFile={currentFile}
            />
          </div>
        </div>
      </div>
      
      <StatusBar
        language={currentFile.language}
        lineNumber={cursorPosition.line}
        column={cursorPosition.column}
        aiStatus="Active"
      />
      
      {isToolPaletteOpen && (
        <ToolPalette
          onClose={() => setIsToolPaletteOpen(false)}
          onCommand={handleToolCommand}
        />
      )}
      
      <NotificationContainer 
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
}

export default App;
