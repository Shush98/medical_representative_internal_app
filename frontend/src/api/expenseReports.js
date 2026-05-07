import client from './client'

export const listExpenseReports = (params) => client.get('/expense-reports', { params }).then((r) => r.data)
export const createExpenseReport = (data) => client.post('/expense-reports', data).then((r) => r.data)
export const updateExpenseReport = (id, data) => client.put(`/expense-reports/${id}`, data).then((r) => r.data)
export const submitExpenseReport = (id) => client.post(`/expense-reports/${id}/submit`).then((r) => r.data)
export const reviewExpenseReport = (id, data) => client.patch(`/expense-reports/${id}/review`, data).then((r) => r.data)
