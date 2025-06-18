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
import { mcpService } from './services/mcpService';
import { Logger } from './components/LogsPanel';


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
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  const logger = Logger.getInstance();

  // Authentication Hook - now includes claudeService
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
        console.log('File Opened', `Successfully opened ${file.name}`)
      }
    } catch (err) {
      console.error('Failed to open file:', err);
      error('Failed to Open File', 'Could not open the selected file. Please check if the file exists and you have permission to access it.');
    }
  }, [openFile, error]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await openFolder();
      if (folderPath) {
        console.log('Folder Opened', `Successfully opened ${folderPath.split(/[/\\]/).pop()}`)
        // Auto-open right panel when folder is opened
        setIsRightPanelVisible(true);
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
      error('Failed to Open Folder', 'Could not open the selected folder. Please check if the folder exists and you have permission to access it.');
    }
  }, [openFolder, error]);

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
        content: 'I\'d love to help you with that! To use AI assistance, please sign in to your Butler account. You\'ll get AI credits to get started.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, authPromptMessage]);
      info('AI Available', 'Sign in to unlock Claude AI assistance!');
      return;
    }

    // Check if Claude service is available
    if (!claudeService) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content: 'Sorry, AI service is currently unavailable. Please check your connection and try again.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      error('AI Unavailable', 'The AI service is not available. Please check your API key configuration.');
      return;
    }

    // Use AI credit
    if (!useAICredit()) {
      warning('No AI Credits', 'You have run out of AI credits. Please upgrade your plan for unlimited access.');
      return;
    }

    // Add user message to chat history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Add initial AI message that we'll update with streaming content
    const aiMessageId = `msg-${Date.now()}-ai`;
    const initialAIMessage: ChatMessage = {
      id: aiMessageId,
      sender: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, initialAIMessage]);

    try {
      let accumulatedResponse = '';

      // Use Claude's streaming API for real-time responses
      const stream = claudeService.streamChatWithHistory(
        chatHistory,           // ← Pass full conversation history
        message              // ← Current message
      );

      // Process the streaming response
      for await (const chunk of stream) {
        accumulatedResponse += chunk;

        // Update the AI message in real-time as content streams in
        setChatHistory(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: accumulatedResponse }
            : msg
        ));
      }

      // Ensure the final message is complete
      if (!accumulatedResponse.trim()) {
        setChatHistory(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? {
              ...msg,
              content: "I apologize, but I didn't receive a complete response. Please try your question again."
            }
            : msg
        ));
      }

    } catch (claudeError: any) {

      console.error('The AI request failed:', claudeError);

      // Update the AI message with a user-friendly error
      const errorContent = claudeError.message?.includes('API key')
        ? "It looks like there's an issue with the API configuration. Please check your API key and try again."
        : claudeError.message?.includes('rate limit')
          ? "I'm currently receiving a lot of requests. Please wait a moment and try again."
          : claudeError.message?.includes('quota')
            ? "You've reached your API usage limit. Please check your account or try again later."
            : `I encountered an error while processing your request: ${claudeError.message || 'Unknown error'}. Please try again.`;

      setChatHistory(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, content: errorContent }
          : msg
      ));

      // Show notification with more details for debugging
      error('AI Error', 'Failed to get AI response. Check console for details.');
    }
  }, [hasAIAccess, useAICredit, claudeService, info, warning, error, chatHistory, setChatHistory]);

  // Toggle right panel for more editor space
  const toggleRightPanel = useCallback(async () => {
    setIsRightPanelVisible(prev => !prev);
  }, []);

  // Authentication handlers
  const handleAuthenticate = useCallback(async (accessKey: string) => {
    try {
      await authenticateWithAccessKey(accessKey);
      setShowAuth(false);
      success('Welcome!', 'Successfully authenticated to Butler with Claude AI!');
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
  }, [])

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
      case 'toggle-right-panel':
        await toggleRightPanel();
        break;
      case 'command-palette':
        setIsToolPaletteOpen(true);
        break;
      case 'exit':
        handleExit();
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, isRightPanelVisible, toggleRightPanel]);

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
      case 'Search Files':
        // Search is now integrated in file explorer
        break;
      case 'Source Control':
        // Removed from sidebar
        break;
    }
  }, [handleNewFile, handleOpenFile, handleSaveFile, isRightPanelVisible, toggleRightPanel]);

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
          case 'j':
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

  // Update MCP service when workspace root changes
  useEffect(() => {
    logger.info('app', `Current folder changed to: ${workspaceRoot}`);
    if (workspaceRoot) {
      logger.info('app', `Setting MCP current folder to: ${workspaceRoot}`);
      mcpService.setWorkspaceRoot(workspaceRoot);
      logger.info('app', 'MCP current folder updated');
    } else {
      logger.info('app', 'No current folder, setting MCP folder to null');
      mcpService.setWorkspaceRoot(null);
    }
  }, [workspaceRoot, logger]);

  // Calculate the main content area width (excluding sidebar)
  const mainContentWidth = `calc(100% - ${sidebarWidth}px)`;
  const hasOpenFiles = files.length > 0;
  const showWelcomePage = !hasOpenFiles && !workspaceRoot && !showAuth;

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
te
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
                  {files.length === 0 && workspaceRoot ? (
                    <div className="flex items-center gap-2 bg-editor-bg px-3 py-1 rounded-t border-t border-l border-r border-border">
                      <span className="text-sm">Project Explorer</span>
                    </div>
                  ) : files.length === 0 ? (
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
                  isAuthenticated={isAuthenticated}
                  user={user}
                  claudeService={claudeService}
                  onShowAuth={() => setShowAuth(true)}
                  onLogout={handleLogout}
                  onRefreshCredits={handleRefreshCredits}
                  workspaceRoot={workspaceRoot}
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