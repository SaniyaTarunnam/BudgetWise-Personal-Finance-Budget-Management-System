import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User as UserIcon } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      if (user) {
        const response = await api.get('/alerts?status=UNREAD');
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll alerts every 30 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Summary';
      case '/incomes':
        return 'Incomes Tracker';
      case '/expenses':
        return 'Expenses Tracker';
      case '/budgets':
        return 'Monthly Budgets';
      case '/analytics':
        return 'Analytics & Reports';
      default:
        return 'BudgetWise';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid var(--glass-border)',
      marginBottom: '2rem',
    }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>
          {getPageTitle()}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Welcome back, {user?.username || 'Guest'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Alert Bell */}
        <Link 
          to="/" 
          style={{ position: 'relative', display: 'flex', color: 'var(--text-secondary)' }}
          title="Alerts Center"
        >
          <Bell size={22} style={{ color: unreadCount > 0 ? 'var(--accent-yellow)' : 'inherit' }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'var(--accent-red)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              padding: '1px 5px',
              border: '2px solid var(--bg-primary)',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--border-radius-md)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserIcon size={12} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
            {user?.username}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
