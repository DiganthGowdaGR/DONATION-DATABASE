import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const donorsAPI = {
  getAll: () => api.get('/donors'),
  create: (data) => api.post('/donors', data),
  update: (id, data) => api.put(`/donors/${id}`, data),
  delete: (id) => api.delete(`/donors/${id}`)
}

export const patientsAPI = {
  getAll: () => api.get('/patients'),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`)
}

export const bloodAPI = {
  getInventory: () => api.get('/blood'),
  getBanks: () => api.get('/blood/banks'),
  create: (data) => api.post('/blood', data),
  updateInventory: (id, data) => api.put(`/blood/${id}`, data),
  initialize: () => api.post('/blood/initialize'),
  findOrCreate: (data) => api.post('/blood/find-or-create', data)
}

export const organsAPI = {
  getInventory: () => api.get('/organs'),
  getBanks: () => api.get('/organs/banks'),
  create: (data) => api.post('/organs', data),
  updateInventory: (id, data) => api.put(`/organs/${id}`, data)
}

export const donationsAPI = {
  getAll: () => api.get('/donations'),
  create: (data) => api.post('/donations', data),
  delete: (id) => api.delete(`/donations/${id}`),
  getAuditLogs: () => api.get('/donations/audit'),
  // Stored procedure endpoints
  getCompatibility: (bloodGroup) => api.get(`/donations/compatibility/${bloodGroup}`),
  getInventoryReport: () => api.get('/donations/inventory-report'),
  getDonorHistory: (donorId) => api.get(`/donations/donor-history/${donorId}`),
  getCriticalPatients: () => api.get('/donations/critical-patients'),
  processDonation: (data) => api.post('/donations/process', data)
}

export default api