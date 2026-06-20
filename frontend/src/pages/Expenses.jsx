import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Calendar, FileText, IndianRupee, Tag, Filter, RefreshCw, ArrowUpDown } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering/Sorting states
  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filterTitle) params.append('title', filterTitle);
      if (filterCategoryId) params.append('categoryId', filterCategoryId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortDir) params.append('sortDir', sortDir);

      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      await api.post('/expenses', {
        title,
        amount: Number(amount),
        categoryId: Number(categoryId),
        date,
        description
      });

      // Clear Form
      setTitle('');
      setAmount('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');

      // Reload Expenses
      fetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      setError(err.response?.data?.message || 'Failed to add expense. Ensure amount is positive.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

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
        
        {/* Add Expense Form Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Record New Expense</h3>
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="title">Expense Title</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grocery, Electricity, Cinema"
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
                  placeholder="e.g. 1500"
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label htmlFor="categoryId">Category</label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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
                  placeholder="e.g. Weekly organic food items"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={formLoading} style={{ width: '100%' }}>
              <Plus size={18} />
              {formLoading ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>

        {/* View, Filter & Sort Expenses List Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Expense Records</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Spent: {formatCurrency(totalExpenses)}</p>
            </div>
            <button onClick={fetchExpenses} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Reload list">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Filtering Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--border-radius-md)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label htmlFor="filterTitle" style={{ fontSize: '0.75rem' }}>Search Title</label>
                <input 
                  id="filterTitle"
                  type="text" 
                  value={filterTitle} 
                  onChange={(e) => setFilterTitle(e.target.value)} 
                  placeholder="e.g. rent"
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label htmlFor="filterCategory" style={{ fontSize: '0.75rem' }}>Filter Category</label>
                <select 
                  id="filterCategory"
                  value={filterCategoryId} 
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  style={{ padding: '0.4rem', fontSize: '0.85rem', height: '37px' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label htmlFor="filterStart" style={{ fontSize: '0.75rem' }}>From Date</label>
                <input 
                  id="filterStart"
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label htmlFor="filterEnd" style={{ fontSize: '0.75rem' }}>To Date</label>
                <input 
                  id="filterEnd"
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Sorting & Submit Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <label htmlFor="sortField" style={{ fontSize: '0.75rem' }}>Sort By</label>
                  <select 
                    id="sortField"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '0.4rem', fontSize: '0.85rem', width: '110px' }}
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sortOrder" style={{ fontSize: '0.75rem' }}>Direction</label>
                  <select 
                    id="sortOrder"
                    value={sortDir} 
                    onChange={(e) => setSortDir(e.target.value)}
                    style={{ padding: '0.4rem', fontSize: '0.85rem', width: '90px' }}
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={fetchExpenses} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '37px' }}>
                  Apply Filters
                </button>
                <button 
                  onClick={() => {
                    setFilterTitle('');
                    setFilterCategoryId('');
                    setStartDate('');
                    setEndDate('');
                    setSortBy('date');
                    setSortDir('desc');
                    setTimeout(fetchExpenses, 0);
                  }} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '37px' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Expenses list table */}
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              No expenses matched filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.75rem' }}>Title</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Description</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>{exp.title}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--accent-blue)',
                          fontWeight: 600
                        }}>{exp.categoryName}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent-red)', fontWeight: 700 }}>{formatCurrency(exp.amount)}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{exp.description || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)} 
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

export default Expenses;
