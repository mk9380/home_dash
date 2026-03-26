import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Finance from './pages/Finance'
import Tasks from './pages/Tasks'
import Meals from './pages/Meals'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/finance" replace />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/meals" element={<Meals />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
