import React, { useState, useEffect } from 'react'
import { Check, AlertCircle, RefreshCw } from 'lucide-react'
import { llmApi } from '../api/client'

function LLMSelector({ provider, setProvider, model, setModel }) {
  const [groqModels] = useState([
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ])
  const [ollamaModels, setOllamaModels] = useState([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (provider === 'ollama') {
      fetchOllamaModels()
    }
  }, [provider])

  const fetchOllamaModels = async () => {
    try {
      const response = await llmApi.getModels('ollama')
      setOllamaModels(response.data.models)
      if (response.data.models.length > 0 && !model) {
        setModel(response.data.models[0])
      }
    } catch (error) {
      setOllamaModels([])
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await llmApi.testConnection(provider)
      setTestResult(response.data)
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    }
    setTesting(false)
  }

  const models = provider === 'groq' ? groqModels : ollamaModels

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">LLM Configuration</h3>
        <button
          onClick={testConnection}
          disabled={testing}
          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* Provider Selection */}
      <div className="mb-4">
        <label className="label">LLM Provider</label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="groq"
              checked={provider === 'groq'}
              onChange={(e) => {
                setProvider(e.target.value)
                setModel('llama-3.3-70b-versatile')
              }}
              className="mr-2"
            />
            <span>Groq (Cloud)</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="ollama"
              checked={provider === 'ollama'}
              onChange={(e) => {
                setProvider(e.target.value)
                fetchOllamaModels()
              }}
              className="mr-2"
            />
            <span>Ollama (Local)</span>
          </label>
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-4">
        <label className="label">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="input"
        >
          {models.length === 0 && (
            <option value="">No models available</option>
          )}
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {provider === 'ollama' && models.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            No Ollama models found. Make sure Ollama is running.
          </p>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {testResult.success ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{testResult.message}</span>
        </div>
      )}
    </div>
  )
}

export default LLMSelector
