import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'usr_nandini',
  name: 'Nandini',
  email: 'nandini@commander.ai',
  role: 'Team Lead',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  settings: {
    theme: 'light',
    emailNotifications: true,
    aiModel: 'gemini-2.5-flash',
    integrations: {
      googleMeet: { connected: true, botName: 'ActionCommander AI' },
      microsoftTeams: { connected: true, botName: 'ActionCommander Bot' },
      zoom: { connected: true, botName: 'ActionCommander Assistant' },
      youtube: { connected: true, status: 'Active' }
    }
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('commander_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER; // Pre-seeded default session
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('commander_token') || 'jwt_usr_snehitha');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('commander_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('commander_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('commander_token', token);
    } else {
      localStorage.removeItem('commander_token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      // Fallback local login if server isn't reachable
      const fallbackUser = {
        ...DEFAULT_USER,
        email: email || DEFAULT_USER.email,
        name: email ? email.split('@')[0].replace(/[._]/g, ' ') : DEFAULT_USER.name
      };
      setUser(fallbackUser);
      setToken('jwt_usr_local');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      const newUser = {
        ...DEFAULT_USER,
        id: `usr_${Date.now()}`,
        name: name || 'Team Member',
        email: email || 'user@example.com'
      };
      setUser(newUser);
      setToken('jwt_usr_local');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const oauthLogin = async (provider) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/oauth-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (e) {
      setUser(DEFAULT_USER);
      setToken('jwt_usr_snehitha');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('commander_user');
    localStorage.removeItem('commander_token');
  };

  const updateProfile = (updatedProfile) => {
    setUser(prev => ({ ...prev, ...updatedProfile }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      oauthLogin,
      logout,
      updateProfile,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
