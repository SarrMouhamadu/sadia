import { createContext, useContext, useState, type ReactNode } from 'react';
import { authService, type User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage if available
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (data: any) => {
    const result = await authService.login(data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout(); // Call service to clear tokens
    setUser(null);
    // Ideally redirect happens in App.tsx due to !user, or we can refresh:
    // window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
