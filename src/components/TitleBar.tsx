import React from 'react';
import { Brain, Minimize2, Square, X, User, LogOut, Settings, SidebarOpen, SidebarClose, ConciergeBell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TitleBarProps {
  currentFileName: string;
  user?: { name: string; email: string; aiCredits: number; plan: string } | null;
  isAuthenticated: boolean;
  onLogout?: () => void;
  onShowAuth?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ 
  currentFileName, 
  user, 
  isAuthenticated, 
  onLogout, 
  onShowAuth
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-10 bg-titlebar-bg border-b border-border flex items-center justify-between px-4 text-sm drag-region">
      {/* Left: App Title and File */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ConciergeBell className="w-5 h-5 text-accent" />
          <span className="font-medium text-text-primary">Butler</span>
        </div>
        
        <div className="flex items-center gap-2 text-text-secondary">
          <span>—</span>
          <span>{currentFileName}</span>
        </div>
      </div>

      {/* Center: Right Panel Toggle */}
      {/* <div className="flex items-center">
        <button
          onClick={onToggleRightPanel}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded transition-colors no-drag text-xs text-text-muted"
          title={isRightPanelVisible ? 'Hide Right Panel (Ctrl+J)' : 'Show Right Panel (Ctrl+J)'}
        >
          {isRightPanelVisible ? (
            <SidebarClose className="w-3 h-3" />
          ) : (
            <SidebarOpen className="w-3 h-3" />
          )}
          <span>{isRightPanelVisible ? 'Hide Panel' : 'Show Panel'}</span>
        </button>
      </div> */}

      {/* Right: User Menu and Window Controls */}
      <div className="flex items-center gap-2">
        {/* User Menu */}
        {isAuthenticated && user ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded transition-colors no-drag"
              title="User Menu"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{user.name}</span>
              <span className="text-xs text-accent">{user.aiCredits} credits</span>
            </button>
            
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-sidebar-bg border border-border rounded-md shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <div className="text-sm text-text-muted">{user.email}</div>
                  <div className="text-xs text-accent mt-1">
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan • {user.aiCredits} AI Credits
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add settings action here
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-700 transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-700 transition-colors text-left text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onShowAuth}
            className="px-3 py-1 bg-accent hover:bg-accent-hover text-white rounded transition-colors text-sm no-drag"
          >
            Sign In
          </button>
        )}
        
        {/* Window Controls */}
        <div className="flex items-center gap-1 ml-2">
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
    </div>
  );
};

export default TitleBar;