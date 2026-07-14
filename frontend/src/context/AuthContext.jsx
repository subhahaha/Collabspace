import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, signupApi, getMeApi } from '../api/authApi';

const AuthContext = createContext(null);

// Wraps the whole app (see main.jsx). Any component can call useAuth()
// to read the current user or call login/signup/logout — without
// "prop drilling" that info down through every layer of components.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a token is already saved (from a previous
  // session) and if so, verify it's still valid by fetching the user.
  // This is what keeps you logged in after refreshing the page.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    getMeApi()
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired or invalid — clear it so we don't keep retrying.
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const data = await signupApi(name, email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components just write `const { user } = useAuth()`
// instead of importing useContext + AuthContext everywhere.
export function useAuth() {
  return useContext(AuthContext);
}