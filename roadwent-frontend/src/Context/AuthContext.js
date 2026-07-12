import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
  axios.defaults.headers.post['Content-Type'] = 'application/json';

  useEffect(() => {
    // Check if user is logged in from server
    const checkLoggedIn = async () => {
      try {
        const res = await axios.get('/auth/current-user');
        if (res.data.user) {
          setIsAuthenticated(true);
          setUser(res.data.user);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const res = await axios.post('/auth/login', { email, password });
      
      if (res.data.user) {
        setIsAuthenticated(true);
        setUser(res.data.user);
        console.log('Login successful:', res.data.user);
        return { success: true };
      } else {
        console.log('Login failed - no user in response');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.get('/auth/logout');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('Attempting registration with:', { name, email });
      const res = await axios.post('/auth/register', { name, email, password });
      
      if (res.data.user) {
        setIsAuthenticated(true);
        setUser(res.data.user);
        console.log('Registration successful:', res.data.user);
        return { success: true };
      } else {
        console.log('Registration failed - no user in response');
        return { success: false, error: 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};