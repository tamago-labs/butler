import React from 'react';
import { 
  FolderOpen, 
  Brain, 
  Terminal, 
  Zap, 
  Shield, 
  Code, 
  FileText,
  GitBranch,
  Search,
  Settings,
  ArrowRight,
  Star,
  Users,
  Download,
  ConciergeBell
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
  const features = [
    {
      icon: <Brain className="w-6 h-6 text-blue-400" />,
      title: 'AI-Powered Coding',
      description: 'Get intelligent code suggestions, explanations, and debugging help from advanced AI models.',
      action: 'Start Coding with AI'
    },
    {
      icon: <Terminal className="w-6 h-6 text-green-400" />,
      title: 'MCP Tools Integration',
      description: 'Connect external tools and databases through the Model Context Protocol for enhanced capabilities.',
      action: 'Explore MCP Tools'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: 'Lightning Fast',
      description: 'Built with Tauri for native performance while maintaining web technology flexibility.',
      action: 'Experience Speed'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: 'Privacy First',
      description: 'Your code stays secure with local processing and encrypted cloud sync when needed.',
      action: 'Learn About Security'
    }
  ];

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

        {/* Features Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text-primary text-center">
            Why Choose Butler?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-sidebar-bg rounded-xl border border-border hover:border-accent transition-all group"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {feature.title}
                </h4>
                <p className="text-text-muted mb-4">{feature.description}</p>
                <button className="text-accent hover:text-accent-hover text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  {feature.action} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-accent to-blue-600 rounded-xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6" />
                <span className="text-2xl font-bold">10K+</span>
              </div>
              <p className="opacity-90">Developers</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Code className="w-6 h-6" />
                <span className="text-2xl font-bold">1M+</span>
              </div>
              <p className="opacity-90">Lines of Code</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6" />
                <span className="text-2xl font-bold">4.9/5</span>
              </div>
              <p className="opacity-90">User Rating</p>
            </div>
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
