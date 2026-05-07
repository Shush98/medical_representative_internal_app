import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: API_BASE + '/api',
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = _getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      try {
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true })
        _setToken(data.access_token)
        err.config.headers.Authorization = `Bearer ${data.access_token}`
        return client(err.config)
      } catch {
        _setToken(null)
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

let _token = null
export const _getToken = () => _token
export const _setToken = (t) => { _token = t }

export default client
