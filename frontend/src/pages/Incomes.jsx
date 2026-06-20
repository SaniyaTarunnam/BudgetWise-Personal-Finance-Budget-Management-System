import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Calendar, FileText, IndianRupee, Tag, Search, Filter } from 'lucide-react';

const Incomes = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add Income form state
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = '/incomes';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setIncomes(response.data);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      setError('Failed to load incomes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      await api.post('/incomes', {
        source,
        amount: Number(amount),
        date,
        description
      });
      
      // Clear Form
      setSource('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      
      // Reload Incomes
      fetchIncomes();
    } catch (err) {
      console.error('Error adding income:', err);
      setError(err.response?.data?.message || 'Failed to add income. Ensure amount is positive.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await api.delete(`/incomes/${id}`);
      setIncomes(prev => prev.filter(inc => inc.id !== id));
    } catch (err) {
      console.error('Error deleting income:', err);
      setError('Failed to delete income.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const totalIncomes = incomes.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Add Income Form Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Record New Income</h3>
          <form onSubmit={handleAddIncome} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="source">Source of Income</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="source"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Salary, Freelance, Investment"
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Tag size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label htmlFor="amount">Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label htmlFor="date">Date</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label htmlFor="description">Description (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Part-time project work"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ width: '100%' }}>
              <Plus size={18} />
              {formLoading ? 'Adding...' : 'Add Income'}
            </button>
          </form>
        </div>

        {/* View & Filter Incomes List Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Income History</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total: {formatCurrency(totalIncomes)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={fetchIncomes} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                Refresh
              </button>
            </div>
          </div>

          {/* Date range filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-md)'
          }}>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label htmlFor="filterStartDate" style={{ fontSize: '0.75rem' }}>From</label>
              <input
                id="filterStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label htmlFor="filterEndDate" style={{ fontSize: '0.75rem' }}>To</label>
              <input
                id="filterEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button 
                onClick={fetchIncomes} 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
                title="Apply Filter"
              >
                <Filter size={16} />
              </button>
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setTimeout(fetchIncomes, 0); }} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '38px' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Incomes table */}
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading incomes list...</div>
          ) : incomes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              No income entries found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.75rem' }}>Source</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((inc) => (
                    <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>{inc.source}</td>
                      <td style={{ padding: '0.75rem' }}>{new Date(inc.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(inc.amount)}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{inc.description || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteIncome(inc.id)} 
                          style={{ background: 'transparent', color: 'var(--accent-red)' }}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Incomes;
