import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function GoogleConnectedPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const status = params.get('status') ?? 'success'
  const ok = status === 'success'

  useEffect(() => {
    window.opener?.postMessage({ type: 'GOOGLE_CONNECTED', status }, window.location.origin)
    localStorage.setItem('casanest:google-connected', JSON.stringify({ status, timestamp: Date.now() }))
    
    const timer = window.setTimeout(() => {
      if (window.opener || window.name === 'google-drive-connect') {
        window.close()
      } else {
        navigate('/settings')
      }
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [navigate, status])

  let title = 'Connection Failed'
  let description = 'Please close this window and try again.'
  if (ok) {
    title = 'Google Drive Connected'
    description = 'Successfully connected! You can close this window now.'
  } else if (status === 'limit_reached') {
    title = 'Limit Reached'
    description = 'You can connect up to 4 Google Drive accounts only.'
  } else if (status === 'duplicate') {
    title = 'Already Connected'
    description = 'This Google Drive account is already connected.'
  } else if (status === 'already_linked') {
    title = 'Account Already Linked'
    description = 'This Google Drive account is already linked to another CasaNest account.'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <Card className="w-full max-w-sm p-6 text-center">
        {ok ? <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" /> : <XCircle className="mx-auto h-10 w-10 text-red-500" />}
        <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </Card>
    </main>
  )
}
