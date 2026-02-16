import React, { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Link2, Paperclip, CheckSquare } from 'lucide-react'

function JiraPreview({ ticket, onAdditionalContextChange, additionalContext }) {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    acceptanceCriteria: true,
    comments: false,
    linkedIssues: false,
    subtasks: false,
    attachments: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (!ticket) return null

  const SectionHeader = ({ title, icon: Icon, section, count }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full py-2 text-left hover:bg-gray-50 px-2 rounded"
    >
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <span className="font-medium text-gray-700">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-primary-600 font-medium">{ticket.ticket_id}</span>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">{ticket.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
              ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {ticket.priority}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {ticket.issue_type}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {ticket.status}
            </span>
          </div>
        </div>
        {(ticket.labels?.length > 0 || ticket.components?.length > 0) && (
          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
            {ticket.labels?.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Labels:</span>
                <span>{ticket.labels.join(', ')}</span>
              </div>
            )}
            {ticket.components?.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Components:</span>
                <span>{ticket.components.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Description */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <SectionHeader title="Description" section="description" />
          </div>
          {expandedSections.description && (
            <div className="p-4">
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </div>
            </div>
          )}
        </div>

        {/* Acceptance Criteria */}
        {ticket.acceptance_criteria && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <SectionHeader title="Acceptance Criteria" icon={CheckSquare} section="acceptanceCriteria" />
            </div>
            {expandedSections.acceptanceCriteria && (
              <div className="p-4">
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                  {ticket.acceptance_criteria}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {ticket.comments?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <SectionHeader 
                title="Comments" 
                icon={MessageSquare} 
                section="comments" 
                count={ticket.comments.length}
              />
            </div>
            {expandedSections.comments && (
              <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                {ticket.comments.map((comment, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{comment.author}</span>
                      <span className="text-gray-400">{new Date(comment.created).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Linked Issues */}
        {ticket.linked_issues?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <SectionHeader 
                title="Linked Issues" 
                icon={Link2} 
                section="linkedIssues" 
                count={ticket.linked_issues.length}
              />
            </div>
            {expandedSections.linkedIssues && (
              <div className="p-4">
                <ul className="space-y-2">
                  {ticket.linked_issues.map((issue, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-primary-600">{issue.key}</span>
                      <span className="text-gray-400">({issue.type}, {issue.direction})</span>
                      <span className="text-gray-600">{issue.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Subtasks */}
        {ticket.subtasks?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <SectionHeader 
                title="Subtasks" 
                icon={CheckSquare} 
                section="subtasks" 
                count={ticket.subtasks.length}
              />
            </div>
            {expandedSections.subtasks && (
              <div className="p-4">
                <ul className="space-y-2">
                  {ticket.subtasks.map((subtask, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-primary-600">{subtask.key}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        subtask.status === 'Done' ? 'bg-green-100 text-green-700' :
                        subtask.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {subtask.status}
                      </span>
                      <span className="text-gray-600">{subtask.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {ticket.attachments?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <SectionHeader 
                title="Attachments" 
                icon={Paperclip} 
                section="attachments" 
                count={ticket.attachments.length}
              />
            </div>
            {expandedSections.attachments && (
              <div className="p-4">
                <ul className="space-y-1">
                  {ticket.attachments.map((att, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span>{att.filename}</span>
                      <span className="text-gray-400 text-xs">({att.mimeType})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Additional Context Input */}
        <div className="mt-6">
          <label className="label">Additional Context (Optional)</label>
          <textarea
            value={additionalContext}
            onChange={(e) => onAdditionalContextChange(e.target.value)}
            placeholder="Add any additional context or specific requirements for the test plan..."
            className="input h-32 resize-none"
          />
        </div>
      </div>
    </div>
  )
}

export default JiraPreview
