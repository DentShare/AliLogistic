import { useState } from 'react'
import { Truck, LogIn, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const success = login(email, password)
      if (!success) {
        setError('Invalid email or password')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
            <Truck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Logistic Tab</h1>
            <p className="text-xs text-slate-500">Fleet Management Platform</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="admin@logistictab.io"
                autoComplete="email"
                autoFocus
                className="w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-accent placeholder-slate-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-accent placeholder-slate-600 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-navy-800/50 rounded-xl border border-navy-700/50 p-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Demo Credentials</p>
          <div className="space-y-1.5">
            {[
              { email: 'admin@logistictab.io', pass: 'admin123', role: 'Admin' },
              { email: 'mike@logistictab.io', pass: 'mike123', role: 'Dispatcher' },
              { email: 'update@logistictab.io', pass: 'update123', role: 'Updater' },
              { email: 'demo@logistictab.io', pass: 'demo123', role: 'Viewer' },
            ].map(c => (
              <button
                key={c.email}
                onClick={() => { setEmail(c.email); setPassword(c.pass); setError('') }}
                className="w-full flex items-center justify-between px-3 py-2 bg-navy-900/50 rounded-lg text-xs hover:bg-navy-700/50 transition-colors group"
              >
                <span className="text-slate-400 group-hover:text-slate-300">{c.email}</span>
                <span className="text-slate-600 font-mono">{c.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Logistic Tab v1.0 — Fleet Management
        </p>
      </div>
    </div>
  )
}
