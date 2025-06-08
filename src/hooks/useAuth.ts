import { useState, useCallback, useEffect } from 'react';
import { ClaudeService } from '../services/claudeService';
 
const API_KEY = atob("c2stYW50LWFwaTAzLVpCQTN3ejVfT1RvTUlUd1gtM2xXMDk2bkwtSWhwbGdFLTBBRXJOakJKNmwyT2dRTjhwZXNVVHpvMG1UeWdrNndCaktvMDZKa0RLZVpRVkM2SDc1NGVnLUhVZG0yd0FB")

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  aiCredits: number;
  accessKey?: string;
  organization?: string;
  claudeApiKey?: string; // Add Claude API key
}

interface AccessKeyResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    organization?: string;
  };
  plan: 'free' | 'pro' | 'enterprise';
  aiCredits: number;
  accessKey: string;
  claudeApiKey?: string; // Claude API key from Tamago Labs
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [claudeService, setClaudeService] = useState<ClaudeService | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('butler_user');
        const storedAccessKey = localStorage.getItem('butler_access_key');
        if (storedUser && storedAccessKey) {
          const userData = JSON.parse(storedUser);
          setUser({ ...userData, accessKey: storedAccessKey });
          setIsAuthenticated(true);

          // Initialize Claude service if API key is available
          if (userData.claudeApiKey) {
            const service = new ClaudeService(userData.claudeApiKey);
            setClaudeService(service);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('butler_user');
        localStorage.removeItem('butler_access_key');
      }
    };

    checkExistingSession();
  }, []);


  const authenticateWithAccessKey = useCallback(async (accessKey: string) => {
    setIsLoading(true);

    try {
      // Simulate API call to tamagolabs.com that returns Claude API key
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock access key validation with Claude API key
      if (accessKey === 'butler-demo') {
        const response: AccessKeyResponse = {
          user: {
            id: 'user-demo',
            name: 'Demo User',
            email: 'demo@tamagolabs.com',
            avatar: 'https://github.com/github.png',
            organization: 'Tamago Labs'
          },
          plan: 'pro',
          aiCredits: 1000,
          accessKey,
          claudeApiKey: API_KEY || 'demo-claude-key' // In real app, this comes from your backend
        };

        const userData: User = {
          ...response.user,
          plan: response.plan,
          aiCredits: response.aiCredits,
          accessKey: response.accessKey,
          claudeApiKey: response.claudeApiKey
        };

        // Initialize Claude service
        if (response.claudeApiKey && response.claudeApiKey !== 'demo-claude-key') {
          const service = new ClaudeService(response.claudeApiKey);

          // Test the connection
          const isConnected = await service.testConnection();
          if (isConnected) {
            setClaudeService(service);
          } else {
            throw new Error('Failed to connect to Claude API');
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('butler_user', JSON.stringify({
          ...userData,
          accessKey: undefined // Don't store access key in user object
        }));
        localStorage.setItem('butler_access_key', accessKey);

      } else {
        throw new Error('Invalid access key');
      }

    } catch (error: any) {
      console.error('Access key authentication failed:', error);
      throw new Error(`Invalid access key. Please get a valid access key from tamagolabs.com.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateAccessKey = useCallback(async (accessKey: string): Promise<boolean> => {
    try {
      if (!accessKey.trim()) return false;
      // if (!accessKey.startsWith('tamago-')) return false;
      // if (accessKey.length < 16) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setClaudeService(null);
    localStorage.removeItem('butler_user');
    localStorage.removeItem('butler_access_key');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('butler_user', JSON.stringify({
        ...updatedUser,
        accessKey: undefined
      }));
    }
  }, [user]);

  const refreshCredits = useCallback(async () => {
    if (!user?.accessKey) return;

    try {
      // Simulate API call to refresh credits from tamagolabs.com
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCredits = user.plan === 'enterprise' ? 5000 :
        user.plan === 'pro' ? 1000 : 100;

      updateUser({ aiCredits: newCredits });
      return newCredits;
    } catch (error) {
      console.error('Failed to refresh credits:', error);
      throw error;
    }
  }, [user?.accessKey, user?.plan, updateUser]);

  const useAICredit = useCallback(() => {
    if (user && user.aiCredits > 0) {
      updateUser({ aiCredits: user.aiCredits - 1 });
      return true;
    }
    return false;
  }, [user, updateUser]);

  const hasAIAccess = useCallback(() => {
    if (!isAuthenticated || !user || !claudeService) return false;

    // Pro and enterprise users have unlimited access
    if (user.plan === 'pro' || user.plan === 'enterprise') {
      return true;
    }

    // Free users need credits
    return user.aiCredits > 0;
  }, [isAuthenticated, user, claudeService]);


  const addAICredits = useCallback((credits: number) => {
    if (user) {
      updateUser({ aiCredits: user.aiCredits + credits });
    }
  }, [user, updateUser]);

  const upgradePlan = useCallback((newPlan: 'pro' | 'enterprise') => {
    if (user) {
      const bonusCredits = newPlan === 'pro' ? 1000 : 5000;
      updateUser({
        plan: newPlan,
        aiCredits: user.aiCredits + bonusCredits
      });
    }
  }, [user, updateUser]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    claudeService, // Add Claude service to return 
    // Actions
    authenticateWithAccessKey,
    validateAccessKey,
    logout,
    updateUser,
    useAICredit,
    addAICredits,
    upgradePlan,
    refreshCredits,
    // Computed
    hasAIAccess
  };
};

// Mock access keys for testing
export const mockAccessKeys = {
  demo: 'tamago-demo-key-123',
  free: 'tamago-free-key-456',
  pro: 'tamago-pro-key-789',
  enterprise: 'tamago-enterprise-key-abc'
};
