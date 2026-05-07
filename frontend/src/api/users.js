import client from './client'

export const listUsers = () => client.get('/users').then((r) => r.data)
export const listReps = () => client.get('/users/reps').then((r) => r.data)
export const getUser = (id) => client.get(`/users/${id}`).then((r) => r.data)
export const createUser = (data) => client.post('/users', data).then((r) => r.data)
export const updateUser = (id, data) => client.put(`/users/${id}`, data).then((r) => r.data)
export const deactivateUser = (id) => client.delete(`/users/${id}`).then((r) => r.data)
