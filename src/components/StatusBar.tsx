import React from 'react';
import { 
  Bot, 
  GitBranch, 
  Wifi,
  FileText,
  Activity
} from 'lucide-react';

interface StatusBarProps {
  language: string;
  lineNumber: number;
  column: number;
  aiStatus: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  language,
  lineNumber,
  column,
  aiStatus
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
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>
        
        <div className={`flex items-center gap-1 ${getLanguageColor(language)}`}>
          <FileText className="w-3 h-3" />
          <span className="capitalize">{language}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span>Ln {lineNumber}, Col {column}</span>
        
        <div className="flex items-center gap-1">
          {getAIStatusIcon()}
          <span>AI {aiStatus}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-green-400" />
          <span>Online</span>
        </div>
        
        <div className="flex items-center gap-1 text-accent">
          <div className="w-3 h-3 border border-accent rounded-sm flex">
            <div className="w-1/2 bg-accent opacity-60"></div>
            <div className="w-1/2 bg-accent opacity-30"></div>
          </div>
          <span>50/50</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;