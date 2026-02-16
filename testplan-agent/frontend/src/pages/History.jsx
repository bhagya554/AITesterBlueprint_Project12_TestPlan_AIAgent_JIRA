import React, { useState, useEffect } from 'react'
import { Search, Trash2, Download, Eye, FileText, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { historyApi, generatorApi } from '../api/client'

function History() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await historyApi.getAll()
      setPlans(response.data)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test plan?')) return
    
    try {
      await historyApi.delete(id)
      setPlans(plans.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete test plan')
    }
  }

  const handleView = async (plan) => {
    try {
      const response = await historyApi.getById(plan.id)
      setSelectedPlan(response.data)
      setShowModal(true)
    } catch (err) {
      console.error('Failed to load plan details:', err)
    }
  }

  const handleDownloadPdf = async (plan) => {
    try {
      const response = await generatorApi.exportPdf({
        content: plan.test_plan_content,
        jira_ticket_id: plan.jira_ticket_id,
        title: plan.ticket_title
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `test_plan_${plan.jira_ticket_id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF')
    }
  }

  const handleDownloadDocx = async (plan) => {
    try {
      const response = await generatorApi.exportDocx({
        content: plan.test_plan_content,
        jira_ticket_id: plan.jira_ticket_id,
        title: plan.ticket_title
      })
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `test_plan_${plan.jira_ticket_id}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download DOCX')
    }
  }

  const filteredPlans = plans.filter(plan => 
    plan.jira_ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.ticket_title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Plan History</h1>
        <div className="text-sm text-gray-500">
          {plans.length} saved test plan{plans.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by JIRA ID or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      {filteredPlans.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  JIRA ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LLM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-primary-600">{plan.jira_ticket_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {plan.ticket_title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.llm_provider === 'groq' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {plan.llm_provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {plan.llm_model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(plan.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(plan)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(plan)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadDocx(plan)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download DOCX"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm ? 'No matching test plans' : 'No saved test plans'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Generate and save test plans to see them here'}
          </p>
        </div>
      )}

      {/* View Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedPlan.jira_ticket_id} - {selectedPlan.ticket_title}
                </h2>
                <p className="text-sm text-gray-500">
                  Generated on {formatDate(selectedPlan.created_at)} using {selectedPlan.llm_provider} ({selectedPlan.llm_model})
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedPlan.test_plan_content}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => handleDownloadPdf(selectedPlan)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => handleDownloadDocx(selectedPlan)}
                className="btn-secondary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download DOCX</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History
