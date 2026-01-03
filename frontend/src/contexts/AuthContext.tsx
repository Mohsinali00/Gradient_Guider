import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email?: string;
  loginId?: string;
  role: 'admin' | 'employee';
  firstName?: string;
  lastName?: string;
  avatar?: string;
  forcePasswordReset?: boolean;
}

interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  login: (loginIdOrEmail: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  loading: boolean;
}

interface SignupData {
  companyName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  logo?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setCompany(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('tokens');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      return response.data.data.accessToken;
    } catch (error) {
      return null;
    }
  };

  // Setup axios interceptor for token refresh
  useEffect(() => {
    let refreshing = false;

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedTokens = localStorage.getItem('tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip refresh for login/signup/refresh endpoints
        if (originalRequest?.url?.includes('/api/auth/login') || 
            originalRequest?.url?.includes('/api/auth/admin/signup') ||
            originalRequest?.url?.includes('/api/auth/refresh')) {
          return Promise.reject(error);
        }

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't try to refresh if we're already refreshing
          if (refreshing) {
            return Promise.reject(error);
          }

          const storedTokens = localStorage.getItem('tokens');
          if (!storedTokens) {
            logout();
            return Promise.reject(error);
          }

          const tokens = JSON.parse(storedTokens);
          refreshing = true;

          try {
            const newAccessToken = await refreshAccessToken(tokens.refreshToken);

            if (newAccessToken) {
              // Update tokens
              const updatedTokens = {
                ...tokens,
                accessToken: newAccessToken
              };
              localStorage.setItem('tokens', JSON.stringify(updatedTokens));
              setTokens(updatedTokens);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              refreshing = false;
              return axios(originalRequest);
            } else {
              // Refresh failed, logout
              refreshing = false;
              logout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            refreshing = false;
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCompany = localStorage.getItem('company');
    const storedTokens = localStorage.getItem('tokens');

    if (storedUser && storedCompany && storedTokens) {
      setUser(JSON.parse(storedUser));
      setCompany(JSON.parse(storedCompany));
      setTokens(JSON.parse(storedTokens));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${JSON.parse(storedTokens).accessToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (loginIdOrEmail: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        loginIdOrEmail,
        password,
      });

      const { user: userData, company: companyData, tokens: tokenData } = response.data.data;

      setUser(userData);
      setCompany(companyData);
      setTokens(tokenData);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('company', JSON.stringify(companyData));
      localStorage.setItem('tokens', JSON.stringify(tokenData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData.accessToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await axios.post('/api/auth/admin/signup', data);

      const { user: userData, company: companyData, tokens: tokenData } = response.data.data;

      setUser(userData);
      setCompany(companyData);
      setTokens(tokenData);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('company', JSON.stringify(companyData));
      localStorage.setItem('tokens', JSON.stringify(tokenData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData.accessToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  };


  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, company, tokens, login, signup, logout, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

