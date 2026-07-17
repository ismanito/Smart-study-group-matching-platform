import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'studyMatchToken';

function decodeJwt(token) {
  try {
    const base64 = token.includes('.') ? token.split('.')[1] : token;
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed && typeof parsed === 'object' ? parsed.payload || parsed : null;
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      const decoded = decodeJwt(storedToken);
      if (decoded) {
        setToken(storedToken);
        setUser(decoded);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }, []);

  const login = (newToken) => {
    const decoded = decodeJwt(newToken);
    if (!decoded) {
      return;
    }
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    if (!user) return false;
    return user.role === 'admin' || user.isAdmin === true || (Array.isArray(user.roles) && user.roles.includes('admin'));
  };

  const value = useMemo(
    () => ({ token, user, login, logout, isAdmin }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
