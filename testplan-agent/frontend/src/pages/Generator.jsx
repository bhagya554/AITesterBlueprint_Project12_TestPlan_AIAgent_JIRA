import React, { useState, useEffect } from 'react'
import { Search, Zap, Download, Loader2 } from 'lucide-react'
import LLMSelector from '../components/LLMSelector'
import JiraPreview from '../components/JiraPreview'
import StreamOutput from '../components/StreamOutput'
import { jiraApi, settingsApi } from '../api/client'

function Generator() {
  const [ticketId, setTicketId] = useState('')
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [additionalContext, setAdditionalContext] = useState('')
  const [jiraBaseUrl, setJiraBaseUrl] = useState('')
  
  const [provider, setProvider] = useState('groq')
  const [model, setModel] = useState('llama-3.3-70b-versatile')
  
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get()
      setJiraBaseUrl(response.data.jira.base_url)
      setProvider(response.data.llm.default_provider)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const handleFetchTicket = async () => {
    if (!ticketId.trim()) {
      setError('Please enter a JIRA ticket ID')
      return
    }
    
    setLoading(true)
    setError(null)
    setTicket(null)
    
    try {
      const response = await jiraApi.getTicket(ticketId)
      setTicket(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch ticket')
    }
    
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!ticket) {
      setError('Please fetch a ticket first')
      return
    }
    
    setIsGenerating(true)
    setGeneratedContent('')
    setError(null)
    setStatus('Connecting...')
    
    try {
      const API_BASE_URL = 'https://testplan-agent-api.onrender.com/api'
      const response = await fetch(`${API_BASE_URL}/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_ticket_id: ticket.ticket_id,
          additional_context: additionalContext,
          llm_provider: provider,
          llm_model: model,
          temperature: 0.3,
          max_tokens: 4096
        })
      })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'status') {
                setStatus(data.message)
              } else if (data.type === 'content') {
                setGeneratedContent(prev => prev + data.text)
                setStatus('Generating...')
              } else if (data.type === 'error') {
                setError(data.message)
                setIsGenerating(false)
                return
              } else if (data.type === 'done') {
                setStatus('')
                setIsGenerating(false)
                return
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setError('Generation failed: ' + err.message)
      setIsGenerating(false)
    }
    
    setStatus('')
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Configuration Strip */}
      <LLMSelector 
        provider={provider}
        setProvider={setProvider}
        model={model}
        setModel={setModel}
      />

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="label">JIRA Ticket ID</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g., VMO-1"
              className="input"
              onKeyPress={(e) => e.key === 'Enter' && handleFetchTicket()}
            />
            {jiraBaseUrl && (
              <p className="text-xs text-gray-500 mt-1">
                Using JIRA: {jiraBaseUrl}
              </p>
            )}
          </div>
          
          <button
            onClick={handleFetchTicket}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Fetch Only</span>
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={!ticket || isGenerating}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Fetch & Generate</span>
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Content Area */}
      {(ticket || generatedContent) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: JIRA Preview */}
          {ticket && (
            <JiraPreview 
              ticket={ticket}
              additionalContext={additionalContext}
              onAdditionalContextChange={setAdditionalContext}
            />
          )}
          
          {/* Right: Generated Output */}
          <StreamOutput 
            content={generatedContent}
            isGenerating={isGenerating}
            status={status}
            onRegenerate={handleGenerate}
            ticketInfo={ticket ? {
              ticket_id: ticket.ticket_id,
              title: ticket.title,
              llm_provider: provider,
              llm_model: model
            } : null}
          />
        </div>
      )}
      
      {/* Empty state */}
      {!ticket && !generatedContent && !loading && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Generate Test Plans with AI
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter a JIRA ticket ID above to fetch ticket details and generate a 
            comprehensive test plan using your preferred LLM provider.
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-primary-600 mb-1">1</div>
              <div className="text-sm text-gray-600">Fetch JIRA Ticket</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-primary-600 mb-1">2</div>
              <div className="text-sm text-gray-600">AI Generates Plan</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-primary-600 mb-1">3</div>
              <div className="text-sm text-gray-600">Export & Save</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Generator
