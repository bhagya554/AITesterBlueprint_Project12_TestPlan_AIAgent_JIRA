import React, { useState, useEffect } from 'react'
import { Save, Check, AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { settingsApi, jiraApi, llmApi, templateApi } from '../api/client'

function Settings() {
  const [settings, setSettings] = useState({
    jira: { base_url: '', email: '', api_token: '' },
    groq: { api_key: '', default_model: 'llama-3.3-70b-versatile' },
    ollama: { base_url: 'http://localhost:11434', default_model: 'llama3.1' },
    llm: { default_provider: 'groq', temperature: 0.3, max_tokens: 4096 },
    template: { path: '../testplan.pdf' }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testResults, setTestResults] = useState({})
  const [templatePreview, setTemplatePreview] = useState(null)

  useEffect(() => {
    loadSettings()
    loadTemplatePreview()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get()
      setSettings(response.data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    setLoading(false)
  }

  const loadTemplatePreview = async () => {
    try {
      const response = await templateApi.preview()
      setTemplatePreview(response.data)
    } catch (err) {
      console.error('Failed to load template:', err)
    }
  }

  const [saveError, setSaveError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    
    try {
      const updateData = {
        jira_base_url: settings.jira.base_url,
        jira_email: settings.jira.email,
        jira_api_token: settings.jira.api_token,
        groq_api_key: settings.groq.api_key,
        groq_default_model: settings.groq.default_model,
        ollama_base_url: settings.ollama.base_url,
        ollama_default_model: settings.ollama.default_model,
        default_provider: settings.llm.default_provider,
        llm_temperature: settings.llm.temperature,
        llm_max_tokens: settings.llm.max_tokens,
        template_path: settings.template.path
      }
      
      await settingsApi.update(updateData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      let errorMsg = 'Failed to save settings'
      if (err.response) {
        // Server responded with error
        errorMsg = err.response.data?.detail?.message || err.response.data?.detail || `Server error: ${err.response.status}`
      } else if (err.request) {
        // Request made but no response (network error)
        errorMsg = 'Network error: Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000'
      } else {
        errorMsg = err.message
      }
      setSaveError(errorMsg)
    }
    
    setSaving(false)
  }

  const testConnection = async (type) => {
    setTestResults(prev => ({ ...prev, [type]: { loading: true } }))
    
    try {
      let result
      if (type === 'jira') {
        const response = await jiraApi.testConnection()
        result = response.data
      } else {
        const response = await llmApi.testConnection(type)
        result = response.data
      }
      
      setTestResults(prev => ({ ...prev, [type]: result }))
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        [type]: { success: false, message: err.message } 
      }))
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const TestButton = ({ type, label }) => (
    <button
      onClick={() => testConnection(type)}
      disabled={testResults[type]?.loading}
      className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${testResults[type]?.loading ? 'animate-spin' : ''}`} />
      <span>Test {label} Connection</span>
    </button>
  )

  const TestResult = ({ type }) => {
    const result = testResults[type]
    if (!result || result.loading) return null
    
    return (
      <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
        result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {result.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span className="text-sm">{result.message || (result.success ? 'Connection successful' : 'Connection failed')}</span>
      </div>
    )
  }

  const SaveError = () => {
    if (!saveError) return null
    
    return (
      <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 flex items-start space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Error saving settings</p>
          <p className="mt-1">{saveError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      <SaveError />

      {/* JIRA Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">JIRA Configuration</h2>
          <TestButton type="jira" label="JIRA" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="label">JIRA Base URL</label>
            <input
              type="text"
              value={settings.jira.base_url}
              onChange={(e) => updateSetting('jira', 'base_url', e.target.value)}
              placeholder="https://your-domain.atlassian.net"
              className="input"
            />
          </div>
          
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={settings.jira.email}
              onChange={(e) => updateSetting('jira', 'email', e.target.value)}
              placeholder="your-email@company.com"
              className="input"
            />
          </div>
          
          <div>
            <label className="label">API Token</label>
            <input
              type="password"
              value={settings.jira.api_token}
              onChange={(e) => updateSetting('jira', 'api_token', e.target.value)}
              placeholder="your-jira-api-token"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate an API token from{' '}
              <a 
                href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Atlassian Account Settings
              </a>
            </p>
          </div>
        </div>
        
        <TestResult type="jira" />
      </div>

      {/* Groq Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Groq Configuration</h2>
          <TestButton type="groq" label="Groq" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="label">API Key</label>
            <input
              type="password"
              value={settings.groq.api_key}
              onChange={(e) => updateSetting('groq', 'api_key', e.target.value)}
              placeholder="gsk_your_groq_api_key"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Groq Console
              </a>
            </p>
          </div>
          
          <div>
            <label className="label">Default Model</label>
            <select
              value={settings.groq.default_model}
              onChange={(e) => updateSetting('groq', 'default_model', e.target.value)}
              className="input"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              <option value="gemma2-9b-it">gemma2-9b-it</option>
            </select>
          </div>
        </div>
        
        <TestResult type="groq" />
      </div>

      {/* Ollama Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ollama Configuration</h2>
          <TestButton type="ollama" label="Ollama" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="label">Base URL</label>
            <input
              type="text"
              value={settings.ollama.base_url}
              onChange={(e) => updateSetting('ollama', 'base_url', e.target.value)}
              placeholder="http://localhost:11434"
              className="input"
            />
          </div>
          
          <div>
            <label className="label">Default Model</label>
            <input
              type="text"
              value={settings.ollama.default_model}
              onChange={(e) => updateSetting('ollama', 'default_model', e.target.value)}
              placeholder="llama3.1"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Make sure to pull the model first: <code className="bg-gray-100 px-1 rounded">ollama pull llama3.1</code>
            </p>
          </div>
        </div>
        
        <TestResult type="ollama" />
      </div>

      {/* LLM Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">LLM Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Default Provider</label>
            <select
              value={settings.llm.default_provider}
              onChange={(e) => updateSetting('llm', 'default_provider', e.target.value)}
              className="input"
            >
              <option value="groq">Groq (Cloud)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>
          
          <div>
            <label className="label">Temperature: {settings.llm.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.llm.temperature}
              onChange={(e) => updateSetting('llm', 'temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
          
          <div>
            <label className="label">Max Tokens: {settings.llm.max_tokens}</label>
            <input
              type="range"
              min="1000"
              max="8000"
              step="500"
              value={settings.llm.max_tokens}
              onChange={(e) => updateSetting('llm', 'max_tokens', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Template Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Template PDF Path</label>
            <input
              type="text"
              value={settings.template.path}
              onChange={(e) => updateSetting('template', 'path', e.target.value)}
              placeholder="../testplan.pdf"
              className="input"
            />
          </div>
          
          {templatePreview && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Template Structure Preview</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                {templatePreview.sections?.length > 0 ? (
                  <ul className="space-y-1">
                    {templatePreview.sections.map((section, idx) => (
                      <li key={idx} className="text-gray-600">
                        {section.number}. {section.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Using default template structure</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
