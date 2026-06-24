import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { apiFetch } from '@/lib/api'
import { setAuthSession, type AuthUser } from '@/lib/auth'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', skipAuth: true, body: JSON.stringify({ email, password }) })
      setAuthSession(data.accessToken, data.refreshToken, data.user)
      navigate('/all-files')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function tryDemoMode() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AuthResponse>('/auth/demo-login', { method: 'POST', skipAuth: true })
      setAuthSession(data.accessToken, data.refreshToken, data.user)
      navigate('/all-files')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      {/* Left Brand Panel */}
      <div className="w-full md:w-[55%] flex flex-col justify-between p-6 md:p-16 text-white relative overflow-hidden bg-gradient-to-br from-[#0B122A] via-[#1D4ED8] to-[#38BDF8]">
        {/* Decorative ambient glow */}
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-sky-400/10 blur-[100px] pointer-events-none" />
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 relative z-10">
          <BrandLogo className="h-10 w-10 md:h-12 md:w-12 shadow-xl shadow-blue-950/40" logoClassName="h-16 w-16 md:h-20 md:w-20" />
          <span className="text-xl md:text-2xl font-extrabold tracking-tight">CasaNest</span>
        </div>

        {/* Content Section */}
        <div className="my-auto py-6 md:py-0 relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Your files,<br className="hidden md:inline" /> safely nested.
          </h1>
          <p className="mt-4 md:mt-6 text-sm md:text-lg text-slate-200 max-w-xl font-medium leading-relaxed hidden md:block">
            Connect your drives, manage your files, and keep access secure from one simple dashboard.
          </p>
        </div>

        {/* Tagline Section */}
        <div className="relative z-10 border-t border-white/10 pt-4 md:pt-6 hidden md:block">
          <p className="text-sm font-bold text-slate-300">Secure storage nest for your connected drives.</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Satu tempat aman untuk mengelola cloud storage kamu.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-6 sm:p-8 md:p-16 bg-white border-l border-slate-100">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500 font-medium">Login to your CasaNest account.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Email
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@example.com"
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Password
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100">{error}</p>
            ) : null}

            <div className="space-y-3 pt-2">
              <Button disabled={loading} className="w-full h-11 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10">
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="relative my-4 flex items-center justify-center">
                <span className="absolute w-full border-t border-slate-100" />
                <span className="relative bg-white px-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">or</span>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={tryDemoMode} 
                disabled={loading}
                className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Try Demo Mode
              </Button>
            </div>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            No account?{' '}
            <Link className="font-bold text-blue-600 hover:underline" to="/register">
              Register
            </Link>
          </p>
          
          <div className="flex justify-center gap-3 text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-6">
            <Link to="/privacy" className="hover:text-slate-600 transition">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-600 transition">Terms of Service</Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-slate-600 transition">Data Deletion</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
