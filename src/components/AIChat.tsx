import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Code, 
  Bug, 
  Lightbulb, 
  Zap,
  Copy,
  RefreshCw
} from 'lucide-react';
import type { ChatMessage } from '../App'; 
import type { FileTab } from '../hooks/useFileManager';

interface AIChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  currentFile: FileTab;
  isAuthenticated: boolean;
  onShowAuth?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({
  chatHistory,
  onSendMessage,
  currentFile,
  isAuthenticated,
  onShowAuth
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    {
      icon: <Code className="w-4 h-4" />,
      label: 'Analyze Code',
      action: () => setInput(`Analyze my ${currentFile.language} code and suggest improvements`),
    },
    {
      icon: <Bug className="w-4 h-4" />,
      label: 'Find Issues',
      action: () => setInput(`Review my code for potential bugs and issues`),
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      label: 'Explain Code',
      action: () => setInput(`Explain what this code does and how it works`),
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Optimize',
      action: () => setInput(`How can I optimize this code for better performance?`),
    }
  ];

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const regenerateResponse = (messageId: string) => {
    // Find the user message that triggered this AI response
    const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = chatHistory[messageIndex - 1];
      if (userMessage.sender === 'user') {
        onSendMessage(userMessage.content);
      }
    }
  };

  return (
    <div className="bg-sidebar-bg flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-titlebar-bg border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent" />
          <h3 className="font-medium text-text-primary">AI Assistant</h3>
        </div>
        
        <div className="mt-2 text-xs text-text-muted">
          Working on: <span className="text-accent">{currentFile.name}</span>
          {currentFile.isDirty && <span className="text-warning ml-1">●</span>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 border-b border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition-colors"
              title={action.label}
            >
              {action.icon}
              <span className="text-sm truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center text-text-muted py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h4 className="font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm mb-4">
              I can help you with code analysis, debugging, explanations, and more!
            </p>
          </div>
        )}

        {chatHistory.map((message) => (
          <div key={message.id} className="group">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {message.sender === 'user' ? (
                  <div className="w-7 h-7 bg-success rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-text-muted">
                    {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    <span className="ml-2">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 hover:bg-gray-700 rounded text-text-muted"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {message.sender === 'assistant' && (
                      <button
                        onClick={() => regenerateResponse(message.id)}
                        className="p-1 hover:bg-gray-700 rounded text-text-muted"
                        title="Regenerate response"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-muted mb-1">AI Assistant</div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border p-3">
        {!isAuthenticated ? (
          <div className="text-center space-y-3">
            <div className="p-4 bg-gray-800 rounded-lg border border-accent/20">
              <Bot className="w-8 h-8 mx-auto mb-2 text-accent" />
              <h4 className="font-medium text-text-primary mb-1">AI Assistant Available</h4>
              <p className="text-sm text-text-muted mb-3">
                Sign in to unlock AI-powered code assistance with 100 free credits
              </p>
              <button
                onClick={onShowAuth}
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded font-medium transition-colors"
              >
                Sign In for AI Help
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about your code..."
                  className="w-full bg-gray-700 border border-border rounded px-3 py-2 resize-none text-text-primary focus:outline-none focus:border-accent transition-colors"
                  style={{ minHeight: '40px' }}
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="text-xs text-text-muted mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChat;