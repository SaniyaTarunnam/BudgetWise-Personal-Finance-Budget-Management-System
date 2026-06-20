import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user credentials exist in local storage on load
    const storedUser = localStorage.getItem('budgetwise_user');
    const storedToken = localStorage.getItem('budgetwise_token');
    
    try {
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error parsing stored user details:', e);
      localStorage.removeItem('budgetwise_user');
      localStorage.removeItem('budgetwise_token');
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await api.post('/auth/login', { usernameOrEmail, password });
      const { token, id, username, email } = response.data;
      
      const userData = { id, username, email };
      localStorage.setItem('budgetwise_token', token);
      localStorage.setItem('budgetwise_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('/auth/register', { username, email, password });
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || error.response?.data?.details || 'Registration failed.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('budgetwise_token');
    localStorage.removeItem('budgetwise_user');
    setUser(null);
  };

  const updateLocalUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem('budgetwise_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
