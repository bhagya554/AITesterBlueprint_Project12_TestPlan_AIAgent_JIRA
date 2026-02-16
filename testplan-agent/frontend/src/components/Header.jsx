import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileText, History, Settings, Zap } from 'lucide-react'
import { llmApi } from '../api/client'

function Header() {
  const location = useLocation()
  const [llmStatus, setLlmStatus] = useState({ groq: false, ollama: false })

  useEffect(() => {
    checkLLMStatus()
    const interval = setInterval(checkLLMStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkLLMStatus = async () => {
    try {
      const response = await llmApi.getProviders()
      const providers = response.data.providers
      setLlmStatus({
        groq: providers.find(p => p.name === 'groq')?.available || false,
        ollama: providers.find(p => p.name === 'ollama')?.available || false,
      })
    } catch (error) {
      setLlmStatus({ groq: false, ollama: false })
    }
  }

  const isActive = (path) => location.pathname === path

  const hasConnection = llmStatus.groq || llmStatus.ollama

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-primary-400" />
            <span className="text-xl font-bold">TestPlan Agent</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'bg-primary-600' : 'hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Generator</span>
            </Link>
            <Link
              to="/history"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/history') ? 'bg-primary-600' : 'hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/settings') ? 'bg-primary-600' : 'hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* LLM Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-400">LLM:</span>
              <div className="flex items-center space-x-2">
                {llmStatus.groq && (
                  <span className="flex items-center text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse-dot"></span>
                    Groq
                  </span>
                )}
                {llmStatus.ollama && (
                  <span className="flex items-center text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse-dot"></span>
                    Ollama
                  </span>
                )}
                {!hasConnection && (
                  <span className="flex items-center text-red-400">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                    No Connection
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
