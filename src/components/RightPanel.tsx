import React, { useState } from 'react';
import { 
  Bot, 
  Terminal,
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import AIChat from './AIChat';
import MCPPanel from './MCPPanel';
import Settings from './Settings';
import type { ChatMessage, MCPServer } from '../App';
import type { FileTab } from '../hooks/useFileManager';
import type { User } from '../hooks/useAuth';


interface RightPanelProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  currentFile: FileTab;
  mcpServers: MCPServer[];
  onMCPAction: (serverName: string, action: 'start' | 'stop') => void;
  isAuthenticated: boolean;
  user: User | null;
  onShowAuth?: () => void;
  onLogout?: () => void;
  onRefreshCredits?: () => Promise<number | void>;
}

type RightPanelTab = 'ai' | 'mcp' | 'settings';

const RightPanel: React.FC<RightPanelProps> = ({
  chatHistory,
  onSendMessage,
  currentFile,
  mcpServers,
  onMCPAction,
  isAuthenticated,
  user,
  onShowAuth,
  onLogout,
  onRefreshCredits
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('ai');

  const tabs = [
    { id: 'ai' as const, icon: Bot, label: 'AI Assistant', count: chatHistory.length },
    { id: 'mcp' as const, icon: Terminal, label: 'MCP Tools', count: mcpServers.filter(s => s.status === 'running').length },
    { id: 'settings' as const, icon: SettingsIcon, label: 'Settings' }
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
            onShowAuth={onShowAuth}
          />
        );
      case 'mcp':
        return (
          <MCPPanel
            mcpServers={mcpServers}
            onMCPAction={onMCPAction}
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-accent border-accent bg-sidebar-bg'
                  : 'text-text-muted border-transparent hover:text-text-primary hover:bg-gray-700'
              }`}
              title={tab.label}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
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
