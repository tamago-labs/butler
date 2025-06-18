import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Settings,
  Search, 
  HelpCircle,
  ChevronDown,
  Wrench,
  SidebarOpen,
  SidebarClose,
  Plus,
  Bot,
  Sidebar
} from 'lucide-react';

interface MenuBarProps {
  onAction: (action: string) => Promise<void> | void;
  isRightPanelVisible: boolean;
}

interface MenuItem {
  label?: string;
  action?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  submenu?: MenuItem[];
  separator?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ onAction, isRightPanelVisible }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null | undefined>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', action: 'new-file', shortcut: 'Ctrl+N', icon: <Plus className="w-4 h-4" /> },
      { label: 'Open File...', action: 'open-file', shortcut: 'Ctrl+O', icon: <FileText className="w-4 h-4" /> },
      { label: 'Open Folder...', action: 'open-folder', icon: <FolderOpen className="w-4 h-4" /> },
      { separator: true },
      { label: 'Save', action: 'save-file', shortcut: 'Ctrl+S', icon: <Save className="w-4 h-4" /> },
      { label: 'Save As...', action: 'save-as', shortcut: 'Ctrl+Shift+S' },
      { separator: true },
      { label: 'Exit', action: 'exit', shortcut: 'Ctrl+Q' },
    ],
    Edit: [
      { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
      { separator: true },
      { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
      { separator: true },
      { label: 'Find', action: 'find', shortcut: 'Ctrl+F', icon: <Search className="w-4 h-4" /> },
      { label: 'Replace', action: 'replace', shortcut: 'Ctrl+H' },
    ],
    View: [
      {
        label: isRightPanelVisible ? 'Hide AI Panel' : 'Show AI Panel',
        action: 'toggle-right-panel',
        shortcut: 'Ctrl+J',
        icon: isRightPanelVisible ? <Sidebar className="w-4 h-4" /> : <Sidebar className="w-4 h-4" />
      },
      { separator: true },
      { label: 'AI Assistant', action: 'toggle-ai', shortcut: 'Ctrl+Shift+A', icon: <Bot className="w-4 h-4" /> },
      { label: 'MCP Tools', action: 'toggle-mcp', shortcut: 'Ctrl+Shift+M', icon: <Wrench className="w-4 h-4" /> },
      { separator: true },
      { label: 'Toggle Menu Bar', action: 'toggle-menu', shortcut: 'Ctrl+B' },
      { label: 'Command Palette', action: 'command-palette', shortcut: 'Ctrl+Shift+P' },
    ], 
    Tools: [
      { label: 'Settings', action: 'settings', shortcut: 'Ctrl+,', icon: <Settings className="w-4 h-4" /> },
    ],
    Help: [
      { label: 'Getting Started', action: 'help-getting-started', icon: <HelpCircle className="w-4 h-4" /> },
      { label: 'Keyboard Shortcuts', action: 'help-shortcuts' },
      { label: 'Documentation', action: 'help-docs' },
      { separator: true },
      { label: 'About Butler', action: 'about' },
    ],
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
      setActiveSubmenu(null);
    } else {
      setActiveMenu(menuName);
      setActiveSubmenu(null);
    }
  };

  const handleMenuItemClick = async (item: MenuItem) => {
    if (item.action) {
      await onAction(item.action);
      setActiveMenu(null);
      setActiveSubmenu(null);
    }
  };

  const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
    if (item.separator) {
      return <div key="separator" className="h-px bg-border my-1" />;
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <button
        key={item.label}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${isSubmenu ? 'pl-8' : ''
          }`}
        onClick={() => {
          if (hasSubmenu) {
            setActiveSubmenu(activeSubmenu === item.label ? null : item.label);
          } else {
            handleMenuItemClick(item);
          }
        }}
        onMouseEnter={() => {
          if (hasSubmenu) {
            setActiveSubmenu(item.label);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.shortcut && (
            <span className="text-xs text-text-muted">{item.shortcut}</span>
          )}
          {hasSubmenu && <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
    );
  };

  return (
    <div ref={menuRef} className="h-8 bg-titlebar-bg border-b border-border flex items-center px-2 text-sm">
      {Object.entries(menuItems).map(([menuName, items]) => (
        <div key={menuName} className="relative">
          <button
            className={`px-3 py-1 rounded hover:bg-gray-700 transition-colors ${activeMenu === menuName ? 'bg-gray-700' : ''
              }`}
            onClick={() => handleMenuClick(menuName)}
            onMouseEnter={() => {
              if (activeMenu && activeMenu !== menuName) {
                setActiveMenu(menuName);
                setActiveSubmenu(null);
              }
            }}
          >
            {menuName}
          </button>

          {activeMenu === menuName && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-sidebar-bg border border-border rounded-md shadow-lg z-50 py-1">
              {items.map((item) => (
                <div key={item.label} className="relative">
                  {renderMenuItem(item)}

                  {item.submenu && activeSubmenu === item.label && (
                    <div className="absolute top-0 left-full ml-1 w-56 bg-sidebar-bg border border-border rounded-md shadow-lg py-1">
                      {item.submenu.map((subItem) => renderMenuItem(subItem, true))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
       <div className="flex ml-auto">
        <button
          onClick={() => onAction("toggle-right-panel")}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded transition-colors no-drag text-xs text-text-muted"
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

export default MenuBar;