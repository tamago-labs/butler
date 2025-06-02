import React from 'react';
import { 
  Bot, 
  FileText,
  Activity,
  SidebarOpen,
  SidebarClose
} from 'lucide-react';

interface StatusBarProps {
  language: string;
  lineNumber: number;
  column: number;
  aiStatus: string;
  isRightPanelVisible: boolean;
  onToggleRightPanel: () => Promise<void> | void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  language,
  lineNumber,
  column,
  aiStatus,
  isRightPanelVisible,
  onToggleRightPanel
}) => {
  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'text-yellow-400',
      typescript: 'text-blue-400',
      python: 'text-green-400',
      rust: 'text-orange-400',
      css: 'text-blue-300',
      html: 'text-red-400',
      json: 'text-gray-400',
    };
    return colors[lang] || 'text-gray-400';
  };

  const getAIStatusIcon = () => {
    switch (aiStatus.toLowerCase()) {
      case 'active':
        return <Activity className="w-3 h-3 text-green-400" />;
      default:
        return <Bot className="w-3 h-3 text-accent" />;
    }
  };

  return (
    <div className="h-6 bg-titlebar-bg border-t border-border flex items-center justify-between px-3 text-xs text-text-muted">
      {/* Left side - Language info */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-1 ${getLanguageColor(language)}`}>
          <FileText className="w-3 h-3" />
          <span className="capitalize">{language}</span>
        </div>
      </div>

      {/* Right side - Status info and controls */}
      <div className="flex items-center gap-4">
        <span>Ln {lineNumber}, Col {column}</span>
        
        <div className="flex items-center gap-1">
          {getAIStatusIcon()}
          <span>AI {aiStatus}</span>
        </div>
        
        {/* Right Panel Toggle */}
        <button
          onClick={onToggleRightPanel}
          className="flex items-center gap-1 hover:text-text-primary transition-colors"
          title={isRightPanelVisible ? 'Hide Right Panel (Ctrl+J)' : 'Show Right Panel (Ctrl+J)'}
        >
          {isRightPanelVisible ? (
            <SidebarClose className="w-3 h-3" />
          ) : (
            <SidebarOpen className="w-3 h-3" />
          )}
          <span>{isRightPanelVisible ? 'Hide AI Panel' : 'Show AI Panel'}</span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;