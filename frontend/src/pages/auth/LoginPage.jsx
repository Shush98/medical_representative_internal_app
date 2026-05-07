import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { login } from '../../api/auth'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      setAuth(data.user, data.access_token)
      const role = data.user.role
      if (role === 'representative') navigate('/rep')
      else if (role === 'manager') navigate('/manager')
      else navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-white text-xl font-bold">OR</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Orexis Pharma</h1>
          <p className="text-primary-200 text-sm mt-1">Representative Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@orexis.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          © {new Date().getFullYear()} Orexis Pharmaceuticals. All rights reserved.
        </p>
      </div>
    </div>
  )
}
