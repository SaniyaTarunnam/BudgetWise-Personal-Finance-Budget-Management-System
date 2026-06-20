import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Calendar, DollarSign, PieChart, TrendingUp, Sparkles } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/dashboard/analytics?year=${selectedYear}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics details:', err);
      setError('Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics dashboard...</div>;
  }

  // Setup data for Doughnut chart (Category expenses)
  const categoryExpenses = analytics?.categoryExpenses || [];
  const doughnutData = {
    labels: categoryExpenses.map(c => c.categoryName),
    datasets: [
      {
        data: categoryExpenses.map(c => c.spentAmount),
        backgroundColor: [
          '#3b82f6', // blue
          '#14b8a6', // teal
          '#8b5cf6', // purple
          '#f59e0b', // yellow
          '#ef4444', // red
          '#10b981', // green
          '#ec4899', // pink
          '#6366f1', // indigo
        ],
        borderWidth: 1,
        borderColor: 'var(--glass-border)',
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'var(--text-secondary)',
          font: {
            family: 'Plus Jakarta Sans',
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.raw);
            return label;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  // Setup data for Bar chart (Monthly Income vs Expense vs Savings)
  const monthlyTrends = analytics?.monthlyTrends || [];
  const barData = {
    labels: monthlyTrends.map(m => m.monthName),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrends.map(m => m.income),
        backgroundColor: 'rgba(16, 185, 129, 0.75)',
        borderColor: 'var(--accent-green)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: monthlyTrends.map(m => m.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderColor: 'var(--accent-red)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Savings',
        data: monthlyTrends.map(m => m.savings),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'var(--accent-blue)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    scales: {
      y: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Plus Jakarta Sans' }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top filter section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Spending & Savings Analytics</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Yearly overview and distributions</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ width: '120px', padding: '0.4rem', fontSize: '0.85rem' }}
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--border-radius-md)',
          padding: '1rem',
          color: 'var(--accent-red)'
        }}>
          {error}
        </div>
      )}

      {/* Aggregate Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Savings Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Net Yearly Savings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {formatCurrency(analytics?.totalSavings)}
            </h3>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={24} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Savings Rate</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {analytics?.savingsRate?.toFixed(1) || 0}%
            </h3>
          </div>
        </div>

        {/* Top Spending Category Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <PieChart size={24} style={{ color: 'var(--accent-red)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Top Spend Category</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }} title={analytics?.highestSpendingCategory}>
              {analytics?.highestSpendingCategory || 'N/A'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Total: {formatCurrency(analytics?.highestSpendingAmount)}
            </p>
          </div>
        </div>

      </div>

      {/* Grid for Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Bar chart representing Monthly Income/Expenses/Savings */}
        <div className="card" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Monthly Trends</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Doughnut Chart representing category spend distribution */}
        <div className="card" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Category Distribution</h3>
          {categoryExpenses.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No expenses recorded for this year.
            </div>
          ) : (
            <div style={{ flex: 1, position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Analytics;
