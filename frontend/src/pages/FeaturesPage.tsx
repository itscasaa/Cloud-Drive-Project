import { useEffect } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { 
  Layers, 
  Upload, 
  FolderPlus, 
  Edit3, 
  Download, 
  RotateCcw,
  Sparkles,
  Zap,
  HardDrive,
  Eye,
  ArrowRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Lenis from "lenis"

export function FeaturesPage() {
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

  const features = [
    {
      title: "Connect Multiple Drives",
      description: "Link up to 4 Google Drive accounts under a single CasaNest profile to instantly expand your usable space.",
      icon: Layers,
      color: "from-blue-500 to-indigo-500",
      badge: "Scale Up"
    },
    {
      title: "Direct Streaming Uploads",
      description: "Upload large assets directly to your Google Drives. Files are streamed on-the-fly and never touch our servers' disks.",
      icon: Upload,
      color: "from-cyan-500 to-blue-500",
      badge: "Ultra Fast"
    },
    {
      title: "Virtual Folder Hierarchy",
      description: "Organize files into virtual folder structures that feel like a local desktop directory, even if files reside on different Drives.",
      icon: FolderPlus,
      color: "from-emerald-500 to-teal-500",
      badge: "Clean Layout"
    },
    {
      title: "In-Browser File Previews",
      description: "Preview photos, documents, PDFs, videos, and audio clips instantly in the browser without downloading them.",
      icon: Eye,
      color: "from-purple-500 to-pink-500",
      badge: "Quick View"
    },
    {
      title: "Seamless File Renaming",
      description: "Update metadata, rename folder trees, and reorganize directories. Updates sync instantly with the cloud.",
      icon: Edit3,
      color: "from-orange-500 to-amber-500",
      badge: "Full Control"
    },
    {
      title: "High-Speed Downloads",
      description: "Download files directly from Google APIs with original bandwidth speeds. We bypass unnecessary server bottlenecks.",
      icon: Download,
      color: "from-rose-500 to-red-500",
      badge: "Bandwidth+"
    },
    {
      title: "Unified Quota Monitor",
      description: "View individual and combined storage utilization statistics with real-time dynamic progress bars and quotas.",
      icon: HardDrive,
      color: "from-violet-500 to-purple-500",
      badge: "Monitoring"
    },
    {
      title: "3-Day Disconnect Grace Period",
      description: "If a Drive loses permission, we preserve its dashboard records for 72 hours so you can easily reconnect it.",
      icon: RotateCcw,
      color: "from-slate-500 to-slate-700",
      badge: "Data Buffer"
    }
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden pt-28">
      <LandingNavbar />

      {/* Decorative gradient backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#EAF5FF] via-slate-50/50 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Features Overview
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-6">
            Everything you need to unify your cloud workspace
          </h1>
          <p className="text-lg text-[#475569] font-medium leading-relaxed">
            CasaNest simplifies multi-account Google Drive storage by giving you one gorgeous, feature-packed workspace. See how our core tools make folder management feel simple.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.04)] hover:border-blue-200/80 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white shadow-md shadow-blue-500/10`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-[#0F172A] text-lg mb-3 group-hover:text-[#2563EB] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic Interactive Call to Action banner */}
        <div className="mt-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-300 fill-amber-300" /> Start using your new storage nest today
            </h2>
            <p className="text-base text-blue-100 mb-8 font-medium leading-relaxed max-w-xl">
              Connect your first Google Drive account in under 30 seconds. No credit card required. Free tier includes up to 4 connected drives.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => navigate("/register")}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#2563EB] font-bold px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95 text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold px-8 py-3.5 rounded-full transition-all active:scale-95 text-sm cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
