import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Download, FileText, RotateCcw, Save, Check } from 'lucide-react'
import { generatorApi, historyApi } from '../api/client'

function StreamOutput({ content, isGenerating, status, onRegenerate, ticketInfo }) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const outputRef = useRef(null)

  // Auto-scroll to bottom while generating
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [content, isGenerating])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await generatorApi.exportPdf({
        content,
        jira_ticket_id: ticketInfo?.ticket_id || 'unknown',
        title: ticketInfo?.title || 'Test Plan'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `test_plan_${ticketInfo?.ticket_id || 'unknown'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Failed to download PDF: ' + err.message)
    }
  }

  const handleDownloadDocx = async () => {
    try {
      const response = await generatorApi.exportDocx({
        content,
        jira_ticket_id: ticketInfo?.ticket_id || 'unknown',
        title: ticketInfo?.title || 'Test Plan'
      })
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `test_plan_${ticketInfo?.ticket_id || 'unknown'}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download DOCX:', err)
      alert('Failed to download DOCX: ' + err.message)
    }
  }

  const handleSave = async () => {
    if (!ticketInfo) return
    
    setSaving(true)
    try {
      await historyApi.create({
        jira_ticket_id: ticketInfo.ticket_id,
        ticket_title: ticketInfo.title,
        test_plan_content: content,
        llm_provider: ticketInfo.llm_provider,
        llm_model: ticketInfo.llm_model
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Generated Test Plan</h3>
            {isGenerating && (
              <span className="text-sm text-gray-500 animate-pulse">
                Generating...
              </span>
            )}
          </div>
          
          {!isGenerating && content && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              
              <button
                onClick={handleDownloadPdf}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
              
              <button
                onClick={handleDownloadDocx}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>DOCX</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}</span>
              </button>
              
              <button
                onClick={onRegenerate}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Status indicator */}
        {status && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span>{status}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        ref={outputRef}
        className="p-6 max-h-[70vh] overflow-y-auto"
      >
        {content ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Generated test plan will appear here</p>
          </div>
        )}
        
        {isGenerating && (
          <div className="flex items-center space-x-2 mt-4 text-gray-400">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-150"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StreamOutput
