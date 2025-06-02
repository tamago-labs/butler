import React from 'react';
import { 
  FolderOpen, 
  FileText,
  GitBranch,
  Settings,
  ArrowRight,
  ConciergeBell,
  Keyboard,
  Command,
  Save,
  Search,
  Terminal,
  ToggleRight
} from 'lucide-react';

interface WelcomePageProps {
  onOpenFolder: () => void;
  onShowAuth: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ 
  onOpenFolder, 
  onShowAuth, 
  isAuthenticated, 
  userName 
}) => {
  const shortcuts = [
    {
      icon: <Command className="w-5 h-5 text-blue-400" />,
      keys: ['Ctrl', 'N'],
      description: 'Create new file',
      category: 'File'
    },
    {
      icon: <FolderOpen className="w-5 h-5 text-blue-400" />,
      keys: ['Ctrl', 'O'],
      description: 'Open file',
      category: 'File'
    },
    {
      icon: <FolderOpen className="w-5 h-5 text-blue-400" />,
      keys: ['Ctrl', 'Shift', 'O'],
      description: 'Open folder',
      category: 'File'
    },
    {
      icon: <Save className="w-5 h-5 text-green-400" />,
      keys: ['Ctrl', 'S'],
      description: 'Save file',
      category: 'File'
    },
    {
      icon: <Command className="w-5 h-5 text-purple-400" />,
      keys: ['Ctrl', 'Shift', 'P'],
      description: 'Command palette',
      category: 'Navigation'
    },
    {
      icon: <Search className="w-5 h-5 text-yellow-400" />,
      keys: ['Ctrl', 'F'],
      description: 'Find in file',
      category: 'Search'
    },
    {
      icon: <ToggleRight className="w-5 h-5 text-green-400" />,
      keys: ['Ctrl', 'J'],
      description: 'Toggle AI panel',
      category: 'Panels'
    },
    {
      icon: <Keyboard className="w-5 h-5 text-gray-400" />,
      keys: ['Ctrl', 'B'],
      description: 'Toggle menu bar',
      category: 'Panels'
    },
    {
      icon: <Terminal className="w-5 h-5 text-orange-400" />,
      keys: ['Ctrl', 'W'],
      description: 'Close file',
      category: 'File'
    },
    {
      icon: <Command className="w-5 h-5 text-red-400" />,
      keys: ['Esc'],
      description: 'Close command palette',
      category: 'Navigation'
    }
  ];

  const shortcutCategories = {
    'File': shortcuts.filter(s => s.category === 'File'),
    'Navigation': shortcuts.filter(s => s.category === 'Navigation'),
    'Search': shortcuts.filter(s => s.category === 'Search'),
    'Panels': shortcuts.filter(s => s.category === 'Panels')
  };

  const quickActions = [
    {
      icon: <FolderOpen className="w-5 h-5" />,
      title: 'Open Folder',
      description: 'Start by opening a project folder',
      action: onOpenFolder,
      primary: true
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'New File',
      description: 'Create a new file to start coding',
      action: () => console.log('New file'),
      primary: false
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: 'Clone Repository',
      description: 'Clone a Git repository to get started',
      action: () => console.log('Clone repo'),
      primary: false
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Settings',
      description: 'Configure Butler to your preferences',
      action: () => console.log('Settings'),
      primary: false
    }
  ];

  const recentProjects = [
    { name: 'my-react-app', path: '/Users/dev/projects/my-react-app', lastOpened: '2 hours ago' },
    { name: 'api-server', path: '/Users/dev/projects/api-server', lastOpened: '1 day ago' },
    { name: 'website-redesign', path: '/Users/dev/projects/website-redesign', lastOpened: '3 days ago' }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-editor-bg">
      <div className="max-w-6xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <ConciergeBell className="w-12 h-12 text-accent" />
            <h1 className="text-4xl font-bold text-text-primary">Butler</h1>
          </div>
          
          {isAuthenticated ? (
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary">
                Welcome back, {userName}! 👋
              </h2>
              <p className="text-lg text-text-muted">
                Ready to code with AI assistance? Let's build something amazing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-text-primary">
                Your AI-Powered Code Editor
              </h2>
              <p className="text-lg text-text-muted max-w-2xl mx-auto">
                Butler combines the best of modern code editing with powerful AI assistance, 
                helping you write better code faster than ever before.
              </p>
              <button
                onClick={onShowAuth}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <>
            {/* Quick Actions */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-6 rounded-xl border border-border hover:border-accent transition-all text-left group ${
                      action.primary 
                        ? 'bg-accent hover:bg-accent-hover text-white' 
                        : 'bg-sidebar-bg hover:bg-gray-700'
                    }`}
                  >
                    <div className={`mb-3 ${action.primary ? 'text-white' : 'text-accent'}`}>
                      {action.icon}
                    </div>
                    <h4 className={`font-medium mb-1 ${
                      action.primary ? 'text-white' : 'text-text-primary'
                    }`}>
                      {action.title}
                    </h4>
                    <p className={`text-sm ${
                      action.primary ? 'text-white opacity-90' : 'text-text-muted'
                    }`}>
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">Recent Projects</h3>
                <button className="text-accent hover:text-accent-hover text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-sidebar-bg rounded-lg border border-border hover:border-accent transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                          {project.name}
                        </h4>
                        <p className="text-sm text-text-muted">{project.path}</p>
                      </div>
                    </div>
                    <div className="text-sm text-text-muted">
                      {project.lastOpened}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Keyboard Shortcuts Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Keyboard Shortcuts
            </h3>
            <p className="text-text-muted">
              Master Butler with these essential shortcuts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
              <div key={category} className="bg-sidebar-bg rounded-xl border border-border p-6">
                <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-accent" />
                  {category}
                </h4>
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {shortcut.icon}
                        <span className="text-text-primary text-sm">{shortcut.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 text-text-muted rounded border border-gray-600">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-text-muted text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Footer */}
        <div className="text-center space-y-4 pt-8 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-accent transition-colors">Documentation</a>
            <a href="#" className="hover:text-accent transition-colors">Tutorials</a>
            <a href="#" className="hover:text-accent transition-colors">Community</a>
            <a href="#" className="hover:text-accent transition-colors">Support</a>
          </div>
          <p className="text-xs text-text-muted">
            Butler v0.1.0 • Built with ❤️ by Tamago Labs
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
