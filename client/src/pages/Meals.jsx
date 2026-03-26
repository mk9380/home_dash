import { useState, useEffect } from 'react'
import API_BASE from '../lib/api'

const CUISINES = ['Any', 'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai']

function Meals() {
  const [ingredients, setIngredients] = useState('')
  const [preferences, setPreferences] = useState('Any')
  const [servings, setServings] = useState(2)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkedItems, setCheckedItems] = useState({})
  const [saved, setSaved] = useState(false)

  // Load most recent plan on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/meals/current`)
      .then(r => r.json())
      .then(data => { if (data) setPlan(data) })
      .catch(() => {})
  }, [])

  const suggestMeals = async () => {
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch(`${API_BASE}/api/meals/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          preferences: preferences === 'Any' ? '' : preferences,
          servings
        })
      })
      const data = await res.json()
      setPlan(data)
      setCheckedItems({})
    } catch {
      alert('Failed to get meal suggestions. Check that the AI provider is configured.')
    }
    setLoading(false)
  }

  const savePlan = async () => {
    if (!plan) return
    const today = new Date()
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((day + 6) % 7))
    const weekStart = monday.toISOString().slice(0, 10)

    await fetch(`${API_BASE}/api/meals/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_start: weekStart,
        meals: plan.meals,
        grocery_list: plan.grocery_list
      })
    })
    setSaved(true)
  }

  const toggleItem = (category, item) => {
    const key = `${category}-${item}`
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>

      {/* Input section */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s in your pantry/fridge?</label>
          <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
            placeholder="e.g. chicken breast, rice, bell peppers, onions, garlic, olive oil..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
        </div>
        <div className="flex space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Preference</label>
            <select value={preferences} onChange={e => setPreferences(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
            <input type="number" min={1} max={10} value={servings}
              onChange={e => setServings(parseInt(e.target.value) || 2)}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={suggestMeals} disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Generating...' : 'Suggest Meals'}
          </button>
        </div>
      </div>

      {/* Meal cards */}
      {plan?.meals && (
        <>
          <div className="grid grid-cols-7 gap-3">
            {plan.meals.map((meal, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <p className="text-xs font-semibold text-indigo-600 uppercase">{meal.day}</p>
                <h3 className="text-sm font-medium text-gray-900 mt-1">{meal.name}</h3>
                <ul className="mt-2 space-y-0.5">
                  {meal.ingredients?.map((ing, j) => (
                    <li key={j} className="text-xs text-gray-500">{ing}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Grocery list */}
          {plan.grocery_list && plan.grocery_list.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Grocery List</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {plan.grocery_list.map((group, i) => (
                  <div key={i}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.category}</h4>
                    <ul className="space-y-1">
                      {group.items?.map((item, j) => {
                        const key = `${group.category}-${item}`
                        return (
                          <li key={j} className="flex items-center">
                            <input type="checkbox" checked={!!checkedItems[key]}
                              onChange={() => toggleItem(group.category, item)}
                              className="mr-2 rounded border-gray-300 text-indigo-600" />
                            <span className={`text-sm ${checkedItems[key] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <button onClick={savePlan} disabled={saved}
              className={`px-6 py-2 rounded-lg text-sm font-medium ${
                saved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
              {saved ? 'Saved!' : 'Save This Plan'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Meals
