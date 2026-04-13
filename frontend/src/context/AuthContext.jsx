import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Session timeout: 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('staffInfo');
    localStorage.removeItem('lastActivity');
  };

  const updateActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('staffInfo');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (savedUser) {
      if (lastActivity && (Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT)) {
        // Session expired while away
        logout();
      } else {
        setUser(JSON.parse(savedUser));
        updateActivity();
      }
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return; // Don't track if not logged in

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    let throttleTimer;

    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 5000); // Update max once every 5 seconds to prevent browser lag 
    };

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Periodic check for timeout (every 1 minute)
    const interval = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && (Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT)) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('staffInfo', JSON.stringify(userData));
    updateActivity();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

