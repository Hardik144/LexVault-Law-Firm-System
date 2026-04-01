import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scale, Eye, EyeOff, Shield } from 'lucide-react'
import { Alert, Spinner } from '../components/ui'

const DEMO_ACCOUNTS = [
  { role: 'Admin',  email: 'admin@lawfirm.com',  password: 'Admin@123' },
  { role: 'Judge',  email: 'judge@lawfirm.com',  password: 'Judge@123' },
  { role: 'Lawyer', email: 'lawyer@lawfirm.com', password: 'Lawyer@123' },
  { role: 'Clerk',  email: 'clerk@lawfirm.com',  password: 'Clerk@123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-gray-950 p-12 border-r border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold">LexVault</div>
            <div className="text-gray-500 text-xs">Case Management System</div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Secure case management for legal professionals
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Role-based access control, audit logs, document versioning, and full DevOps pipeline. Built for courts and law firms.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'End-to-end encrypted document storage',
              'Complete audit trail for compliance',
              'Role-based access: Admin, Judge, Lawyer, Clerk',
              'Real-time case tracking and tasks',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield size={10} className="text-brand-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="text-gray-600 text-xs">© 2024 LexVault. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <span className="text-white font-bold">LexVault</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-gray-400 text-sm mb-8">Access the case management portal</p>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="label text-gray-400">Email address</label>
              <input
                type="email"
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:ring-brand-500"
                placeholder="you@lawfirm.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:ring-brand-500 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? <Spinner size={16} /> : null}
              Sign in
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">
              Demo accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc)}
                  className="text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="text-white text-xs font-semibold">{acc.role}</div>
                  <div className="text-gray-500 text-xs truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
