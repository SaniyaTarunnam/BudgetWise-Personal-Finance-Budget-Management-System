import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Calendar, Wallet, List, Award, AlertCircle } from 'lucide-react';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected filter criteria (Default to current month and year)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  // Category addition form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Budget setup form
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(currentMonth);
  const [budgetYear, setBudgetYear] = useState(currentYear);
  const [budgetLoading, setBudgetLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/budgets?month=${filterMonth}&year=${filterYear}`);
      setBudgets(response.data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, [filterMonth, filterYear]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryLoading(true);
    setError('');

    try {
      await api.post('/categories', { name: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.response?.data?.message || 'Failed to create category. Avoid duplicates.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom category? (This will fail if you have active transactions linked)')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category. Verify no transaction references exist.');
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setBudgetLoading(true);
    setError('');

    try {
      await api.post('/budgets', {
        categoryId: Number(budgetCategoryId),
        budgetAmount: Number(budgetAmount),
        month: Number(budgetMonth),
        year: Number(budgetYear)
      });
      
      setBudgetCategoryId('');
      setBudgetAmount('');
      
      // Reload budgets
      fetchBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err.response?.data?.message || 'Failed to create budget. Try updating it if it already exists.');
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to remove this budget allocation?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

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

      {/* Grid containing forms for Category creation and Budget creation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        
        {/* Category Settings Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Category Management</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Add custom spend categories</p>
          </div>

          <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Subscriptions, Gifts"
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={categoryLoading} style={{ padding: '0.5rem 1rem' }}>
              <Plus size={18} />
            </button>
          </form>

          {/* List of Custom Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Your Custom Categories</span>
            {categories.filter(c => c.userId !== null).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No custom categories. Click above to add.</span>
            ) : (
              categories.filter(c => c.userId !== null).map(cat => (
                <div 
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(31, 41, 55, 0.4)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--border-radius-sm)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>{cat.name}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ background: 'transparent', color: 'var(--accent-red)', padding: '0.2rem' }}
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budget Creation Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.25rem' }}>Allocate Budget Limit</h3>
          <form onSubmit={handleCreateBudget} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label htmlFor="budgetCategory">Select Category</label>
              <select
                id="budgetCategory"
                value={budgetCategoryId}
                onChange={(e) => setBudgetCategoryId(e.target.value)}
                required
              >
                <option value="">Choose...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budgetLimit">Monthly Limit (₹)</label>
              <input
                id="budgetLimit"
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="e.g. 10000"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="budgetMonth">Month</label>
                <select
                  id="budgetMonth"
                  value={budgetMonth}
                  onChange={(e) => setBudgetMonth(e.target.value)}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="budgetYear">Year</label>
                <select
                  id="budgetYear"
                  value={budgetYear}
                  onChange={(e) => setBudgetYear(e.target.value)}
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear + i - 1).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={budgetLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
              <Wallet size={16} />
              {budgetLoading ? 'Saving...' : 'Set Budget'}
            </button>
          </form>
        </div>

      </div>

      {/* Allocated Budget Limits List with Utilization Bars */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>All Budget Allocations</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Viewing limits and usage percentage</p>
          </div>

          {/* Month/Year Filters */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              style={{ width: '130px', padding: '0.4rem', fontSize: '0.85rem' }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              style={{ width: '100px', padding: '0.4rem', fontSize: '0.85rem' }}
            >
              {Array.from({ length: 5 }, (_, i) => currentYear + i - 1).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No budget limits allocated for {new Date(2000, filterMonth - 1).toLocaleString('default', { month: 'long' })} {filterYear}.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {budgets.map((b) => {
              const util = b.utilizationPercentage;
              const isExceeded = util >= 100;
              const isWarning = util >= 80 && util < 100;
              const barColor = isExceeded ? 'var(--accent-red)' : isWarning ? 'var(--accent-yellow)' : 'var(--accent-green)';
              
              return (
                <div 
                  key={b.id}
                  className="card"
                  style={{
                    background: 'rgba(31, 41, 55, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: '#fff' }}>{b.categoryName}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(2000, b.month - 1).toLocaleString('default', { month: 'short' })} {b.year}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteBudget(b.id)}
                      style={{ background: 'transparent', color: 'var(--text-secondary)' }}
                      title="Remove Budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Spent: {formatCurrency(b.spentAmount)}</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>Limit: {formatCurrency(b.budgetAmount)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-full)', overflow: 'hidden', marginTop: '0.25rem' }}>
                      <div style={{
                        width: `${Math.min(100, util)}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: 'var(--border-radius-full)',
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Utilized: {util.toFixed(1)}%</span>
                      {isExceeded ? (
                        <span style={{ color: 'var(--accent-red)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertCircle size={12} /> Exceeded by {formatCurrency(b.spentAmount - b.budgetAmount)}
                        </span>
                      ) : isWarning ? (
                        <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>Near limit (80%+)</span>
                      ) : (
                        <span style={{ color: 'var(--accent-green)' }}>Remaining: {formatCurrency(b.remainingBudget)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Budgets;
