import client from './client'

export const downloadReport = (type, format, from, to) =>
  client.get('/reports/download', {
    params: { type, format, from, to },
    responseType: 'blob',
  }).then((r) => r.data)
