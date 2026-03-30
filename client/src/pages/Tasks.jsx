import { useState, useEffect, useCallback } from 'react'
import API_BASE from '../lib/api'
import TaskDetail from '../components/TaskDetail'

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
]

const PRIORITIES = ['low', 'medium', 'high']
const TAGS = ['home', 'work']
const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }
const TAG_COLORS = { home: 'bg-blue-100 text-blue-700', work: 'bg-purple-100 text-purple-700' }
const STATUS_COLORS = { todo: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' }

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#94a3b8'
]

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [themes, setThemes] = useState([])
  const [view, setView] = useState('list')
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterTheme, setFilterTheme] = useState('')
  const [filterAssigned, setFilterAssigned] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  // Forms
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: 'Matt', priority: 'medium', theme: '', tag: 'home', due_date: '', project_id: '' })
  const [projectForm, setProjectForm] = useState({ name: '', description: '', color: '#6366f1' })

  const fetchTasks = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/tasks?`
      if (filterStatus) url += `status=${filterStatus}&`
      if (filterPriority) url += `priority=${filterPriority}&`
      if (filterTag) url += `tag=${filterTag}&`
      if (filterTheme) url += `theme=${filterTheme}&`
      if (filterAssigned) url += `assigned_to=${filterAssigned}&`
      if (selectedProject) url += `project_id=${selectedProject}&`
      const res = await fetch(url)
      if (res.ok) setTasks(await res.json())
    } catch { console.error('Failed to fetch tasks') }
  }, [filterStatus, filterPriority, filterTag, filterTheme, filterAssigned, selectedProject])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`)
      if (res.ok) setProjects(await res.json())
    } catch { console.error('Failed to fetch projects') }
  }, [])

  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/themes/list`)
      if (res.ok) setThemes(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { fetchProjects(); fetchThemes() }, [fetchProjects, fetchThemes])

  const refresh = () => { fetchTasks(); fetchProjects(); fetchThemes() }

  // Sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal = a[sortBy], bVal = b[sortBy]
    if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 }
      aVal = order[aVal] ?? 1; bVal = order[bVal] ?? 1
    }
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const sortIcon = (field) => {
    if (sortBy !== field) return '\u2195'
    return sortDir === 'asc' ? '\u2191' : '\u2193'
  }

  // Task CRUD
  const handleCreateTask = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, project_id: taskForm.project_id ? parseInt(taskForm.project_id) : null })
    })
    setTaskForm({ title: '', description: '', assigned_to: 'Matt', priority: 'medium', theme: '', tag: 'home', due_date: '', project_id: selectedProject || '' })
    setShowTaskForm(false)
    refresh()
  }

  const updateTaskStatus = async (task, newStatus) => {
    await fetch(`${API_BASE}/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    refresh()
  }

  const deleteTask = async (id) => {
    await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' })
    refresh()
  }

  // Project CRUD
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (editingProject) {
      await fetch(`${API_BASE}/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
    } else {
      await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
    }
    setProjectForm({ name: '', description: '', color: '#6366f1' })
    setShowProjectForm(false)
    setEditingProject(null)
    refresh()
  }

  const deleteProject = async (id) => {
    await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' })
    if (selectedProject === id) setSelectedProject(null)
    refresh()
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const openTaskForm = () => {
    setTaskForm({ title: '', description: '', assigned_to: 'Matt', priority: 'medium', theme: '', tag: 'home', due_date: '', project_id: selectedProject || '' })
    setShowTaskForm(true)
  }

  return (
    <div className="flex gap-6">
      {/* Project Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Projects</h3>
            <button onClick={() => { setEditingProject(null); setProjectForm({ name: '', description: '', color: '#6366f1' }); setShowProjectForm(!showProjectForm) }}
              className="text-indigo-600 hover:text-indigo-800 text-lg leading-none">+</button>
          </div>

          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="mb-3 space-y-2">
              <input type="text" required placeholder="Project name" value={projectForm.name}
                onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
              <input type="text" placeholder="Description" value={projectForm.description}
                onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
              <div className="flex gap-1 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setProjectForm(f => ({ ...f, color: c }))}
                    className={`w-5 h-5 rounded-full border-2 ${projectForm.color === c ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-medium">
                {editingProject ? 'Update' : 'Create'}
              </button>
            </form>
          )}

          {/* All tasks */}
          <button onClick={() => setSelectedProject(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${!selectedProject ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            All Tasks
            <span className="float-right text-xs text-gray-400">{tasks.length}</span>
          </button>

          {/* Unassigned */}
          <button onClick={() => setSelectedProject('none')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${selectedProject === 'none' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
            No Project
          </button>

          <div className="border-t border-gray-100 my-2" />

          {projects.map(p => (
            <div key={p.id} className="group flex items-center">
              <button onClick={() => setSelectedProject(p.id)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm ${selectedProject === p.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }} />
                {p.name}
                <span className="float-right text-xs text-gray-400">{p.completed_count}/{p.task_count}</span>
              </button>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                <button onClick={() => { setEditingProject(p); setProjectForm({ name: p.name, description: p.description || '', color: p.color }); setShowProjectForm(true) }}
                  className="text-gray-400 hover:text-indigo-600 text-xs p-0.5">Edit</button>
                <button onClick={() => deleteProject(p.id)}
                  className="text-gray-400 hover:text-red-500 text-xs p-0.5">x</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button onClick={() => setView('list')}
                className={`px-3 py-1.5 text-xs font-medium ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                List
              </button>
              <button onClick={() => setView('kanban')}
                className={`px-3 py-1.5 text-xs font-medium ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                Board
              </button>
            </div>
            <button onClick={openTaskForm}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
              + Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Tags</option>
            {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">All Themes</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Everyone</option>
            <option value="Matt">Matt</option>
            <option value="Julia">Julia</option>
          </select>
          {(filterStatus || filterPriority || filterTag || filterTheme || filterAssigned) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterTag(''); setFilterTheme(''); setFilterAssigned('') }}
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1.5">Clear filters</button>
          )}
        </div>

        {/* Add Task Form */}
        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" required placeholder="Task title" value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Description (optional)" value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} />
              <select value={taskForm.project_id} onChange={e => setTaskForm(f => ({ ...f, project_id: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">No Project</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="Matt">Matt</option>
                <option value="Julia">Julia</option>
              </select>
              <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <select value={taskForm.tag} onChange={e => setTaskForm(f => ({ ...f, tag: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input type="text" placeholder="Theme (e.g. Renovation, Health)" value={taskForm.theme}
                onChange={e => setTaskForm(f => ({ ...f, theme: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={taskForm.due_date}
                onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowTaskForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Create Task</button>
            </div>
          </form>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('title')}>
                    Title {sortIcon('title')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>
                    Status {sortIcon('status')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('priority')}>
                    Priority {sortIcon('priority')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('due_date')}>
                    Due {sortIcon('due_date')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTasks.map(task => {
                  const project = projectMap[task.project_id]
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.subtask_count > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5">{task.subtask_complete}/{task.subtask_count} subtasks</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {project && (
                          <span className="inline-flex items-center">
                            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: project.color }} />
                            <span className="text-gray-600 text-xs">{project.name}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                          {STATUSES.find(s => s.key === task.status)?.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.assigned_to === 'Matt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {task.assigned_to}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{task.due_date || '-'}</td>
                      <td className="px-3 py-3">
                        {task.tag && <span className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[task.tag]}`}>{task.tag}</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                          className="text-gray-400 hover:text-red-500 text-xs">Delete</button>
                      </td>
                    </tr>
                  )
                })}
                {sortedTasks.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No tasks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="grid grid-cols-3 gap-4">
            {STATUSES.map(col => (
              <div key={col.key} className={`rounded-xl p-4 min-h-[400px] ${col.key === 'todo' ? 'bg-gray-100' : col.key === 'in_progress' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {col.label}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {sortedTasks.filter(t => t.status === col.key).length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {sortedTasks.filter(t => t.status === col.key).map(task => {
                    const project = projectMap[task.project_id]
                    return (
                      <div key={task.id}
                        className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedTask(task)}>
                        {project && (
                          <div className="flex items-center mb-2">
                            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: project.color }} />
                            <span className="text-xs text-gray-400">{project.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                            className="text-gray-400 hover:text-red-500 text-xs ml-2">x</button>
                        </div>
                        {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                        {task.subtask_count > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Subtasks</span>
                              <span>{task.subtask_complete}/{task.subtask_count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(task.subtask_complete / task.subtask_count) * 100}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-1">
                          <div className="flex gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                            {task.tag && <span className={`text-xs px-1.5 py-0.5 rounded-full ${TAG_COLORS[task.tag]}`}>{task.tag}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.assigned_to === 'Matt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {task.assigned_to}
                            </span>
                          </div>
                        </div>
                        {/* Quick status advance */}
                        {task.status !== 'done' && (
                          <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task, task.status === 'todo' ? 'in_progress' : 'done') }}
                            className="mt-2 w-full text-xs text-indigo-600 hover:text-indigo-800 py-1 border border-indigo-200 rounded-lg hover:bg-indigo-50">
                            Move to {task.status === 'todo' ? 'In Progress' : 'Done'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          taskId={selectedTask.id}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  )
}

export default Tasks
