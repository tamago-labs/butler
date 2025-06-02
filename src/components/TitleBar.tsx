import React from 'react';
import { Brain, Minimize2, Square, X } from 'lucide-react';

interface TitleBarProps {
  currentFileName: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ currentFileName }) => {
  return (
    <div className="h-10 bg-titlebar-bg border-b border-border flex items-center justify-between px-4 text-sm drag-region">
      {/* Left: App Title and File */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <span className="font-medium text-text-primary">Butler</span>
        </div>
        
        <div className="flex items-center gap-2 text-text-secondary">
          <span>—</span>
          <span>{currentFileName}</span>
        </div>
      </div>

      {/* Center: Split Layout Indicator */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-accent rounded-sm flex">
            <div className="w-1/2 bg-accent opacity-60"></div>
            <div className="w-1/2 bg-accent opacity-30"></div>
          </div>
          <span>50/50 Split</span>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1">
        <button 
          className="p-2 hover:bg-gray-700 rounded transition-colors no-drag"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
        <button 
          className="p-2 hover:bg-gray-700 rounded transition-colors no-drag"
          title="Maximize"
        >
          <Square className="w-4 h-4" />
        </button>
        <button 
          className="p-2 hover:bg-red-600 rounded transition-colors no-drag"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;