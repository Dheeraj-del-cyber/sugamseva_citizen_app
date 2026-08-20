import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api, { setAuthToken, getAuthToken } from '../services/api';

export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  avatar?: string;
  hasOnboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  markOnboardingComplete: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const { data } = await api.get('/profile');
          if (data.success && data.user) {
            setUser({
              ...data.user,
              hasOnboarded: localStorage.getItem(`onboarding_${data.user.id}`) === 'true',
            });
          } else {
            setAuthToken(null);
          }
        } catch (error) {
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const clearError = () => setAuthError(null);

  const login = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/signin', { phone, password });
      if (data.success && data.token && data.user) {
        setAuthToken(data.token);
        setUser({
          ...data.user,
          hasOnboarded: localStorage.getItem(`onboarding_${data.user.id}`) === 'true',
        });
        setIsLoading(false);
        return true;
      }
      setAuthError(data.message || 'Login failed');
      setIsLoading(false);
      return false;
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Network error');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/signup', { name, phone, password });
      if (data.success && data.token && data.user) {
        setAuthToken(data.token);
        setUser({
          ...data.user,
          hasOnboarded: false, // Force onboarding for new users
        });
        setIsLoading(false);
        return true;
      }
      setAuthError(data.message || 'Registration failed');
      setIsLoading(false);
      return false;
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Network error');
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await api.put('/profile', updates);
      if (data.success && data.user) {
        setUser(prev => prev ? { ...prev, ...data.user } : null);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error: any) {
      setAuthError(error.response?.data?.message || 'Update failed');
      setIsLoading(false);
      return false;
    }
  };

  const markOnboardingComplete = async () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
      setUser({ ...user, hasOnboarded: true });
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        updateProfile,
        markOnboardingComplete,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
