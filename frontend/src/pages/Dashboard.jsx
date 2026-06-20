import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  X,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Dashboard states
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [savingsTarget, setSavingsTarget] = useState(10000);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch Dashboard Summary
      const summaryRes = await api.get('/dashboard/summary');
      setSummary(summaryRes.data);

      // Fetch Alerts
      const alertsRes = await api.get('/alerts?status=UNREAD');
      setAlerts(alertsRes.data);

      // Fetch Profile (Savings Target)
      const profileRes = await api.get('/users/profile');
      setSavingsTarget(profileRes.data.savingsTarget || 10000);
      setNewTarget(profileRes.data.savingsTarget || 10000);

    } catch (err) {
      console.error('Error fetching dashboard details:', err);
      setError('Failed to fetch dashboard data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/users/profile', { savingsTarget: newTarget });
      setSavingsTarget(response.data.savingsTarget);
      setIsEditingTarget(false);
      // Refresh summary as alert targets might change
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating savings target:', err);
      setError('Failed to update savings target.');
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(prev => prev.filter(a => a.alertId !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleDismissAllAlerts = async () => {
    try {
      await api.put('/alerts/read-all');
      setAlerts([]);
    } catch (err) {
      console.error('Error dismissing all alerts:', err);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard summary...</div>;
  }

  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  // Savings target calculations
  const savings = summary?.totalSavings || 0;
  const savingsProgress = Math.min(100, Math.max(0, (savings / (savingsTarget || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem',
          color: 'var(--accent-red)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'transparent', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* Unread Alerts Banner */}
      {alerts.length > 0 && (
        <div className="card" style={{ 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(17, 24, 39, 0.9))' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-yellow)' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontWeight: 700 }}>Notifications Center ({alerts.length})</h3>
            </div>
            <button onClick={handleDismissAllAlerts} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Clear All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.map((alert) => (
              <div 
                key={alert.alertId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'rgba(31, 41, 55, 0.4)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{alert.message}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Type: {alert.alertType} • {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <button 
                  onClick={() => handleDismissAlert(alert.alertId)}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.2rem' }}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Aggregate Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Income Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={24} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Income</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(summary?.totalIncome)}
            </h3>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingDown size={24} style={{ color: 'var(--accent-red)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Expenses</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(summary?.totalExpenses)}
            </h3>
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: savings >= 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: savings >= 0 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <DollarSign size={24} style={{ color: savings >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Net Savings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(savings)}
            </h3>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wallet size={24} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Remaining Budget</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(summary?.remainingBudget)}
            </h3>
          </div>
        </div>
      </div>

      {/* Savings Target Progress */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Monthly Savings Target</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track savings against your targets</p>
          </div>

          {!isEditingTarget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#fff' }}>Target: {formatCurrency(savingsTarget)}</span>
              <button 
                onClick={() => setIsEditingTarget(true)} 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateTarget} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number" 
                value={newTarget} 
                onChange={(e) => setNewTarget(Number(e.target.value))} 
                style={{ width: '130px', padding: '0.4rem' }} 
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Save</button>
              <button type="button" onClick={() => setIsEditingTarget(false)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
            </form>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ width: '100%', height: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-full)', overflow: 'hidden' }}>
            <div style={{
              width: `${savingsProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))',
              borderRadius: 'var(--border-radius-full)',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Progress: {savingsProgress.toFixed(1)}%</span>
            <span>Saved: {formatCurrency(savings)} / {formatCurrency(savingsTarget)}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout (Split grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Left Side: Category Budget Utilization */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Monthly Budgets Utilization</h3>
          {summary?.categoryOverviews?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No budgets set for this month.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {summary?.categoryOverviews?.map((cat) => {
                const util = cat.utilizationPercentage;
                const progressColor = util >= 100 ? 'var(--accent-red)' : util >= 80 ? 'var(--accent-yellow)' : 'var(--accent-blue)';
                
                return (
                  <div key={cat.categoryName} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{cat.categoryName}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {formatCurrency(cat.spentAmount)} / {formatCurrency(cat.budgetAmount)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, util)}%`,
                        height: '100%',
                        backgroundColor: progressColor,
                        borderRadius: 'var(--border-radius-full)',
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Utilization: {util.toFixed(1)}%</span>
                      {util >= 100 && <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>EXCEEDED</span>}
                      {util >= 80 && util < 100 && <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>NEAR LIMIT</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Recent Transactions */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Recent Transactions</h3>
          {summary?.recentTransactions?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No transactions recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summary?.recentTransactions?.map((tx) => (
                <div 
                  key={`${tx.type}-${tx.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--glass-border)'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{tx.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {tx.category ? `${tx.category} • ` : ''}{new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    color: tx.type === 'INCOME' ? 'var(--accent-green)' : 'var(--accent-red)' 
                  }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
