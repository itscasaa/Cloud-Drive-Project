import { FolderOpen, FileText, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProductPreviewSection() {
  return (
    <section className="py-16 md:py-24 bg-white w-full border-b border-[#D8D8D2]">
      <div className="max-w-[1280px] mx-auto px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-left space-y-3">
          <span className="px-3.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border border-[#D8D8D2] text-[#5F6661] bg-[#F3F3F0] inline-block">
            Dashboard Preview
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B0D0C] leading-tight">
            One workspace, clearer daily flow.
          </h2>
          <p className="text-[#5F6661] font-semibold text-xs md:text-sm max-w-lg">
            A realistic preview of the CasaNest file manager, combining all your linked drives under a unified portal.
          </p>
        </div>

        {/* Dashboard Mockup in HTML/CSS */}
        <div className="w-full max-w-5xl mx-auto bg-[#F3F3F0] border border-[#D8D8D2] rounded-[24px] overflow-hidden shadow-lg flex flex-col md:flex-row text-left text-slate-800">
          
          {/* Mockup Sidebar */}
          <aside className="w-full md:w-56 bg-[#E9E9E5] border-r border-[#D8D8D2] p-4.5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D8D8D2]">
              <div className="h-2 w-2 rounded-full bg-[#5FE88D]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">CasaNest App</span>
            </div>

            {/* Sidebar Navigation */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-2">Navigation</span>
              <div className="text-[11px] font-black uppercase tracking-wider bg-white border border-[#D8D8D2] text-[#0B0D0C] px-3 py-2 rounded-lg cursor-pointer">
                All Files
              </div>
              <div className="text-[11px] font-semibold tracking-wide text-slate-500 hover:text-[#0B0D0C] px-3 py-2 rounded-lg cursor-pointer transition">
                Recovery & Backup
              </div>
              <div className="text-[11px] font-semibold tracking-wide text-slate-500 hover:text-[#0B0D0C] px-3 py-2 rounded-lg cursor-pointer transition">
                Settings
              </div>
            </div>

            {/* Sidebar Connected Accounts Meter */}
            <div className="space-y-2.5 pt-4 border-t border-[#D8D8D2]">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2">Pool Quotas</span>
              <div className="space-y-1.5 px-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Drive Pool</span>
                  <span>75% Used</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="bg-[#103D2A] h-full" style={{ width: '75%' }} />
                </div>
                <span className="text-[8px] font-medium text-slate-400 block">45.2 GB / 60 GB combined</span>
              </div>
            </div>
          </aside>

          {/* Mockup Main Panel */}
          <main className="flex-1 bg-white p-6 space-y-6">
            
            {/* Mockup Header bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              {/* Fake Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  disabled 
                  placeholder="Search file name..." 
                  className="w-full bg-[#F3F3F0] border border-[#D8D8D2] rounded-lg pl-9 pr-4 py-2 text-xs placeholder-slate-400 font-semibold focus:outline-none"
                />
              </div>
              {/* Fake Button Actions */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                <Button disabled className="font-bold text-[10px] uppercase tracking-wider h-8 px-3 rounded-full bg-[#101312] text-white flex items-center gap-1">
                  <Plus className="h-3 w-3" /> New Folder
                </Button>
              </div>
            </div>

            {/* Virtual Folders Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Virtual Folders</span>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                <div className="p-3 bg-[#F3F3F0] border border-[#D8D8D2] rounded-xl flex items-center gap-2.5">
                  <FolderOpen className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-black text-slate-700 truncate">Project Assets</span>
                </div>
                <div className="p-3 bg-[#F3F3F0] border border-[#D8D8D2] rounded-xl flex items-center gap-2.5">
                  <FolderOpen className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-black text-slate-700 truncate">Asset Backups</span>
                </div>
                <div className="p-3 bg-[#F3F3F0] border border-[#D8D8D2] rounded-xl flex items-center gap-2.5">
                  <FolderOpen className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-black text-slate-700 truncate">Client Assets</span>
                </div>
                <div className="p-3 bg-[#F3F3F0] border border-[#D8D8D2] rounded-xl flex items-center gap-2.5">
                  <FolderOpen className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-black text-slate-700 truncate">Source Code</span>
                </div>
              </div>
            </div>

            {/* File List Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Files Mapping</span>
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                      <th className="p-3">Name</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Account Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500 shrink-0" />Invoice_June.pdf</td>
                      <td className="p-3">1.2 MB</td>
                      <td className="p-3 text-[10px] text-slate-400">personal@gmail.com</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500 shrink-0" />Workspace_Mockup.sketch</td>
                      <td className="p-3">4.5 MB</td>
                      <td className="p-3 text-[10px] text-slate-400">work@gmail.com</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>

      </div>
    </section>
  )
}
