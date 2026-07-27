import { useEffect } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { 
  Check, 
  Zap, 
  Sparkles,
  Info
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"

export function PricingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const lenis = new Lenis()

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden pt-28">
      <LandingNavbar />

      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-[480px] bg-gradient-to-b from-[#EAF5FF] via-slate-50/50 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Pricing Options
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-6">
            Simple pricing, transparent values
          </h1>
          <p className="text-lg text-[#475569] font-medium leading-relaxed">
            Our goal is to make storage unification accessible to everyone. Get started with our feature-packed Free Tier, or preview our advanced plans.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16 items-stretch">
          {/* Card 1: Free Tier */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-blue-200 transition-all duration-300 flex flex-col justify-between relative">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-[10px] font-extrabold uppercase tracking-wider mb-6">
                Standard Access
              </span>
              <h3 className="text-2xl font-extrabold text-[#0F172A] mb-2">Free Plan</h3>
              <p className="text-sm text-[#475569] font-medium mb-6">Connect up to 4 accounts and manage storage seamlessly.</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-[#0F172A]">$0</span>
                <span className="text-sm text-slate-400 font-semibold">/ forever</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Connect up to 4 Google Drives</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Virtual folder management</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>File upload & rename</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>3-Day grace period backup</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Unified quota tracker</span>
                </li>
              </ul>
            </div>
            
            <button 
              onClick={() => navigate("/register")}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-full shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-95 text-sm cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Card 2: Pro Mockup */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-[32px] p-8 shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Unlimited Access
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5 fill-amber-400" /> Coming Soon
                </span>
              </div>
              <h3 className="text-2xl font-extrabold mb-2">Pro Plan</h3>
              <p className="text-sm text-slate-300 font-medium mb-6">For power users with massive storage demands across dozens of accounts.</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold">$9</span>
                <span className="text-sm text-slate-400 font-semibold">/ month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>Connect unlimited Google Drive accounts</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>Advanced routing policies</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>API Access & Webhooks</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>14-Day Disconnect Backup Grace Period</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>Priority premium support</span>
                </li>
              </ul>
            </div>
            
            <button 
              disabled
              className="w-full bg-white/5 border border-white/10 text-slate-400 font-bold py-3.5 rounded-full text-sm cursor-not-allowed"
            >
              Preview Only
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="mt-12 flex items-start gap-3 bg-white border border-slate-200 p-6 rounded-2xl max-w-2xl mx-auto">
          <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
            <strong>Important note:</strong> CasaNest does not host or sell digital cloud storage itself. We provide a connection dashboard to organize your existing free or paid Google Drive accounts.
          </p>
        </div>
      </div>
    </main>
  )
}
