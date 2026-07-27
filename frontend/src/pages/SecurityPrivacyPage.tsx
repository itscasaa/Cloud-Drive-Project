import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ShieldAlert, Key, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DummyModal } from '@/components/drive/DummyModal'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch } from '@/lib/api'
import { clearAuthSession, getStoredUser } from '@/lib/auth'

type ConnectedAccount = {
  id: string
  provider: string
  email: string
  displayName?: string | null
  status: string
}

export function SecurityPrivacyPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [message, setMessage] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  async function loadAccounts() {
    try {
      const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
      setAccounts(data.accounts.filter(a => a.provider === 'google_drive'))
    } catch {
      // Fail silently for accounts load
    }
  }

  useEffect(() => {
    loadAccounts().catch(() => undefined)
  }, [])

  async function disconnectAccount(id: string) {
    setDisconnectingId(id)
    setMessage('')
    try {
      await apiFetch(`/connected-accounts/${id}`, { method: 'DELETE' })
      setMessage('Google Drive account disconnected successfully.')
      await loadAccounts()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to disconnect account')
    } finally {
      setDisconnectingId(null)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    setMessage('')
    try {
      await apiFetch('/auth/delete-account', { method: 'DELETE' })
      clearAuthSession()
      navigate('/login')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete account')
      setDeleteModalOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Security & Privacy"
        description="Understand how your storage nest is protected and manage account privacy settings."
      />

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm font-semibold text-blue-800 animate-fadeIn">
          {message}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="grid gap-6">
          {/* Security Declarations Card */}
          <Card className="p-6 border border-slate-100/80 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              How We Protect Your Nest
            </h2>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <ShieldCheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 text-xs">Files Remain in Google Drive</p>
                  <p className="mt-0.5 text-xs text-slate-500">Your files are streamed through our backend directly to your personal Google Drive storage. We do not store files on our local disks.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <ShieldCheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 text-xs">Metadata-Only Storage</p>
                  <p className="mt-0.5 text-xs text-slate-500">We store only file metadata (file name, size, MIME type) and folder names to build your virtual dashboard layout.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 text-xs">AES-256 Encryption</p>
                  <p className="mt-0.5 text-xs text-slate-500">Your Google refresh tokens are strongly encrypted at-rest using AES-256 standard encryption. No credentials are saved in localStorage.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 text-xs">Revoke Access Anytime</p>
                  <p className="mt-0.5 text-xs text-slate-500">You can disconnect Google Drive or completely delete your CasaNest account at any moment, destroying all database tokens immediately.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          {/* Disconnect Google Card */}
          <Card className="p-6 border border-slate-100/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Disconnect Google Drive</h2>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              Disconnecting a Google Drive account removes its encrypted refresh tokens from our database.
            </p>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">No Google Drive accounts connected.</p>
            ) : (
              <div className="grid gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-extrabold text-slate-900 text-xs truncate">{acc.email}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">STATUS: {acc.status}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-slate-200 text-xs h-8 font-bold"
                      onClick={() => disconnectAccount(acc.id)}
                      disabled={disconnectingId === acc.id || user?.role === 'demo'}
                    >
                      {disconnectingId === acc.id ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Delete Account Card */}
          <Card className="p-6 border border-red-100 bg-red-50/10 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Danger Zone
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-semibold leading-relaxed">
              Permanently delete your user profile, files metadata, and all connected Google/S3 storage configurations. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              className="w-full sm:w-auto text-xs font-bold"
              onClick={() => setDeleteModalOpen(true)}
              disabled={user?.role === 'demo'}
            >
              Delete My Account
            </Button>
            {user?.role === 'demo' ? (
              <p className="text-[10px] font-bold text-orange-600 mt-2.5">
                ⚠️ Account deletion is disabled in Demo Mode.
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DummyModal
        open={deleteModalOpen}
        title="Permanently delete account?"
        description="This action is irreversible. All of your folders, virtual file records, API keys, and connected Google Drive credentials will be deleted instantly."
        onClose={() => setDeleteModalOpen(false)}
      >
        <div className="grid gap-4 mt-4">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting account...' : 'Confirm Permanent Deletion'}
            </Button>
          </div>
        </div>
      </DummyModal>
    </>
  )
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
