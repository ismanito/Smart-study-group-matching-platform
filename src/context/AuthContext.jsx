import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'studyMatchToken';

function decodeJwt(token) {
  try {
    const base64 = token.includes('.') ? token.split('.')[1] : token;
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed && typeof parsed === 'object' ? parsed.payload || parsed : null;
  } catch (error) {
    return null;
  }
}

function readStoredSession() {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (!storedToken) {
    return { token: null, user: null };
  }

  const decoded = decodeJwt(storedToken);
  if (!decoded) {
    localStorage.removeItem(TOKEN_KEY);
    return { token: null, user: null };
  }

  return { token: storedToken, user: decoded };
}

export function AuthProvider({ children }) {
  const initialSession = readStoredSession();
  const [token, setToken] = useState(initialSession.token);
  const [user, setUser] = useState(initialSession.user);

  const login = (newToken) => {
    const decoded = decodeJwt(newToken);
    if (!decoded) {
      throw new Error('Received an invalid authentication token.');
    }
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(decoded);
    return decoded;
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
    () => ({ token, user, login, logout, isAdmin, ready: true }),
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
