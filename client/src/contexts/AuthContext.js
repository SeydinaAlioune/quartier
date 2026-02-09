import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext({
  token: '',
  user: null,
  isAuthenticated: false,
  setSession: () => {},
  logout: () => {},
});

const readStored = () => {
  try {
    const token = localStorage.getItem('token') || '';
    const rawUser = localStorage.getItem('user') || 'null';
    const user = JSON.parse(rawUser);
    return { token, user: user && typeof user === 'object' ? user : null };
  } catch (e) {
    return { token: '', user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const v = readStored();
    setToken(v.token);
    setUser(v.user);
  }, []);

  const setSession = useCallback(({ token: nextToken, user: nextUser }) => {
    const t = typeof nextToken === 'string' ? nextToken : '';
    const u = nextUser && typeof nextUser === 'object' ? nextUser : null;

    setToken(t);
    setUser(u);

    try {
      if (t) localStorage.setItem('token', t);
      else localStorage.removeItem('token');

      if (u) localStorage.setItem('user', JSON.stringify(u));
      else localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
  }, []);

  const value = useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      setSession,
      logout,
    };
  }, [token, user, setSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
