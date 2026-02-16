import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// JIRA API
export const jiraApi = {
  getTicket: (ticketId) => api.get(`/jira/ticket/${ticketId}`),
  testConnection: () => api.get('/jira/test-connection'),
}

// Generator API
export const generatorApi = {
  generateStream: (data) => {
    return fetch('/api/generate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },
  exportPdf: (data) => api.post('/generate/export/pdf', data, {
    responseType: 'blob',
  }),
  exportDocx: (data) => api.post('/generate/export/docx', data, {
    responseType: 'blob',
  }),
}

// History API
export const historyApi = {
  getAll: () => api.get('/history'),
  getById: (id) => api.get(`/history/${id}`),
  create: (data) => api.post('/history', data),
  delete: (id) => api.delete(`/history/${id}`),
}

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

// LLM API
export const llmApi = {
  getProviders: () => api.get('/llm/providers'),
  getModels: (provider) => api.get(`/llm/models/${provider}`),
  testConnection: (provider) => api.post('/llm/test', { provider }),
}

// Template API
export const templateApi = {
  preview: () => api.get('/template/preview'),
  default: () => api.get('/template/default'),
}

export default api
