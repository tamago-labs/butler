// src/components/RightPanel.tsx - Updated to use new MCP implementation
import React, { useState } from 'react';
import { 
  Bot, 
  Terminal,
  Settings as SettingsIcon,
  X,
  Wrench
} from 'lucide-react';
import AIChat from './AIChat';
import MCPPanel from './MCPPanel';
import Settings from './Settings';
import type { ChatMessage } from '../App';
import type { FileTab } from '../hooks/useFileManager';
import type { User } from '../hooks/useAuth';
import type { ClaudeService } from '../services/claudeService';
import { useMCP } from '../hooks/useMCP';

interface RightPanelProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  currentFile: FileTab;
  isAuthenticated: boolean;
  user: User | null;
  claudeService: ClaudeService | null;
  onShowAuth?: () => void;
  onLogout?: () => void;
  onRefreshCredits?: () => Promise<number | void>;
  workspaceRoot?: string | null;
}

type RightPanelTab = 'ai' | 'mcp' | 'settings';

const RightPanel: React.FC<RightPanelProps> = ({
  chatHistory,
  onSendMessage,
  currentFile,
  isAuthenticated,
  user,
  claudeService,
  onShowAuth,
  onLogout,
  onRefreshCredits,
  workspaceRoot
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('ai');
  const { runningServers } = useMCP();

  const tabs = [
    { 
      id: 'ai' as const, 
      icon: Bot, 
      label: 'AI Assistant', 
      count: chatHistory.length,
      indicator: claudeService ? 'connected' : 'disconnected'
    },
    { 
      id: 'mcp' as const, 
      icon: Wrench, 
      label: 'MCP Tools', 
      count: runningServers.length 
    },
    { 
      id: 'settings' as const, 
      icon: SettingsIcon, 
      label: 'Settings' 
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <AIChat
            chatHistory={chatHistory}
            onSendMessage={onSendMessage}
            currentFile={currentFile}
            isAuthenticated={isAuthenticated}
            claudeService={claudeService}
            onShowAuth={onShowAuth}
            workspaceRoot={workspaceRoot}
          />
        );
      case 'mcp':
        return (
          <MCPPanel
            isAuthenticated={isAuthenticated}
            onShowAuth={onShowAuth}
          />
        );
      case 'settings':
        return (
          <Settings
            user={user}
            isAuthenticated={isAuthenticated}
            onRefreshCredits={onRefreshCredits}
            onShowAuth={onShowAuth}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-1/2 flex flex-col overflow-hidden bg-sidebar-bg">
      {/* Tab Bar */}
      <div className="flex-shrink-0 bg-titlebar-bg border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 relative ${
                activeTab === tab.id
                  ? 'text-accent border-accent bg-sidebar-bg'
                  : 'text-text-muted border-transparent hover:text-text-primary hover:bg-gray-700'
              }`}
              title={tab.label}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              
              {/* Connection indicator for AI tab */}
              {tab.id === 'ai' && tab.indicator && (
                <div className={`w-2 h-2 rounded-full ${
                  tab.indicator === 'connected' ? 'bg-green-400' : 'bg-red-400'
                }`} />
              )}
              
              {/* Count badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-accent text-white' 
                    : 'bg-gray-600 text-text-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RightPanel;