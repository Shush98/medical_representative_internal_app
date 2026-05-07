import client from './client'

export const listVisitReports = (params) => client.get('/visit-reports', { params }).then((r) => r.data)
export const createVisitReport = (data) => client.post('/visit-reports', data).then((r) => r.data)
export const getVisitReport = (id) => client.get(`/visit-reports/${id}`).then((r) => r.data)
export const updateVisitReport = (id, data) => client.put(`/visit-reports/${id}`, data).then((r) => r.data)
export const submitVisitReport = (id) => client.post(`/visit-reports/${id}/submit`).then((r) => r.data)
export const reviewVisitReport = (id, data) => client.patch(`/visit-reports/${id}/review`, data).then((r) => r.data)
