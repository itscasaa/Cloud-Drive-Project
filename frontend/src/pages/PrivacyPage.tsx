import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Effective date: June 22, 2026</p>
        </header>

        <Card className="p-6 sm:p-8 space-y-6 text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">1</span>
              Overview & File Ownership
            </h2>
            <p>
              CasaNest is a Google Drive storage gateway app. We act as a connection layer between your CasaNest dashboard and your personal Google Drive account.
            </p>
            <p className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-blue-900">
              <strong>Crucial Point:</strong> Your files never stay on our server disks. When you upload files, they are streamed through our backend directly to your Google Drive inside a dedicated folder named <code>casanest</code>. You remain the absolute owner of all your files.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">2</span>
              What Data We Access & Store
            </h2>
            <p>
              To provide the virtual folder organizing and file viewing interface, we collect and store:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Profile Information:</strong> Your name and email address when you create an account or sign in with Google.</li>
              <li><strong>File Metadata:</strong> File name, file size, MIME type, and Google Drive File ID. We store this metadata in our database to build the virtual file manager.</li>
              <li><strong>OAuth Credentials:</strong> Encrypted Google OAuth refresh and access tokens, required to communicate with the Google APIs on your behalf.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">3</span>
              Security & OAuth Scopes
            </h2>
            <p>
              We request access to Google Drive using the restricted scope:
            </p>
            <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs text-slate-800 break-all select-all">
              https://www.googleapis.com/auth/drive.file
            </div>
            <p>
              This scope limits our app's access to <strong>only files that you create or open using this application</strong>. We cannot see, modify, or delete any other files in your Google Drive.
            </p>
            <p>
              All Google credentials and refresh tokens are encrypted at-rest in our database using standard AES-256 encryption. We never expose your secrets or save authentication tokens in the browser's <code>localStorage</code> or <code>sessionStorage</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">4</span>
              Control & Data Deletion
            </h2>
            <p>
              You can withdraw access and delete your data at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Disconnect:</strong> Disconnect any linked Google account through the Settings dashboard to instantly remove Google access tokens from our database.</li>
              <li><strong>Delete Account:</strong> Trigger an account deletion in the dashboard under the "Security & Privacy" tab. This instantly and permanently deletes your user account, virtual folder structures, metadata records, and encrypted Google tokens.</li>
            </ul>
            <p>
              For additional details, see our <Link to="/data-deletion" className="text-blue-600 font-bold hover:underline">Data Deletion Instructions</Link> page.
            </p>
          </section>

          <div className="border-t border-slate-200 pt-6 flex justify-between text-xs font-bold text-slate-400">
            <span>© 2026 CasaNest</span>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-slate-600">Back to Login</Link>
              <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
