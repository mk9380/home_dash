import { useState, useEffect, useCallback } from 'react'
import API_BASE from '../lib/api'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { key: 'done', label: 'Done', color: 'bg-green-50' }
]

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', assigned_to: 'Matt', due_date: '' })

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`)
      if (res.ok) setTasks(await res.json())
    } catch {
      console.error('Failed to fetch tasks')
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ title: '', description: '', assigned_to: 'Matt', due_date: '' })
    setShowForm(false)
    fetchTasks()
  }

  const advanceStatus = async (task) => {
    await fetch(`${API_BASE}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: NEXT_STATUS[task.status] })
    })
    fetchTasks()
  }

  const deleteTask = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 space-y-4">
          <input type="text" required placeholder="Task title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
          <div className="flex space-x-4">
            <select value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="Matt">Matt</option>
              <option value="Julia">Julia</option>
            </select>
            <input type="date" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              Create
            </button>
          </div>
        </form>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className={`${col.color} rounded-xl p-4 min-h-[400px]`}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">{col.label}</h2>
            <div className="space-y-3">
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => advanceStatus(task)}>
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                      className="text-gray-400 hover:text-red-500 text-xs ml-2">x</button>
                  </div>
                  {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.assigned_to === 'Matt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {task.assigned_to}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-gray-400">{task.due_date}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tasks
