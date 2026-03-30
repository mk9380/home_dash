import { useState, useEffect, useCallback } from 'react'
import API_BASE from '../lib/api'

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
]
const PRIORITIES = ['low', 'medium', 'high']
const TAGS = ['home', 'work']

function TaskDetail({ taskId, projects, onClose, onUpdate }) {
  const [task, setTask] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('Matt')

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data)
        setForm({
          title: data.title,
          description: data.description || '',
          assigned_to: data.assigned_to || 'Matt',
          status: data.status,
          priority: data.priority || 'medium',
          theme: data.theme || '',
          tag: data.tag || 'home',
          due_date: data.due_date || '',
          project_id: data.project_id || ''
        })
      }
    } catch { console.error('Failed to fetch task detail') }
  }, [taskId])

  useEffect(() => { fetchTask() }, [fetchTask])

  const handleSave = async () => {
    await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, project_id: form.project_id ? parseInt(form.project_id) : null })
    })
    setEditing(false)
    fetchTask()
    onUpdate()
  }

  const addSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtask.trim()) return
    await fetch(`${API_BASE}/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubtask })
    })
    setNewSubtask('')
    fetchTask()
    onUpdate()
  }

  const toggleSubtask = async (subtask) => {
    await fetch(`${API_BASE}/api/tasks/${taskId}/subtasks/${subtask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_complete: subtask.is_complete ? 0 : 1 })
    })
    fetchTask()
    onUpdate()
  }

  const deleteSubtask = async (subtaskId) => {
    await fetch(`${API_BASE}/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' })
    fetchTask()
    onUpdate()
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    await fetch(`${API_BASE}/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: commentAuthor, body: newComment })
    })
    setNewComment('')
    fetchTask()
  }

  const deleteComment = async (commentId) => {
    await fetch(`${API_BASE}/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' })
    fetchTask()
  }

  if (!task) return null

  const project = projects.find(p => p.id === task.project_id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            {project && (
              <span className="flex items-center text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            {!editing && <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>}
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-200 rounded-lg">Edit</button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Edit / View Mode */}
          {editing ? (
            <div className="space-y-3">
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description" rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">No Project</option>
                  {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="Matt">Matt</option>
                  <option value="Julia">Julia</option>
                </select>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <input type="text" placeholder="Theme" value={form.theme}
                  onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              {/* Task metadata */}
              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase block mb-1">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.status === 'todo' ? 'bg-gray-100 text-gray-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>{STATUSES.find(s => s.key === task.status)?.label}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase block mb-1">Priority</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>{task.priority}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase block mb-1">Assigned</span>
                  <span className="text-gray-700">{task.assigned_to}</span>
                </div>
                {task.tag && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase block mb-1">Tag</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${task.tag === 'work' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{task.tag}</span>
                  </div>
                )}
                {task.theme && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase block mb-1">Theme</span>
                    <span className="text-gray-700">{task.theme}</span>
                  </div>
                )}
                {task.due_date && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase block mb-1">Due Date</span>
                    <span className="text-gray-700">{task.due_date}</span>
                  </div>
                )}
                {task.completed_at && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase block mb-1">Completed</span>
                    <span className="text-green-600">{task.completed_at.slice(0, 10)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-xs uppercase block mb-1">Created</span>
                  <span className="text-gray-500">{task.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            </>
          )}

          {/* Subtasks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Subtasks
              {task.subtasks?.length > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  {task.subtasks.filter(s => s.is_complete).length}/{task.subtasks.length}
                </span>
              )}
            </h3>
            <div className="space-y-1">
              {task.subtasks?.map(sub => (
                <div key={sub.id} className="flex items-center group">
                  <input type="checkbox" checked={!!sub.is_complete} onChange={() => toggleSubtask(sub)}
                    className="mr-2 rounded border-gray-300 text-indigo-600" />
                  <span className={`flex-1 text-sm ${sub.is_complete ? 'line-through text-gray-400' : 'text-gray-700'}`}>{sub.title}</span>
                  <button onClick={() => deleteSubtask(sub.id)}
                    className="hidden group-hover:block text-gray-400 hover:text-red-500 text-xs">x</button>
                </div>
              ))}
            </div>
            <form onSubmit={addSubtask} className="flex gap-2 mt-2">
              <input type="text" placeholder="Add subtask..." value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              <button type="submit" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-lg">Add</button>
            </form>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments</h3>
            <div className="space-y-3 mb-3">
              {task.comments?.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.author === 'Matt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {c.author}
                      </span>
                      <span className="text-xs text-gray-400">{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <button onClick={() => deleteComment(c.id)}
                      className="hidden group-hover:block text-gray-400 hover:text-red-500 text-xs">x</button>
                  </div>
                  <p className="text-sm text-gray-600">{c.body}</p>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && (
                <p className="text-xs text-gray-400">No comments yet</p>
              )}
            </div>
            <form onSubmit={addComment} className="space-y-2">
              <div className="flex gap-2">
                <select value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  <option value="Matt">Matt</option>
                  <option value="Julia">Julia</option>
                </select>
                <input type="text" placeholder="Write a comment..." value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                <button type="submit" className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-lg">Post</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
