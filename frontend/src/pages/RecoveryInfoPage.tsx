import { useEffect } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { 
  RotateCcw, 
  Hourglass, 
  Database, 
  Info,
  ShieldCheck,
  CheckCircle
} from "lucide-react"
import Lenis from "lenis"

export function RecoveryInfoPage() {

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

  const workflow = [
    {
      step: "1",
      title: "Drive gets disconnected",
      description: "If you intentionally unlink a Google Drive account or if the OAuth permission expires, CasaNest moves its records to a temporary buffer state.",
      icon: RotateCcw
    },
    {
      step: "2",
      title: "72-Hour countdown begins",
      description: "The metadata, virtual directories, and file structures remain cached in our database. The 72-hour timer starts immediately.",
      icon: Hourglass
    },
    {
      step: "3",
      title: "Reconnect the same account",
      description: "Go to your dashboard settings, click reconnect, and authorize the exact same Google Drive email address to recover the workspace.",
      icon: Database
    },
    {
      step: "4",
      title: "Records fully restored",
      description: "All files, virtual folder structures, recent file history, and sharing logs are instantly re-synced and active.",
      icon: ShieldCheck
    }
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden pt-28">
      <LandingNavbar />

      {/* Decorative gradients */}
      <div className="absolute top-0 inset-x-0 h-[450px] bg-gradient-to-b from-[#EAF5FF] via-slate-50/50 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-12 left-1/3 w-[600px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            <RotateCcw className="w-3.5 h-3.5" /> 3-Day Backup System
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-6">
            Disconnected a Drive? No data was lost.
          </h1>
          <p className="text-lg text-[#475569] font-medium leading-relaxed">
            Our unique 3-Day Backup system ensures that unlinking a Google Drive account does not destroy your virtual folder structures. Learn how the safety buffer works.
          </p>
        </div>

        {/* Workflow steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {workflow.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-blue-200 transition-all duration-300 relative flex flex-col justify-between"
              >
                <span className="absolute top-4 right-6 text-slate-100 font-extrabold text-5xl select-none pointer-events-none">
                  {item.step}
                </span>
                <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-[#2563EB] mb-6">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-[#475569] leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed Explanation Banner */}
        <div className="bg-white rounded-[32px] border border-slate-200 p-8 md:p-12 shadow-sm mb-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-4">
                Why we built the 72-Hour Buffer
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed font-medium mb-6">
                When you build virtual directories in CasaNest, you might place files from multiple drives inside the same virtual folder. If one of those drives gets unlinked (e.g. password change, Google API policy change, or manual disconnect), deleting those records immediately would break your custom directory trees.
              </p>
              <p className="text-sm text-[#475569] leading-relaxed font-medium mb-6">
                By maintaining a 72-hour grace period, we give you time to reconnect your drive and restore the layout without having to rebuild folders manually.
              </p>
              
              <div className="inline-flex items-start gap-2.5 bg-blue-50 border border-blue-100/80 p-4.5 rounded-2xl text-xs sm:text-sm text-[#475569] font-medium max-w-xl">
                <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <p>
                  <strong>Note:</strong> We never touch the files inside your Google Drive. Files inside Google Drive are fully managed by Google and remain safe and untouched even if they are disconnected from CasaNest.
                </p>
              </div>
            </div>
            
            <div className="shrink-0 flex flex-col items-center justify-center gap-3 bg-slate-50 border border-[#E2E8F0] rounded-2xl p-6 text-center w-full lg:w-64">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
              <span className="font-bold text-sm text-[#0F172A]">Safe Recovery</span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 font-bold uppercase tracking-wider">
                Buffer Active
              </span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-8 text-center">
            Backup & Recovery FAQs
          </h2>
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="font-bold text-[#0F172A] mb-2 text-sm">What happens if the 3 days expire without reconnecting?</h4>
              <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                If the 72-hour countdown expires, the metadata records for that drive are permanently wiped from the CasaNest databases. Again, your real files inside Google Drive will remain perfectly safe and will not be affected.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="font-bold text-[#0F172A] mb-2 text-sm">Can I reconnect a different Google Drive email instead?</h4>
              <p className="text-xs sm:text-sm text-[#475569] font-medium leading-relaxed">
                No. The recovery buffer binds specifically to the unique Google Drive ID of the disconnected account. You must reconnect the exact same Google account to restore the associated folder paths.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
