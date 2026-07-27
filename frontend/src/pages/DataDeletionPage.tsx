import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/20">
            <Trash2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Data Deletion Instructions</h1>
          <p className="mt-2 text-sm text-slate-500">How to remove your data from CasaNest</p>
        </header>

        <Card className="p-6 sm:p-8 space-y-6 text-slate-600 leading-relaxed">
          <p>
            At CasaNest, we respect your data privacy and give you full control over your stored credentials and file records. Below are the methods you can use to disconnect your Google Drive and delete all associated information.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">Option 1</span>
              Self-Service Account Deletion (Instant & Permanent)
            </h2>
            <p>
              The fastest way to remove all your data from our database is by deleting your account inside your dashboard:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Log in to your CasaNest dashboard.</li>
              <li>Go to the **Security & Privacy** page in the sidebar menu.</li>
              <li>Scroll down to the **Delete My Account** section.</li>
              <li>Click **Delete Account** and confirm your request in the modal.</li>
            </ol>
            <p className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-900 text-sm">
              <strong>What gets deleted:</strong> This action instantly and cascade-deletes your user profile, encrypted Google refresh tokens, database file records, database virtual folders, API keys, and active sessions. This action is irreversible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">Option 2</span>
              Disconnecting Google Drive Only
            </h2>
            <p>
              If you wish to retain your CasaNest login account but want to remove access to Google Drive:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open the dashboard **Settings** page.</li>
              <li>Find your connected Google Drive under "Connected Storage Accounts".</li>
              <li>Click **Disconnect**.</li>
            </ol>
            <p>
              This removes the encrypted refresh and access tokens from our database, making it impossible for the app to access your Google Drive.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">Option 3</span>
              Revoking Access via Google Account Settings
            </h2>
            <p>
              You can also revoke CasaNest's access directly from Google at any time:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to your Google Account's <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Third-party apps with account access</a> settings page.</li>
              <li>Find **CasaNest** in the list.</li>
              <li>Click **Remove Access**.</li>
            </ol>
            <p>
              This invalidates all tokens stored in our database, blocking any future API requests.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">Option 4</span>
              Manual Admin Request
            </h2>
            <p>
              If you cannot log in or need assistance, you can email our support at <a href="mailto:support@casanest.app" className="text-blue-600 font-bold hover:underline">support@casanest.app</a>. We will manually delete your user profile and database records within 24 hours.
            </p>
          </section>

          <div className="border-t border-slate-200 pt-6 flex justify-between text-xs font-bold text-slate-400">
            <span>© 2026 CasaNest</span>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-slate-600">Back to Login</Link>
              <Link to="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
