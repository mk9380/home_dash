import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import API_BASE from '../lib/api'

function Finance() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [insights, setInsights] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    description: ''
  })

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/transactions/summary?month=${month}`),
        fetch(`${API_BASE}/api/transactions?month=${month}`)
      ])
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (txRes.ok) setTransactions(await txRes.json())
    } catch {
      console.error('Failed to fetch finance data')
    }
  }, [month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/categories`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/accounts`).then(r => r.ok ? r.json() : [])
    ]).then(([cats, accts]) => {
      setCategories(cats)
      setAccounts(accts)
    }).catch(() => {})
  }, [])

  const changeMonth = (delta) => {
    const d = new Date(month + '-01')
    d.setMonth(d.getMonth() + delta)
    setMonth(d.toISOString().slice(0, 7))
  }

  const formatMonth = (m) => {
    const d = new Date(m + '-01')
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        category_id: parseInt(form.category_id),
        account_id: parseInt(form.account_id)
      })
    })
    setShowModal(false)
    setForm({ date: new Date().toISOString().slice(0, 10), type: 'expense', amount: '', category_id: '', account_id: '', description: '' })
    fetchData()
  }

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/api/transactions/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const getInsights = async () => {
    setInsightsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: [summary] })
      })
      const data = await res.json()
      setInsights(data.insights)
    } catch {
      setInsights('Failed to load insights.')
    }
    setInsightsLoading(false)
  }

  const filteredCategories = categories.filter(c => c.type === form.type)
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-600">&larr;</button>
          <span className="text-lg font-medium w-48 text-center">{formatMonth(month)}</span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-600">&rarr;</button>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">${summary.total_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">${summary.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm text-gray-500">Net Saved</p>
            <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ${summary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {summary && (
        <div className="grid grid-cols-2 gap-6">
          {/* Donut chart */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Spending by Category</h3>
            {summary.by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={summary.by_category} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {summary.by_category.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">No expense data</p>
            )}
            {summary.by_category.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.by_category.map((c, i) => (
                  <span key={i} className="flex items-center text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full mr-1 inline-block" style={{ backgroundColor: c.color }} />
                    {c.name} ({c.pct}%)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Spending</h3>
            {summary.by_day.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.by_day}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(8)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">No expense data</p>
            )}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">AI Insights</h3>
          <button
            onClick={getInsights}
            disabled={insightsLoading || !summary}
            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50"
          >
            {insightsLoading ? 'Analyzing...' : 'Get Insights'}
          </button>
        </div>
        {insights && <p className="text-sm text-gray-600 whitespace-pre-wrap">{insights}</p>}
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(tx => {
              const cat = categoryMap[tx.category_id]
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {cat && (
                      <span className="inline-flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-500 text-sm">Delete</button>
                  </td>
                </tr>
              )
            })}
            {transactions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions this month</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button type="button"
                  className={`flex-1 py-2 text-sm font-medium ${form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-600'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'expense', category_id: '' }))}>
                  Expense
                </button>
                <button type="button"
                  className={`flex-1 py-2 text-sm font-medium ${form.type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-600'}`}
                  onClick={() => setForm(f => ({ ...f, type: 'income', category_id: '' }))}>
                  Income
                </button>
              </div>

              <input type="date" required value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

              <input type="number" step="0.01" required placeholder="Amount" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

              <select required value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select category</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select required value={form.account_id}
                onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <input type="text" placeholder="Description (optional)" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Finance
