import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSessionApi, loginApi, logoutApi, signupApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      if (!sessionStorage.getItem('uf_auth_token')) {
        setLoading(false);
        return;
      }

      try {
        const result = await getSessionApi();
        if (isMounted && result?.data?.user) {
          setUser(result.data.user);
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        sessionStorage.removeItem('uf_auth_token');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (loginId, password) => {
    const response = await loginApi({ loginId, password });
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  };

  const signup = async signupData => {
    const response = await signupApi(signupData);
    if (response?.data?.user) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      signup,
      logout,
      setUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
