import React, { useState } from 'react';
import {  Key, AlertCircle, CheckCircle, ConciergeBell } from 'lucide-react';

interface AccessKeyFormProps {
  onAuthenticate: (accessKey: string) => Promise<void>;
  onValidateKey?: (accessKey: string) => Promise<boolean>;
}

const AccessKeyForm: React.FC<AccessKeyFormProps> = ({ onAuthenticate, onValidateKey }) => {
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await onAuthenticate(accessKey.trim());
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccessKey(value);
    setError('');
    
    if (value.trim() && onValidateKey) {
      setIsValidating(true);
      try {
        const valid = await onValidateKey(value.trim());
        setIsValid(valid);
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    } else {
      setIsValid(null);
    }
  };

  const openTamagoLabs = () => {
    window.open('https://tamagolabs.com', '_blank');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-sidebar-bg rounded-xl p-8 border border-border shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ConciergeBell className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold text-text-primary">Butler</h1>
          </div>
          {/* <h2 className="text-xl font-semibold text-text-primary mb-2">
            Access Key Authentication
          </h2>
          <p className="text-text-muted">
            Enter your access key from Tamago Labs to unlock AI-powered coding assistance
          </p> */}
        </div>

        {/* Get Access Key Button */}
        {/* <button
          onClick={openTamagoLabs}
          className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded-lg transition-colors mb-6"
        >
          <ExternalLink className="w-5 h-5" />
          Get Access Key from Tamago Labs
        </button> */}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-sidebar-bg px-2 text-text-muted">Enter your access key</span>
          </div>
        </div>

        {/* Access Key Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={accessKey}
                onChange={handleKeyChange}
                className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-text-primary focus:outline-none focus:ring-1 transition-colors ${
                  isValid === true 
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : isValid === false
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-border focus:border-accent focus:ring-accent'
                }`}
                placeholder="your-access-key-here"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isValidating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full"></div>
                ) : isValid === true ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isValid === false ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : null}
              </div>
            </div>
            {isValid === false && (
              <p className="mt-2 text-sm text-red-400">
                Invalid access key format. Keys should start with 'tamago-' and be at least 16 characters.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !accessKey.trim() || isValid === false}
            className="w-full bg-accent hover:bg-accent-hover text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Sign In with Access Key'}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-accent mb-2">Demo Access Keys:</p>
            <div className="text-xs text-text-muted space-y-1 font-mono">
              <div>🚀 butler-demo (Pro - 1000 credits)</div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-text-primary mb-2">How to get your access key:</h4>
            <ol className="text-xs text-text-muted text-left space-y-1 list-decimal list-inside">
              <li>Visit tamagolabs.com and sign in to your account</li>
              <li>Navigate to the "API Keys" or "Integrations" section</li>
              <li>Generate a new access key for Butler</li>
              <li>Copy and paste the key here to authenticate</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessKeyForm;