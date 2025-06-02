import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  FolderOpen, 
  Save, 
  Brain, 
  Terminal,
  GitBranch,
  Settings,
  Code,
  Bug,
  Lightbulb,
  Zap
} from 'lucide-react';

interface ToolPaletteProps {
  onClose: () => void;
  onCommand: (command: string) => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: string;
}

const ToolPalette: React.FC<ToolPaletteProps> = ({ onClose, onCommand }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // File Operations
    { 
      id: 'new-file', 
      label: 'New File', 
      description: 'Create a new file',
      shortcut: 'Ctrl+N',
      icon: <FileText className="w-4 h-4" />, 
      category: 'File' 
    },
    { 
      id: 'open-file', 
      label: 'Open File', 
      description: 'Open an existing file',
      shortcut: 'Ctrl+O',
      icon: <FolderOpen className="w-4 h-4" />, 
      category: 'File' 
    },
    { 
      id: 'save-file', 
      label: 'Save File', 
      description: 'Save the current file',
      shortcut: 'Ctrl+S',
      icon: <Save className="w-4 h-4" />, 
      category: 'File' 
    },

    // AI Operations
    { 
      id: 'analyze-code', 
      label: 'Analyze Code', 
      description: 'Get AI analysis of current code',
      icon: <Code className="w-4 h-4" />, 
      category: 'AI' 
    },
    { 
      id: 'find-bugs', 
      label: 'Find Issues', 
      description: 'AI-powered bug detection',
      icon: <Bug className="w-4 h-4" />, 
      category: 'AI' 
    },
    { 
      id: 'explain-code', 
      label: 'Explain Code', 
      description: 'Get code explanation from AI',
      icon: <Lightbulb className="w-4 h-4" />, 
      category: 'AI' 
    },
    { 
      id: 'optimize-code', 
      label: 'Optimize Code', 
      description: 'Get optimization suggestions',
      icon: <Zap className="w-4 h-4" />, 
      category: 'AI' 
    },

    // Tools
    { 
      id: 'mcp-tools', 
      label: 'MCP Tools', 
      description: 'Manage MCP servers',
      icon: <Terminal className="w-4 h-4" />, 
      category: 'Tools' 
    },
    { 
      id: 'search-files', 
      label: 'Search Files', 
      description: 'Search across project files',
      shortcut: 'Ctrl+Shift+F',
      icon: <Search className="w-4 h-4" />, 
      category: 'Tools' 
    },
    { 
      id: 'source-control', 
      label: 'Source Control', 
      description: 'Git operations and history',
      shortcut: 'Ctrl+Shift+G',
      icon: <GitBranch className="w-4 h-4" />, 
      category: 'Tools' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      description: 'Open application settings',
      shortcut: 'Ctrl+,',
      icon: <Settings className="w-4 h-4" />, 
      category: 'Tools' 
    },
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredCommands.map(cmd => cmd.category)));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onCommand(filteredCommands[selectedIndex].label);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onCommand, onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50 fade-in">
      <div className="w-full max-w-2xl bg-sidebar-bg border border-border rounded-lg shadow-xl">
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-border rounded text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Commands */}
        <div className="max-h-96 overflow-y-auto">
          {categories.map((category) => {
            const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
            
            return (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-text-muted bg-gray-800 sticky top-0">
                  {category}
                </div>
                
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-accent text-white' : ''
                      }`}
                      onClick={() => {
                        onCommand(command.label);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-accent'}`}>
                        {command.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{command.label}</span>
                          {command.shortcut && (
                            <span className={`text-xs ${
                              isSelected ? 'text-white opacity-75' : 'text-text-muted'
                            }`}>
                              {command.shortcut}
                            </span>
                          )}
                        </div>
                        {command.description && (
                          <div className={`text-sm ${
                            isSelected ? 'text-white opacity-75' : 'text-text-muted'
                          }`}>
                            {command.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="p-8 text-center text-text-muted">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No commands found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-text-muted flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>
            {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolPalette;