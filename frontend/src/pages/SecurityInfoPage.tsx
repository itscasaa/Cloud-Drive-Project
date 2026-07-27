import { useEffect } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Key, 
  FileLock, 
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"

export function SecurityInfoPage() {
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

  const standards = [
    {
      title: "OAuth 2.0 & Restricted Scopes",
      description: "We request the strict 'drive.file' scope, meaning CasaNest can ONLY access files created or opened through this app. We are blind to the rest of your Google Drive files.",
      icon: Key
    },
    {
      title: "AES-256 Token Encryption",
      description: "Your Google OAuth access and refresh tokens are encrypted using military-grade AES-256 before saving to our PostgreSQL database.",
      icon: Lock
    },
    {
      title: "No Local File Storage",
      description: "We never save your files on our server disks. File uploads are streamed on-the-fly directly to Google Drive, ensuring total privacy.",
      icon: EyeOff
    },
    {
      title: "Account Isolation",
      description: "A Google Drive account can only be connected to a single CasaNest profile at any time. This prevents storage sharing bypasses or overlapping access.",
      icon: FileLock
    }
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden pt-28">
      <LandingNavbar />

      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-[450px] bg-gradient-to-b from-[#EFF6FF] to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-24 right-1/4 w-[500px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Security & Integrity
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-6">
            Your data security is our absolute priority
          </h1>
          <p className="text-lg text-[#475569] font-medium leading-relaxed">
            CasaNest acts as a secure connector. Learn about the architecture, encryption standards, and strict permission limits we use to keep your files protected.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {standards.map((std, idx) => {
            const Icon = std.icon
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.02)] transition-all duration-300 flex items-start gap-5 hover:border-indigo-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0F172A] text-lg mb-2">{std.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed font-medium">
                    {std.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed architectural explanation */}
        <div className="bg-[#0F172A] rounded-[32px] p-8 md:p-12 text-white border border-[#1E293B] shadow-xl relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between relative z-10">
            <div className="max-w-2xl text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-6 inline-block">
                App Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                Google-Verified Security Boundaries
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                CasaNest uses the official Google OAuth consent loop. Because we only request access to the specific files we manage, our access is restricted. Google verifies all connection links, meaning your other drives, private emails, and sensitive documentations are completely safe.
              </p>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => navigate("/privacy")}>
                Read our Privacy Policy <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center shrink-0 w-full lg:w-64 flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="w-10 h-10 text-indigo-400" />
              <span className="font-bold text-sm">Protected Scope</span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                drive.file only
              </span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-8 text-center">
            Security FAQ
          </h2>
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="font-bold text-[#0F172A] mb-2 text-sm">Does CasaNest store copies of my Google Drive files?</h4>
              <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                No. CasaNest only stores metadata (file names, sizes, types, and Google Drive file IDs) to build your unified folder dashboard. When you preview or download a file, the data is fetched directly from Google's servers.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="font-bold text-[#0F172A] mb-2 text-sm">What happens if I delete my CasaNest account?</h4>
              <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                When you request account deletion, all your profile details, encrypted access tokens, and file metadata records are instantly and permanently deleted from our database. Your original files in your Google Drive will remain untouched.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
