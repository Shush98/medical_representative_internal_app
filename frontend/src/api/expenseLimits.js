import client from './client'

export const listLimits = () => client.get('/expense-limits').then((r) => r.data)
export const upsertLimit = (data) => client.post('/expense-limits', data).then((r) => r.data)
export const deleteLimit = (id) => client.delete(`/expense-limits/${id}`).then((r) => r.data)
