import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Download,
  Eye,
  FileArchive,
  FileText,
  ImageIcon,
  Lock,
  Play,
  ShieldCheck,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { ThemeToggle } from '@/components/drive/ThemeToggle'
import { API_URL, formatBytes, formatDate } from '@/lib/api'
import { createPlyr, ensurePlyr } from '@/lib/plyr'
import { getPreviewKind, isSpreadsheetMimeType, officeViewerUrl } from '@/lib/preview'
import { cn } from '@/lib/utils'

type PublicFile = {
  name: string
  mimeType: string
  sizeBytes: string
  createdAt?: string
  allowDownload?: boolean
  expiresAt?: string | null
  hasPassword?: boolean
}

function fileIcon(file: PublicFile, kind: ReturnType<typeof getPreviewKind>) {
  if (kind === 'image') return <ImageIcon className="h-5 w-5" />
  if (kind === 'video') return <Play className="h-5 w-5" />
  if (isSpreadsheetMimeType(file.mimeType)) return <Table2 className="h-5 w-5" />
  if (kind === 'document' || kind === 'office') return <FileText className="h-5 w-5" />
  return <FileArchive className="h-5 w-5" />
}

function UnsupportedPreview({
  file,
  downloadUrl,
  allowDownload,
}: {
  file: PublicFile
  downloadUrl: string
  allowDownload: boolean
}) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <FileArchive className="h-9 w-9" />
      </div>
      <h2 className="mt-6 text-xl font-extrabold text-slate-900 dark:text-slate-50">No preview available</h2>
      <p className="mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{file.name}</span> can’t be previewed in the browser.
        {allowDownload ? ' You can still download this single shared file.' : ' Download is disabled for this link.'}
      </p>
      {allowDownload ? (
        <a href={downloadUrl} download className="mt-6">
          <Button>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </a>
      ) : null}
    </div>
  )
}

function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        Only this file is shared
      </span>
      <span className="hidden text-slate-400 dark:text-slate-600 sm:inline">•</span>
      <span className="normal-case tracking-normal font-semibold text-slate-400 dark:text-slate-500">
        No access to other files or folders
      </span>
    </div>
  )
}

function ShareChrome({ children }: { children: ReactNode }) {
  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30 sm:h-16 sm:px-5">
      {children}
    </header>
  )
}

export function PublicFilePage({ embed = false }: { embed?: boolean }) {
  const { token } = useParams()
  const [file, setFile] = useState<PublicFile | null>(null)
  const [failed, setFailed] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const previewUrl = `${API_URL}/public/files/${token}/preview`
  const downloadUrl = `${API_URL}/public/files/${token}/download`
  const kind = getPreviewKind(file?.mimeType)
  const allowDownload = file?.allowDownload !== false
  const mediaDark = kind === 'image' || kind === 'video'

  async function loadMeta() {
    setFailed(false)
    setUnlockError('')
    setPreviewError(false)
    try {
      const response = await fetch(`${API_URL}/public/files/${token}`, { credentials: 'include' })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401 && (data.code === 'SHARE_PASSWORD_REQUIRED' || data.hasPassword)) {
        setNeedsPassword(true)
        // Keep filename minimal before unlock for privacy feel.
        setFile({
          name: data.file?.name || 'Protected file',
          mimeType: data.file?.mimeType || 'application/octet-stream',
          sizeBytes: data.file?.sizeBytes || '0',
          hasPassword: true,
          allowDownload: data.file?.allowDownload,
          expiresAt: data.file?.expiresAt,
        })
        return
      }
      if (!response.ok) {
        setFile(null)
        setFailed(true)
        setNeedsPassword(false)
        return
      }
      setNeedsPassword(false)
      setFile(data.file)
    } catch {
      setFile(null)
      setFailed(true)
      setNeedsPassword(false)
    }
  }

  useEffect(() => {
    loadMeta().catch(() => undefined)
  }, [token])

  useEffect(() => {
    document.title = file && !needsPassword ? `${file.name} · Shared on CasaNest` : 'Shared file · CasaNest'
    return () => {
      document.title = 'CasaNest'
    }
  }, [file, needsPassword])

  useEffect(() => {
    if (needsPassword || kind !== 'video' || !videoRef.current) return undefined
    let disposed = false
    let player: { destroy: () => void } | null = null

    ensurePlyr()
      .then(() => {
        if (disposed || !videoRef.current) return
        player = createPlyr(videoRef.current)
      })
      .catch(() => undefined)

    return () => {
      disposed = true
      player?.destroy()
    }
  }, [kind, previewUrl, needsPassword])

  async function unlock(event: FormEvent) {
    event.preventDefault()
    setUnlocking(true)
    setUnlockError('')
    try {
      const response = await fetch(`${API_URL}/public/files/${token}/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setUnlockError(data.message || 'Incorrect password')
        return
      }
      setNeedsPassword(false)
      setFile(data.file)
      setPassword('')
    } catch {
      setUnlockError('Failed to unlock share link')
    } finally {
      setUnlocking(false)
    }
  }

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-slate-950">
        <ShareChrome>
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" logoClassName="h-12 w-12" />
            <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50">CasaNest</span>
          </Link>
          <ThemeToggle className="h-10 w-10 rounded-full" />
        </ShareChrome>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
            <FileArchive className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h1 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-slate-50">File unavailable</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              This share link may be expired, revoked, or invalid. The owner’s other files stay private.
            </p>
            <div className="mt-4">
              <TrustStrip />
            </div>
            <div className="mt-6">
              <Link to="/">
                <Button variant="outline">Back to CasaNest</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!file) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Opening shared file…
      </main>
    )
  }

  if (needsPassword) {
    return (
      <main className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-slate-950">
        <ShareChrome>
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" logoClassName="h-12 w-12" />
            <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-50">CasaNest</span>
          </Link>
          <ThemeToggle className="h-10 w-10 rounded-full" />
        </ShareChrome>
        <div className="flex flex-1 items-center justify-center p-6">
          <form
            onSubmit={unlock}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-center text-2xl font-extrabold text-slate-900 dark:text-slate-50">Enter password</h1>
            <p className="mt-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              This link is password protected. Unlocking only opens this one shared file.
            </p>
            <div className="mt-4">
              <TrustStrip />
            </div>
            <label className="mt-6 grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="h-11 rounded-xl"
                placeholder="Share password"
                autoComplete="current-password"
              />
            </label>
            {unlockError ? (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
                {unlockError}
              </p>
            ) : null}
            <Button disabled={unlocking || !password} className="mt-5 w-full">
              {unlocking ? 'Unlocking…' : 'Open file'}
            </Button>
          </form>
        </div>
      </main>
    )
  }

  const preview = (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        mediaDark ? 'bg-black' : 'bg-[#f1f3f4] dark:bg-slate-900',
      )}
    >
      {previewError ? (
        <UnsupportedPreview file={file} downloadUrl={downloadUrl} allowDownload={allowDownload} />
      ) : null}
      {!previewError && kind === 'image' ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-full max-w-full object-contain"
          onError={() => setPreviewError(true)}
        />
      ) : null}
      {!previewError && kind === 'video' ? (
        <div className="shared-video-shell">
          <video ref={videoRef} controls playsInline preload="metadata" onError={() => setPreviewError(true)}>
            <source src={previewUrl} type={file.mimeType} />
          </video>
        </div>
      ) : null}
      {!previewError && kind === 'document' ? (
        <iframe
          src={previewUrl}
          title={file.name}
          className="h-full w-full border-0 bg-white dark:bg-slate-900"
        />
      ) : null}
      {!previewError && kind === 'office' ? (
        <iframe
          src={officeViewerUrl(previewUrl)}
          title={file.name}
          className="h-full w-full border-0 bg-white dark:bg-slate-900"
        />
      ) : null}
      {!previewError && !kind ? (
        <UnsupportedPreview file={file} downloadUrl={downloadUrl} allowDownload={allowDownload} />
      ) : null}
    </div>
  )

  if (embed) {
    return <main className="h-screen overflow-hidden bg-black text-white">{preview}</main>
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f8fafc] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Drive-like top bar */}
      <ShareChrome>
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="hidden shrink-0 items-center gap-2 sm:flex" title="CasaNest">
            <BrandLogo className="h-9 w-9" logoClassName="h-12 w-12" />
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                mediaDark
                  ? 'bg-slate-900 text-white dark:bg-slate-800'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
              )}
            >
              {fileIcon(file, kind)}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1
                  className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-50 sm:text-base"
                  title={file.name}
                >
                  {file.name}
                </h1>
                {!allowDownload ? (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 sm:inline-flex">
                    <Eye className="h-3 w-3" />
                    View only
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                Shared file · {formatBytes(file.sizeBytes)}
                {file.expiresAt ? ` · Expires ${formatDate(file.expiresAt)}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="h-10 w-10 rounded-full" />
          {allowDownload ? (
            <a href={downloadUrl} download>
              <Button className="h-10 rounded-full px-4 shadow-md shadow-blue-600/15 dark:shadow-blue-900/30">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </a>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Download off
            </span>
          )}
        </div>
      </ShareChrome>

      {/* Trust banner — Google Drive style “shared with you” clarity */}
      <div className="shrink-0 border-b border-slate-200/80 bg-white/80 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            You’re viewing a single shared file. Other files and folders from the owner are not accessible.
          </p>
          <TrustStrip />
        </div>
      </div>

      {/* Preview stage */}
      <section className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden">{preview}</div>
      </section>

      <footer className="flex h-10 shrink-0 items-center justify-center border-t border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
        Shared securely via CasaNest · one file only
      </footer>
    </main>
  )
}
