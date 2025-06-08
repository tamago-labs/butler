import { useState, useCallback, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import RightPanel from './components/RightPanel';
import ToolPalette from './components/ToolPalette';
import StatusBar from './components/StatusBar';
import MenuBar from './components/MenuBar';
import WelcomePage from './components/WelcomePage'; 
import AccessKeyForm from './components/auth/AccessKeyForm';
import { NotificationContainer, useNotifications } from './components/ui/Notifications';
import { useFileManager } from './hooks/useFileManager';
import { useAuth } from './hooks/useAuth';
import { exit } from '@tauri-apps/plugin-process';
import { message } from '@tauri-apps/plugin-dialog';
// import type { FileTab } from './hooks/useFileManager';


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

function App() {
  const [isToolPaletteOpen, setIsToolPaletteOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isMenuBarVisible, setIsMenuBarVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true); // NEW: Toggle right panel
  const [showAuth, setShowAuth] = useState(false);

  // Authentication Hook
  const { user, isAuthenticated, authenticateWithAccessKey, validateAccessKey, logout, hasAIAccess, useAICredit, refreshCredits, claudeService } = useAuth();

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
    id: 'welcome-tab',
    name: 'Welcome',
    content: '',
    language: 'javascript',
    isDirty: false
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  // Initialize chat history based on authentication state
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      sender: 'assistant',
      content: isAuthenticated
        ? `Welcome back, ${user?.name}! I'm ready to help you with your coding projects. You have ${user?.aiCredits} AI credits available.`
        : 'Welcome to Butler! You can start coding right away. For AI assistance, sign in to get 100 free credits and unlock intelligent code help.',
      timestamp: new Date()
    };
    setChatHistory([welcomeMessage]);
  }, [isAuthenticated, user?.name, user?.aiCredits]);

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
        // success('File Opened', `Successfully opened ${file.name}`);
        console.log('File Opened', `Successfully opened ${file.name}`)
      }
    } catch (err) {
      console.error('Failed to open file:', err);
      error('Failed to Open File', 'Could not open the selected file. Please check if the file exists and you have permission to access it.');
    }
  }, [openFile, success, error]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await openFolder();
      if (folderPath) {
        // success('Folder Opened', `Successfully opened ${folderPath.split(/[/\\]/).pop()}`);
        console.log('Folder Opened', `Successfully opened ${folderPath.split(/[/\\]/).pop()}`)
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
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
    } catch (err) {
      console.error('Failed to save file:', err);
      error('Failed to Save File', 'Could not save the file. Please check if you have write permissions to the directory.');
    }
  }, [activeFileId, saveFile, success, error, currentFile.name]);

  const handleCloseFile = useCallback((fileId: string) => {
    closeFile(fileId);
  }, [closeFile]);

  const handleSendMessage = useCallback(async (message: string) => {
    // Check if user has AI access
    if (!hasAIAccess()) {
      const authPromptMessage: ChatMessage = {
        id: `auth-prompt-${Date.now()}`,
        sender: 'assistant',
        content: 'I\'d love to help you with that! To use AI assistance, please sign in to your Butler account. You\'ll get 100 free AI credits to get started.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, authPromptMessage]);

      // Show a gentle notification instead of blocking
      info('AI Features Available', 'Sign in to unlock AI assistance with 100 free credits!');
      return;
    }

    // Use AI credit
    if (!useAICredit()) {
      warning('No AI Credits', 'You have run out of AI credits. Please upgrade your plan for unlimited access.');
      return;
    }

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
  }, [currentFile, hasAIAccess, useAICredit, info, warning]);

  const handleMCPAction = useCallback((serverName: string, action: 'start' | 'stop') => {
    console.log(`${action} MCP server: ${serverName} (mock)`);
    // In real implementation, this would manage actual MCP servers
  }, []);

  // NEW: Toggle right panel for more editor space
  const toggleRightPanel = useCallback(async () => {
    // Check if no files are open and trying to show the AI panel
    if (!isRightPanelVisible && files.length === 0) {
      await message('To use the AI assistant, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
        title: 'AI Assistant',
        kind: 'info'
      });
      return;
    }
    
    setIsRightPanelVisible(prev => !prev);
  }, [isRightPanelVisible, files.length]);

  // Authentication handlers
  const handleAuthenticate = useCallback(async (accessKey: string) => {
    try {
      await authenticateWithAccessKey(accessKey);
      setShowAuth(false);
      success('Welcome!', 'Successfully authenticated to Butler managed service');
    } catch (error: any) {
      console.error('Authentication failed:', error);
      // Error handling is done in the authenticateWithAccessKey function
    }
  }, [authenticateWithAccessKey, success]);

  const handleValidateAccessKey = useCallback(async (accessKey: string) => {
    try {
      return await validateAccessKey(accessKey);
    } catch (error) {
      console.error('Access key validation failed:', error);
      return false;
    }
  }, [validateAccessKey]);

  const handleLogout = useCallback(() => {
    logout();
    success('Signed Out', 'You have been successfully signed out of Butler.');
  }, [logout, success]);

  const handleRefreshCredits = useCallback(async () => {
    try {
      const newCredits = await refreshCredits();
      if (newCredits) {
        success('Credits Refreshed', `Your AI credits have been refreshed to ${newCredits}.`);
        return newCredits;
      }
    } catch (error: any) {
      console.error('Failed to refresh credits:', error);
      error('Refresh Failed', 'Could not refresh credits. Please try again later.');
    }
  }, [refreshCredits, success, error]);

  const toggleToolPalette = useCallback(() => {
    setIsToolPaletteOpen(prev => !prev);
  }, []);

  const handleExit = useCallback(async () => {
    await exit(0)
  },[])

  const handleMenuAction = useCallback(async (action: string) => {
    switch (action) {
      case 'new-file':
        handleNewFile();
        break;
      case 'open-file':
        handleOpenFile();
        break;
      case 'open-folder':
        handleOpenFolder();
        break;
      case 'save-file':
        handleSaveFile();
        break;
      case 'toggle-menu':
        setIsMenuBarVisible(prev => !prev);
        break;
      case 'toggle-right-panel': // NEW: Menu action for toggling right panel
        await toggleRightPanel();
        break;
      case 'analyze-code':
        if (!isRightPanelVisible) {
          if (files.length === 0) {
            await message('To use AI code analysis, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
              title: 'AI Code Analysis',
              kind: 'info'
            });
            return;
          }
          setIsRightPanelVisible(true);
        }
        handleSendMessage(`Please analyze my ${currentFile.language} code`);
        break;
      case 'command-palette':
        setIsToolPaletteOpen(true);
        break;
      case 'exit':
        handleExit();
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSendMessage, currentFile.language, isRightPanelVisible, toggleRightPanel, files.length]);

  const handleToolCommand = useCallback(async (command: string) => {
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
      case 'Toggle Right Panel':
        await toggleRightPanel();
        break;
      case 'Analyze Code':
        if (!isRightPanelVisible) {
          if (files.length === 0) {
            await message('To use AI code analysis, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
              title: 'AI Code Analysis',
              kind: 'info'
            });
            return;
          }
          setIsRightPanelVisible(true);
        }
        handleSendMessage(`Please analyze my ${currentFile.language} code`);
        break;
      case 'Find Issues':
        if (!isRightPanelVisible) {
          if (files.length === 0) {
            await message('To use AI code review, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
              title: 'AI Code Review',
              kind: 'info'
            });
            return;
          }
          setIsRightPanelVisible(true);
        }
        handleSendMessage(`Review my ${currentFile.language} code for potential bugs and issues`);
        break;
      case 'Explain Code':
        if (!isRightPanelVisible) {
          if (files.length === 0) {
            await message('To use AI code explanation, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
              title: 'AI Code Explanation',
              kind: 'info'
            });
            return;
          }
          setIsRightPanelVisible(true);
        }
        handleSendMessage(`Explain what this ${currentFile.language} code does and how it works`);
        break;
      case 'Optimize Code':
        if (!isRightPanelVisible) {
          if (files.length === 0) {
            await message('To use AI code optimization, please open a file or create a new file first.\n\nYou can:\n• Press Ctrl+N to create a new file\n• Press Ctrl+O to open an existing file\n• Press Ctrl+Shift+O to open a folder', {
              title: 'AI Code Optimization',
              kind: 'info'
            });
            return;
          }
          setIsRightPanelVisible(true);
        }
        handleSendMessage(`How can I optimize this ${currentFile.language} code for better performance?`);
        break;
      case 'MCP Tools':
        // MCP is now in right panel, no action needed
        break;
      case 'Search Files':
        // Search is now integrated in file explorer
        break;
      case 'Source Control':
        // Removed from sidebar
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, handleSendMessage, currentFile.language, isRightPanelVisible, toggleRightPanel, files.length]);

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
          case 'j': // NEW: Ctrl+J to toggle right panel (like VS Code)
            e.preventDefault();
            toggleRightPanel();
            break;
        }
      }

      if (e.key === 'Escape') {
        setIsToolPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleOpenFile, handleOpenFolder, handleSaveFile, toggleToolPalette, activeFileId, handleCloseFile, toggleRightPanel]);

  // Calculate the main content area width (excluding sidebar)
  const mainContentWidth = `calc(100% - ${sidebarWidth}px)`;
  const hasOpenFiles = files.length > 0;
  const showWelcomePage = !hasOpenFiles && !showAuth; // Show welcome for both auth states

  // Auth modal overlay
  if (showAuth) {
    return (
      <div className="h-screen bg-editor-bg text-text-primary flex flex-col overflow-hidden">
        <TitleBar
          currentFileName="Authentication"
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          onShowAuth={() => setShowAuth(true)}
        />

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <AccessKeyForm
              onAuthenticate={handleAuthenticate}
              onValidateKey={handleValidateAccessKey}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAuth(false)}
                className="text-text-muted hover:text-text-primary text-sm"
              >
                ← Back to Butler
              </button>
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={notifications}
          onClose={removeNotification}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-editor-bg text-text-primary flex flex-col overflow-hidden">
      <TitleBar
        currentFileName={currentFile.name}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onShowAuth={() => setShowAuth(true)}
      />

      {isMenuBarVisible && (
        <MenuBar onAction={handleMenuAction} isRightPanelVisible={isRightPanelVisible} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
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

        {/* Main Content Area - 50/50 Split or Welcome */}
        <div className="flex flex-1 overflow-hidden" style={{ width: mainContentWidth }}>
          {showWelcomePage ? (
            <WelcomePage
              onOpenFolder={handleOpenFolder}
              onShowAuth={() => setShowAuth(true)}
              isAuthenticated={isAuthenticated}
              userName={user?.name}
            />
          ) : (
            <>
              {/* Editor Section - Dynamic Width */}
              <div className={`flex flex-col overflow-hidden ${isRightPanelVisible ? 'w-1/2 border-r border-border' : 'w-full'}`}>
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
                        className={`flex items-center gap-2 px-3 py-1 rounded-t border-t border-l border-r border-border cursor-pointer ${file.id === activeFileId
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

              {/* Right Panel - Conditional Render */}
              {isRightPanelVisible && (
                <RightPanel
                  chatHistory={chatHistory}
                  onSendMessage={handleSendMessage}
                  currentFile={currentFile}
                  mcpServers={mcpServers}
                  onMCPAction={handleMCPAction}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  claudeService={claudeService}
                  onShowAuth={() => setShowAuth(true)}
                  onLogout={handleLogout}
                  onRefreshCredits={handleRefreshCredits}
                />
              )}
            </>
          )}
        </div>
      </div>

      <StatusBar
        language={currentFile.language}
        lineNumber={cursorPosition.line}
        column={cursorPosition.column}
        aiStatus="Active"
        isRightPanelVisible={isRightPanelVisible}
        onToggleRightPanel={toggleRightPanel}
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
