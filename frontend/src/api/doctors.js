import client from './client'

export const listDoctors = (params) => client.get('/doctors', { params }).then((r) => r.data)
export const addDoctor = (data) => client.post('/doctors', data).then((r) => r.data)
export const reviewDoctor = (id, data) => client.patch(`/doctors/${id}/review`, data).then((r) => r.data)
