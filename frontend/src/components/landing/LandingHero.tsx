import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getStoredUser, type AuthUser } from "@/lib/auth"
import { SiGoogledrive } from "react-icons/si"
import { ArrowDown, Layers, LayoutGrid, Folder, Plus } from "lucide-react"

export function LandingHero() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  return (
    <section className="text-center w-full pt-[128px] md:pt-[160px] pb-16 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center w-full">
        {/* Hero badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB]/80 shadow-sm mb-6">
          <Layers className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span className="text-xs font-semibold text-[#0F172A] tracking-tight">
            Multiple Drives, One Dashboard
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] leading-tight mb-6 max-w-5xl">
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">One Dashboard.</span> <span className="text-[#2563EB]">More Drive Space.</span>
        </h1>

        {/* Descriptive Body Text */}
        <p className="text-lg sm:text-xl text-[#0F172A] leading-relaxed max-w-3xl mx-auto mb-3 font-semibold">
          Connect multiple Google Drive accounts and manage them like one secure storage space.
        </p>
        <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-3xl mx-auto mb-8 font-medium">
          CasaNest helps you upload, organize, and recover files across connected Google Drive accounts without switching accounts manually.
        </p>

        {/* CTAs */}
        <div className="w-full max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {user ? (
            <button 
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm cursor-pointer"
            >
              Go to Dashboard &rarr;
            </button>
          ) : (
            <>
              <button 
                onClick={() => navigate("/register")}
                className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm cursor-pointer"
              >
                Create Account
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#0F172A] font-semibold px-8 py-3.5 rounded-full border border-[#E5E7EB] shadow-sm transition-all active:scale-95 text-sm cursor-pointer"
              >
                Login
              </button>
            </>
          )}
        </div>

        {/* Trust Notes under CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#475569] mb-16">
          <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full border border-[#E5E7EB]/80 shadow-sm">
            <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Connect up to 4 Drive accounts
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full border border-[#E5E7EB]/80 shadow-sm">
            <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Files stay in Google Drive
          </span>
          <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full border border-[#E5E7EB]/80 shadow-sm">
            <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            3-Day Backup recovery
          </span>
        </div>

        {/* Product Flow Visual */}
        <div className="w-full max-w-4xl bg-white/60 backdrop-blur-md border border-[#E2E8F0] rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col items-center">
          {/* Row 1: Google Drives connected (4 items) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {[1, 2, 3, 4].map((num) => (
              <div 
                key={num}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_4px_rgba(15,23,42,0.02)] transition-all hover:border-[#CBD5E1]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB] mb-2">
                  <SiGoogledrive className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-[#0F172A] whitespace-nowrap">Drive Account {num}</span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5">15 GB Capacity</span>
              </div>
            ))}
          </div>

          {/* Connection Arrow 1 */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-[#2563EB]" />
            </div>
            <ArrowDown className="w-5 h-5 text-[#2563EB] mt-1 animate-bounce" />
          </div>

          {/* Row 2: CasaNest Center Card */}
          <div className="w-full max-w-md flex flex-col items-center p-5 bg-[#2563EB] text-white rounded-2xl shadow-md transition-all hover:bg-blue-700">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
              <img src="/brand/logos.png" alt="CasaNest Logo" className="w-9 h-9 object-contain brightness-0 invert" />
            </div>
            <span className="font-bold text-sm">CasaNest Storage Gateway</span>
            <span className="text-xs text-blue-100 font-medium mt-1">Unified Multi-Account Layer</span>
          </div>

          {/* Connection Arrow 2 */}
          <div className="flex flex-col items-center justify-center my-4">
            <ArrowDown className="w-5 h-5 text-[#2563EB] animate-bounce" />
          </div>

          {/* Row 3: One Unified Storage Dashboard */}
          <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-[0_4px_12px_rgba(15,23,42,0.03)] text-left">
            <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-xs text-[#0F172A]">Unified Dashboard View</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">60 GB Combined Pool</span>
            </div>

            {/* Combined Quota Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Combined Quota Usage</span>
                <span>24.5 GB / 60.0 GB (40.8%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-blue-600 h-full border-r border-white/20" style={{ width: '10%' }}></div>
                <div className="bg-emerald-500 h-full border-r border-white/20" style={{ width: '12%' }}></div>
                <div className="bg-amber-500 h-full border-r border-white/20" style={{ width: '8%' }}></div>
                <div className="bg-indigo-500 h-full" style={{ width: '10.8%' }}></div>
              </div>
              <div className="flex gap-4 mt-1.5 text-[9px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Drive 1</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Drive 2</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Drive 3</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Drive 4</span>
              </div>
            </div>

            {/* Simulated Virtual Folders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-semibold text-[#334155]">
                <Folder className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="truncate">Work Documents</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-semibold text-[#334155]">
                <Folder className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="truncate">Shared Projects</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-semibold text-[#334155]">
                <Folder className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="truncate">Personal Backup</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

