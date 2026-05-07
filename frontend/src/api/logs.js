import client from './client'

export const listLogs = (params) => client.get('/logs', { params }).then((r) => r.data)
