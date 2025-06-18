import React, { useState } from 'react';
import { 
  Key,
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Info,
  CreditCard, 
} from 'lucide-react';
import type { User as UserType } from '../hooks/useAuth';

interface SettingsProps {
  user: UserType | null;
  isAuthenticated: boolean;
  onRefreshCredits?: () => Promise<number | void>;
  onShowAuth?: () => void;
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  user, 
  isAuthenticated, 
  onRefreshCredits, 
  onShowAuth,
  onLogout 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCredits = async () => {
    if (!onRefreshCredits) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshCredits();
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openTamagoLabs = () => {
    window.open('https://tamagolabs.com', '_blank');
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h3 className="text-lg font-medium text-text-primary mb-6">Settings</h3>
      
      <div className="space-y-6">
        {/* Authentication Section */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-accent" />
            <h4 className="text-sm font-medium text-text-primary">Authentication</h4>
          </div>
          
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Connected to Tamago Labs</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Name:</span>
                  <span className="text-text-primary">{user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Email:</span>
                  <span className="text-text-primary">{user.email}</span>
                </div>
                {user.organization && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Organization:</span>
                    <span className="text-text-primary">{user.organization}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Plan:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    user.plan === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                    user.plan === 'pro' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">AI Credits:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-medium">{user.aiCredits}</span>
                    <button
                      onClick={handleRefreshCredits}
                      disabled={isRefreshing}
                      className="p-1 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                      title="Refresh credits from Tamago Labs"
                    >
                      <RefreshCw className={`w-3 h-3 text-text-muted ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-600 space-y-2">
                <button
                  onClick={openTamagoLabs}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage Account
                </button>
                
                <button
                  onClick={onLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Not authenticated</span>
              </div>
              
              <p className="text-sm text-text-muted">
                Sign in with your Tamago Labs access key to unlock AI features.
              </p>
              
              <button
                onClick={onShowAuth}
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
  
        {/* Billing Information */}
        {isAuthenticated && user && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h4 className="text-sm font-medium text-text-primary">Usage & Billing</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Current Plan:</span>
                <span className="text-accent font-medium">
                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Credits Remaining:</span>
                <span className="text-accent font-medium">{user.aiCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Credit Refresh:</span>
                <span className="text-text-primary">
                  {user.plan === 'free' ? 'Monthly' : 'Unlimited'}
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-600">
              <button
                onClick={openTamagoLabs}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-gray-400" />
            <h4 className="text-sm font-medium text-text-primary">About Butler</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Version:</span>
              <span className="text-text-primary">0.1.0</span>
            </div>
            {/* <div className="flex items-center justify-between">
              <span className="text-text-muted">Tauri:</span>
              <span className="text-text-primary">v2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">React:</span>
              <span className="text-text-primary">v18.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Built by:</span>
              <span className="text-accent">Tamago Labs</span>
            </div> */}
          </div>
          
          <div className="pt-3 border-t border-gray-600">
            <button
              onClick={() => window.open('https://github.com/tamago-labs/butler', '_blank')}
              className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;