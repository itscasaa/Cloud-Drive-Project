import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { apiFetch } from '@/lib/api'
import { setAuthSession, type AuthUser } from '@/lib/auth'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

declare global {
  interface Window {
    grecaptcha?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => number
      reset: (widgetId?: number) => void
    }
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [captchaText, setCaptchaText] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')

  const loadCaptcha = async () => {
    try {
      const res = await apiFetch<{ svg: string; captchaToken: string }>('/auth/captcha', { skipAuth: true })
      setCaptchaSvg(res.svg)
      setCaptchaToken(res.captchaToken)
      setCaptchaText('')
    } catch (err) {
      console.error('Failed to load captcha:', err)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  // Bootstrap State
  const [setupRequired, setSetupRequired] = useState(false)
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapForm, setBootstrapForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    apiFetch<{ setupRequired: boolean }>('/auth/bootstrap-state', { skipAuth: true })
      .then((state) => {
        setSetupRequired(state.setupRequired)
      })
      .catch(() => setSetupRequired(false))
  }, [])

  async function submitBootstrap(event: FormEvent) {
    event.preventDefault()
    if (!bootstrapForm.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Hanya email dengan domain @gmail.com yang diijinkan.')
      return
    }
    setBootstrapLoading(true)
    setError('')
    try {
      await apiFetch('/auth/bootstrap', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          name: bootstrapForm.name,
          email: bootstrapForm.email,
          password: bootstrapForm.password,
        })
      })
      alert('Initial setup completed successfully! You can now log in.')
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Setup failed')
    } finally {
      setBootstrapLoading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Hanya email dengan domain @gmail.com yang diijinkan.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ name, email, password, captchaText, captchaToken })
      })
      setAuthSession(data.accessToken, data.refreshToken, data.user, { rememberMe: true })
      navigate('/all-files')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed')
      loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  async function tryDemoMode() {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AuthResponse>('/auth/demo-login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ rememberMe: false }),
      })
      setAuthSession(data.accessToken, data.refreshToken, data.user, { rememberMe: false })
      navigate('/all-files')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  if (setupRequired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="w-full max-w-xl p-6 md:p-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <BrandLogo transparentBg className="h-10 w-10" logoClassName="h-16 w-16" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Initial Setup</h1>
              <p className="text-sm text-slate-500 font-medium">Configure your CasaNest gateway instance.</p>
            </div>
          </div>
          
          <p className="mt-5 text-xs text-yellow-700 bg-yellow-50 p-3.5 rounded-xl border border-yellow-100 font-semibold leading-relaxed">
            ℹ️ <strong>Initial Setup Mode:</strong> This setup only appears before the first admin account is created.
          </p>

          <form onSubmit={submitBootstrap} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Admin Name<Input value={bootstrapForm.name} onChange={(e) => setBootstrapForm({ ...bootstrapForm, name: e.target.value })} required className="h-11 rounded-xl" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Admin Email<Input type="email" value={bootstrapForm.email} onChange={(e) => setBootstrapForm({ ...bootstrapForm, email: e.target.value })} required className="h-11 rounded-xl" /></label>
            </div>
            
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Admin Password<Input type="password" minLength={8} value={bootstrapForm.password} onChange={(e) => setBootstrapForm({ ...bootstrapForm, password: e.target.value })} required className="h-11 rounded-xl" /></label>

            {error ? <p className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100">{error}</p> : null}
            <Button disabled={bootstrapLoading} className="mt-2 h-11 rounded-xl font-bold">{bootstrapLoading ? 'Setting up instance...' : 'Complete Setup & Register'}</Button>
          </form>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col md:flex-row bg-slate-50">
      {/* Left Form Panel */}
      <div className="auth-form-panel animate-register-form w-full md:w-[45%] flex items-center justify-center p-6 sm:p-8 md:p-16 bg-white border-r border-slate-100 order-2 md:order-1">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 animate-stagger-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create your CasaNest account</h1>
            <p className="text-sm text-slate-500 font-medium">Start managing your connected drives securely.</p>
          </div>

          <form onSubmit={submit} className="space-y-5 animate-stagger-2">
            <div className="space-y-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Name
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Your Name"
                  className="h-11 rounded-xl"
                />
              </label>

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
                  minLength={8}
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                />
              </label>

              {/* Captcha Section */}
              <div className="space-y-2.5">
                <span className="text-sm font-semibold text-slate-700 block">Security Check</span>
                <div className="flex items-center gap-3">
                  <div 
                    className="border border-slate-200 rounded-xl overflow-hidden cursor-pointer bg-[#EAF5FF] flex items-center justify-center shrink-0 w-[150px] h-[50px] select-none"
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                    onClick={loadCaptcha}
                    title="Click to refresh captcha"
                  />
                  <button 
                    type="button" 
                    onClick={loadCaptcha} 
                    className="p-3 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl border border-blue-100 transition shadow-sm active:scale-95 cursor-pointer h-[50px] px-4"
                    title="Refresh Captcha"
                  >
                    Refresh
                  </button>
                </div>
                
                <Input 
                  type="text" 
                  value={captchaText} 
                  onChange={(e) => setCaptchaText(e.target.value)} 
                  required 
                  placeholder="Enter verification code"
                  className="h-11 rounded-xl"
                  autoComplete="off"
                />
              </div>
            </div>



            {error ? (
              <p className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100">{error}</p>
            ) : null}

            <div className="space-y-3 pt-2">
              <Button disabled={loading} className="w-full h-11 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10">
                {loading ? 'Creating...' : 'Create Account'}
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

          <p className="text-center text-sm font-medium text-slate-500 animate-stagger-3">
            Already have an account?{' '}
            <Link className="font-bold text-blue-600 hover:underline" to="/login" viewTransition>
              Login
            </Link>
          </p>
          
          <div className="flex justify-center gap-3 text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-6 animate-stagger-4">
            <Link to="/privacy" className="hover:text-slate-600 transition">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-600 transition">Terms of Service</Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-slate-600 transition">Data Deletion</Link>
          </div>
        </div>
      </div>

      {/* Right Brand Panel */}
      <div className="auth-brand-panel animate-register-brand w-full md:w-[55%] flex flex-col justify-between p-6 md:p-16 text-white relative overflow-hidden bg-gradient-to-br from-[#0B122A] via-[#1D4ED8] to-[#38BDF8] order-1 md:order-2">
        {/* Decorative ambient glow */}
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-sky-400/10 blur-[100px] pointer-events-none" />
        
        {/* Logo Section & Back Button */}
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center gap-3">
            <BrandLogo transparentBg className="h-10 w-10 md:h-12 md:w-12" logoClassName="h-16 w-16 md:h-20 md:w-20" />
            <span className="text-xl md:text-2xl font-extrabold tracking-tight">CasaNest</span>
          </div>
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Nest
          </Link>
        </div>

        {/* Content Section */}
        <div className="my-auto py-6 md:py-0 relative z-10 space-y-4 md:space-y-8">
          <div className="space-y-2 md:space-y-4">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Build your secure<br className="hidden md:inline" /> storage nest.
            </h2>
            <p className="text-sm md:text-lg text-slate-200 max-w-xl font-medium leading-relaxed hidden md:block">
              Connect your drives, organize your files, and keep everything protected in one simple dashboard.
            </p>
          </div>

          {/* Security Features Trust Bullets */}
          <div className="space-y-4 pt-4 border-t border-white/10 max-w-md hidden md:block">
            <div className="flex items-center gap-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sky-200">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-200 font-medium">drive.file only</span>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sky-200">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-200 font-medium">encrypted tokens</span>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sky-200">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-200 font-medium">files stay in your drive</span>
            </div>
          </div>
        </div>

        {/* Tagline Section */}
        <div className="relative z-10 border-t border-white/10 pt-4 md:pt-6 hidden md:block">
          <p className="text-sm font-bold text-slate-300">Secure storage nest for your connected drives.</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Satu tempat aman untuk mengelola cloud storage kamu.</p>
        </div>
      </div>
    </main>
  )
}
