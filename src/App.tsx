import React, { useState, useCallback, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIChat from './components/AIChat';
import ToolPalette from './components/ToolPalette';
import StatusBar from './components/StatusBar';
import MenuBar from './components/MenuBar';

export interface FileTab {
  id: string;
  name: string;
  path?: string;
  content: string;
  language: string;
  isDirty: boolean;
}

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
  
  const [currentFile, setCurrentFile] = useState<FileTab>({
    id: 'untitled-1',
    name: 'Untitled',
    content: '// Welcome to Butler - Your AI-Powered Code Editor\n// Split 50/50 layout: Code Editor + AI Assistant\n\nfunction welcome() {\n  console.log("Ready to code with AI assistance!");\n}\n\nwelcome();',
    language: 'javascript',
    isDirty: false
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: 'Welcome to Butler! I\'m your AI coding assistant. I can help you with code analysis, debugging, suggestions, and more. What would you like to work on?',
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
    setCurrentFile(prev => ({
      ...prev,
      content: value,
      isDirty: true
    }));
  }, []);

  const handleNewFile = useCallback(() => {
    const newFile: FileTab = {
      id: `untitled-${Date.now()}`,
      name: 'Untitled',
      content: '',
      language: 'javascript',
      isDirty: false
    };
    setCurrentFile(newFile);
  }, []);

  const handleOpenFile = useCallback(() => {
    // Mock file opening - in real implementation this would use Tauri file dialog
    const mockFiles = [
      { name: 'App.tsx', content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;', language: 'typescript' },
      { name: 'utils.js', content: 'export function formatDate(date) {\n  return date.toLocaleDateString();\n}\n\nexport function debounce(fn, delay) {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n}', language: 'javascript' },
      { name: 'styles.css', content: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\n.button {\n  background: #007acc;\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 4px;\n  cursor: pointer;\n}', language: 'css' }
    ];
    
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    const newFile: FileTab = {
      id: `file-${Date.now()}`,
      name: randomFile.name,
      path: `/mock/path/${randomFile.name}`,
      content: randomFile.content,
      language: randomFile.language,
      isDirty: false
    };
    setCurrentFile(newFile);
  }, []);

  const handleSaveFile = useCallback(() => {
    // Mock save - in real implementation this would use Tauri file operations
    setCurrentFile(prev => ({ ...prev, isDirty: false }));
    console.log('File saved (mock)');
  }, []);

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
      // Mock AI response
      let response = `Thanks for your message: "${message}". `;
      
      if (message.toLowerCase().includes('analyze')) {
        response += `I can see you're working with ${currentFile.language} code. The current file has ${currentFile.content.split('\n').length} lines. Here are some observations about your code structure and suggestions for improvement.`;
      } else if (message.toLowerCase().includes('help')) {
        response += 'I can help you with code analysis, debugging, suggestions, refactoring, and more. What would you like me to help you with?';
      } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('bug')) {
        response += "I'll help you debug that! Here are some common issues to check for and potential solutions.";
      } else {
        response += `I'm ready to help with your ${currentFile.language} development. I can analyze your code, suggest improvements, help debug issues, and much more!`;
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
            handleOpenFile();
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
        }
      }
      
      if (e.key === 'Escape') {
        setIsToolPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleOpenFile, handleSaveFile, toggleToolPalette]);

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
        />
        
        {/* Main Content Area - 50/50 Split */}
        <div className="flex flex-1 overflow-hidden" style={{ width: mainContentWidth }}>
          {/* Editor Section - 50% */}
          <div className="w-1/2 flex flex-col overflow-hidden border-r border-border">
            {/* Tab Bar */}
            <div className="flex h-9 bg-titlebar-bg border-b border-border items-center px-3">
              <div className="flex items-center gap-2 bg-editor-bg px-3 py-1 rounded-t border-t border-l border-r border-border">
                <span className="text-sm">{currentFile.name}</span>
                {currentFile.isDirty && <span className="text-warning text-xs">●</span>}
                <button className="text-text-muted hover:text-text-primary text-sm ml-2">
                  ×
                </button>
              </div>
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
    </div>
  );
}

export default App;