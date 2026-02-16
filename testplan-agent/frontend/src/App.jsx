import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Generator from './pages/Generator'
import History from './pages/History'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
