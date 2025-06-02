import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  aiCredits: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('butler_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('butler_user');
      }
    };

    checkExistingSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication check
      if (email === 'demo@butler.ai' && password === 'demo123') {
        const userData: User = {
          id: 'user-demo',
          name: 'Demo User',
          email,
          plan: 'pro',
          aiCredits: 500
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('butler_user', JSON.stringify(userData));
      } else if (email.includes('@') && password.length >= 6) {
        // Accept any valid email format with 6+ char password
        const userData: User = {
          id: 'user-' + Date.now(),
          name: email.split('@')[0], // Use email prefix as name
          email,
          plan: 'free',
          aiCredits: 100
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('butler_user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid credentials');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock registration validation
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      if (!email.includes('@')) {
        throw new Error('Valid email is required');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Create new user
      const userData: User = {
        id: 'user-' + Date.now(),
        name: name.trim(),
        email,
        plan: 'free',
        aiCredits: 100
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('butler_user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const githubAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulate GitHub OAuth - replace with actual OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock GitHub user data
      const userData: User = {
        id: 'github-user-' + Date.now(),
        name: 'GitHub Developer',
        email: 'developer@github.com',
        avatar: 'https://github.com/github.png',
        plan: 'free',
        aiCredits: 100
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('butler_user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('GitHub auth failed:', error);
      throw new Error('GitHub authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('butler_user');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('butler_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const useAICredit = useCallback(() => {
    if (user && user.aiCredits > 0) {
      updateUser({ aiCredits: user.aiCredits - 1 });
      return true;
    }
    return false;
  }, [user, updateUser]);

  const hasAIAccess = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    
    // Pro and enterprise users have unlimited access
    if (user.plan === 'pro' || user.plan === 'enterprise') {
      return true;
    }
    
    // Free users need credits
    return user.aiCredits > 0;
  }, [isAuthenticated, user]);

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
    
    // Actions
    login,
    register,
    githubAuth,
    logout,
    updateUser,
    useAICredit,
    addAICredits,
    upgradePlan,
    
    // Computed
    hasAIAccess
  };
};

// Mock user data for testing
export const mockUsers = {
  demo: {
    email: 'demo@butler.ai',
    password: 'demo123',
    name: 'Demo User',
    plan: 'pro' as const,
    aiCredits: 500
  },
  free: {
    email: 'user@example.com',
    password: 'password123',
    name: 'Free User',
    plan: 'free' as const,
    aiCredits: 100
  },
  pro: {
    email: 'pro@example.com',
    password: 'password123',
    name: 'Pro User',
    plan: 'pro' as const,
    aiCredits: 1000
  }
};
