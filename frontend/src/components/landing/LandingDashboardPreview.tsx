import {
  LayoutGrid,
  Folder,
  Cloud,
  History,
  Shield,
  Settings,
  LogOut,
  FileArchive,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

export function LandingDashboardPreview() {
  const recentFiles = [
    { name: "Project Brief.pdf", size: "2.4 MB", type: "pdf", date: "10m ago", access: "Owner" },
    { name: "Invoice Backup.xlsx", size: "1.2 MB", type: "xlsx", date: "2h ago", access: "Owner" },
    { name: "Design Assets.zip", size: "45 MB", type: "zip", date: "1d ago", access: "Owner" }
  ]

  const connectedDrives = [
    { email: "active-sync@drive.com", provider: "Google Drive", used: "410 GB", total: "1.0 TB", progress: 41 },
    { email: "personal-vault@drive.com", provider: "Google Drive", used: "410 GB", total: "1.0 TB", progress: 41 }
  ]

  return (
    <section id="demo" className="relative w-full h-full z-10">
      {/* Mock Desktop Browser Window */}
      <div className="w-full h-full">
        {/* Window Header bar */}
        <div className="bg-gray-50/80 px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          {/* Triple Controls */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          {/* Mock Address Bar */}
          <div className="bg-white border border-[#E5E7EB] px-8 py-1 rounded-md text-[10px] text-[#475569] font-mono flex items-center gap-1.5 shadow-sm max-w-sm w-full justify-center">
            <svg className="w-3 h-3 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>app.casanest.cloud/secure-gateway</span>
          </div>
          {/* Live Sync Indicator */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] pulse-dot"></span>
            <span className="text-[11px] font-semibold text-[#10B981]">Synced</span>
          </div>
        </div>

        {/* Main Dashboard Panel Interface */}
        <div className="flex flex-row h-[680px] divide-x divide-[#E5E7EB]">
          
          {/* Left Sidebar navigation (Hidden on mobile) */}
          <aside className="flex w-64 bg-white p-5 flex-col justify-between shrink-0 border-r border-[#E5E7EB]/30">
            <div className="space-y-6">
              {/* Brand logo & tagline */}
              <div className="flex flex-col gap-1.5 pb-5 border-b border-slate-100/85">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 shrink-0 bg-[#2563EB] rounded-full flex items-center justify-center text-white">
                    <img src="/brand/logos.png" alt="Logo" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">CasaNest</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 leading-normal text-left">
                  Secure storage nest for your connected drives.
                </p>
              </div>

              {/* Main Menu */}
              <nav className="space-y-1 text-left">
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide bg-blue-50/70 text-blue-600 shadow-sm border-l-2 border-blue-600 rounded-l-none pl-3">
                  <LayoutGrid className="h-4.5 w-4.5" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Folder className="h-4.5 w-4.5" />
                  <span>All Files</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Cloud className="h-4.5 w-4.5" />
                  <span>Connected Drives</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <History className="h-4.5 w-4.5" />
                  <span>Recovery & Backup</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Shield className="h-4.5 w-4.5" />
                  <span>Security</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-extrabold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Settings className="h-4.5 w-4.5" />
                  <span>Settings</span>
                </div>
              </nav>
            </div>

            {/* Storage summary progress */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]/80">
              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Used</span>
                  <span>2.0 TB</span>
                </div>
                <p className="mt-1 text-sm font-extrabold text-slate-900">820 GB</p>
                <div className="mt-2.5 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#2563EB] transition-all duration-300" style={{ width: '41%' }} />
                </div>
              </div>
              
              <div className="w-full flex items-center justify-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 font-bold text-xs text-slate-500">
                <LogOut className="h-4 w-4 mr-1 shrink-0" />
                Log Out
              </div>
            </div>
          </aside>

          {/* Main Application Panel */}
          <div className="flex-1 bg-slate-50/40 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            
            {/* Header welcome back */}
            <div className="text-left border-b border-[#E5E7EB]/60 pb-5 shrink-0">
              <h1 className="text-2xl font-extrabold text-slate-900 leading-none">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">Manage your connected drives and files securely.</p>
            </div>

            {/* Metrics Row */}
            <div className="grid gap-4 grid-cols-4 text-left">
              {/* Metric 1 */}
              <div className="flex flex-col justify-between p-5 border border-slate-100/80 shadow-sm bg-white rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Drives</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">2 / 4</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  <span>Google Drive slots connected</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex flex-col justify-between p-5 border border-slate-100/80 shadow-sm bg-white rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Files Managed</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">128</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <FileArchive className="h-4 w-4 text-blue-600" />
                  <span>Virtual folder record mapping</span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex flex-col justify-between p-5 border border-slate-100/80 shadow-sm bg-white rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recovery Items</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">3-Day Backup</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <History className="h-4 w-4 text-blue-600" />
                  <span>Continuous rollback status</span>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="flex flex-col justify-between p-5 border border-slate-100/80 shadow-sm bg-white rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Storage Used</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">820 GB</p>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: '41%' }} />
                  </div>
                  <p className="mt-1.5 text-right text-xs font-bold text-blue-600">41% Utilized</p>
                </div>
              </div>
            </div>

            {/* Asymmetrical 2-Column Grid */}
            <div className="grid gap-6 grid-cols-3 text-left">
              
              {/* Left Column (2/3 width on desktop) */}
              <div className="col-span-2 space-y-6">
                
                {/* Recent Files card */}
                <div className="bg-white p-6 border border-slate-100/80 shadow-sm rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Recent Files</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Quick access to files uploaded recently to your nest.</p>
                    </div>
                    <div className="px-3.5 py-1.5 text-xs font-bold text-slate-500 border border-[#E5E7EB] hover:bg-slate-50 rounded-xl transition cursor-pointer">
                      View All Files
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-3 font-semibold">Name</th>
                          <th className="py-3 font-semibold">Last Modified</th>
                          <th className="py-3 font-semibold">Size</th>
                          <th className="py-3 font-semibold">Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFiles.map((file, idx) => (
                          <tr key={idx} className="border-b border-slate-100/60 hover:bg-slate-50/50 transition">
                            <td className="py-3.5 flex items-center gap-2.5 max-w-[200px] truncate font-semibold text-slate-900">
                              <FileArchive className="h-4.5 w-4.5 shrink-0 text-blue-600" />
                              <span className="truncate">{file.name}</span>
                            </td>
                            <td className="py-3.5 text-sm text-slate-500 font-medium">{file.date}</td>
                            <td className="py-3.5 text-sm text-slate-500 font-medium">{file.size}</td>
                            <td className="py-3.5 text-xs text-slate-400 font-bold">{file.access}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Connected Drives */}
                <div className="bg-white p-6 border border-slate-100/80 shadow-sm rounded-2xl">
                  <h3 className="text-lg font-bold text-slate-900">Connected Storage Drives</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Physical account quota sync status and usage details.</p>

                  <div className="mt-4 space-y-4">
                    {connectedDrives.map((account, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:bg-slate-50/60"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm border border-[#E5E7EB]/40">
                              <Cloud className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm leading-snug">{account.email}</p>
                              <p className="text-xs text-slate-400 font-bold capitalize leading-none mt-0.5">
                                {account.provider}
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="h-8 rounded-lg px-2.5 text-xs font-bold border border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center gap-1 transition cursor-pointer">
                              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                              <span>Sync</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                            <span>{account.used} Used</span>
                            <span>{account.total}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-500"
                              style={{ width: `${account.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column (1/3 width on desktop) */}
              <div className="space-y-6">
                
                {/* Recovery & Backup Warning Card */}
                <div className="border border-amber-200 bg-amber-50/50 p-5 text-amber-900 shadow-sm rounded-2xl">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
                          <Clock className="h-3.5 w-3.5" />
                          3-Day Backup
                        </span>
                        <span className="text-xs font-bold text-amber-700">
                          Expires in 3 days
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-amber-900 leading-snug">
                        Reconnect the same Google account to restore these files.
                      </p>
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Reconnect the same Google account within 3 days to restore CasaNest metadata. If not reconnected in time, metadata will be permanently cleared.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security status check list */}
                <div className="bg-white p-6 border border-slate-100/80 shadow-sm rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-lg font-bold text-slate-900">Security Status</h3>
                  </div>
                  <p className="text-sm text-slate-500">Security nest validations check status.</p>

                  <div className="mt-5 space-y-3.5 text-sm">
                    <div className="flex gap-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">AES-256 Google Token Encryption</p>
                        <p className="text-xs text-slate-500 mt-0.5">All refresh keys are strongly hashed and encrypted.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">Audit Logs Logging Status</p>
                        <p className="text-xs text-slate-500 mt-0.5">Gateway uploads and deletes recorded to db.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">Credential-free Session Token</p>
                        <p className="text-xs text-slate-500 mt-0.5">JWT access key uses standard bearer auth.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
