import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Effective date: June 22, 2026</p>
        </header>

        <Card className="p-6 sm:p-8 space-y-6 text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By signing up, logging in, or connecting your Google Drive to the CasaNest application, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use this application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">2</span>
              Application Use & Quota limits
            </h2>
            <p>
              CasaNest provides a dashboard interface to manage Google Drive. You are responsible for ensuring:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You do not exceed the storage capacity provided by your Google Drive or custom S3 account.</li>
              <li>You do not upload malicious code, viruses, or illegal materials that violate local laws or Google's Program Policies.</li>
              <li>Under Demo Mode, uploads must not exceed 5MB per file, and files may be deleted or wiped periodically by the system administrators.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">3</span>
              Google API Integration & Fair Use
            </h2>
            <p>
              CasaNest integrates with Google APIs to manage files. You grant the application permission to link, access, read, and write to the dedicated <code>casanest</code> folder inside your Google Drive using the restricted scope.
            </p>
            <p>
              We reserve the right to limit API requests or suspend user access if we detect abusive traffic patterns, brute-forcing attempts, or load that threatens the stability of the exhibition server.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">4</span>
              Disclaimers & Limitation of Liability
            </h2>
            <p>
              CASANEST IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p>
              We do not store your physical files. Therefore, we are not responsible for any file loss, corrupted uploads, sync failures, or data deletion that happens inside your personal Google Drive or remote S3 buckets. Any API connection faults or token expirations are governed by the respective providers.
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
