import client from './client'

export const listAreas = () => client.get('/areas').then((r) => r.data)
export const createArea = (data) => client.post('/areas', data).then((r) => r.data)
export const updateArea = (id, data) => client.put(`/areas/${id}`, data).then((r) => r.data)
export const deleteArea = (id) => client.delete(`/areas/${id}`).then((r) => r.data)
