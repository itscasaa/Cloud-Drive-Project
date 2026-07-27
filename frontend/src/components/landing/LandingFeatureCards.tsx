import { 
  AlertTriangle,
  Info,
  Layers,
  Lock,
  Cloud,
  FolderPlus,
  LayoutDashboard,
  RotateCcw,
  Plus,
  ArrowRight,
  Shield,
  UserCheck,
  Upload,
  Download,
  Edit3
} from "lucide-react"
import { SiGoogledrive } from "react-icons/si"

// ==========================================
// 1. SOLUTION SECTION (Narrative & Equation)
// ==========================================
export function ProductIntroSection() {
  return (
    <section id="solution" className="py-16 md:py-24 bg-white text-left scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            Unified Cloud Solution
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            CasaNest turns many Drives into one storage dashboard
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed font-medium">
            CasaNest connects multiple Google Drive accounts and lets users manage them from a single web dashboard. The files are still stored inside each Google Drive account, but CasaNest makes them easier to access, organize, and manage.
          </p>
        </div>

        {/* Equation Visual */}
        <div className="bg-slate-50 border border-[#E2E8F0] rounded-[24px] p-6 md:p-8 mb-12 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="bg-white px-4 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                <SiGoogledrive className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#0F172A]">15 GB</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
              <div className="bg-white px-4 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                <SiGoogledrive className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#0F172A]">15 GB</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
              <div className="bg-white px-4 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                <SiGoogledrive className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#0F172A]">15 GB</span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
              <div className="bg-white px-4 py-3 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                <SiGoogledrive className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm text-[#0F172A]">15 GB</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#2563EB] rotate-90 md:rotate-0" />
            <div className="bg-[#2563EB] text-white px-6 py-3.5 rounded-2xl shadow-md font-bold text-base flex items-center gap-2">
              <Layers className="w-5 h-5" />
              <span>More usable storage</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-bold text-center mt-4">
            The exact available storage depends on each connected Google Drive account.
          </p>
        </div>

        {/* Narrative Blocks (The Core Story Content) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-[#F8FAFC] border border-[#E2E8F0] p-8 md:p-10 rounded-[32px] shadow-sm">
          <div className="space-y-6">
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">The Problem We Solve</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                CasaNest was created from a simple problem: Google Drive storage often runs out quickly. Many people create multiple Google Drive accounts to get extra storage, but the problem is that files become scattered across many accounts and are difficult to manage.
              </p>
            </div>
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">How CasaNest Helps</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                CasaNest is a web application that allows users to connect multiple Google Drive accounts into one dashboard. This allows the storage capacity from several Drive accounts to be used and managed from one place.
              </p>
            </div>
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Larger Storage Pool</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                For example, if one Google Drive account has 15 GB of storage, then by connecting multiple Drive accounts to CasaNest, users can have a larger combined storage space. The original files remain stored in each Google Drive account, while CasaNest makes everything easier to manage like one unified storage system.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Complete File Workspace</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                Through CasaNest, users can upload files, create folders, organize files, view files, and manage multiple Drives without opening each Google Drive account one by one.
              </p>
            </div>
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Safety and Buffer Systems</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                CasaNest also focuses on security. It uses limited Google Drive permission, stores tokens in encrypted form, limits users to a maximum of 4 connected Drive accounts, and provides a 3-Day Backup feature if one Drive account is disconnected.
              </p>
            </div>
            <div className="border-l-4 border-[#2563EB] pl-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">A Dashboard, Not a Replacement</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                CasaNest does not replace Google Drive. CasaNest acts as a connector dashboard that makes multiple Google Drive accounts feel like one larger and easier-to-use storage system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 2. PROBLEM SECTION
// ==========================================
export function ProblemSection() {
  const problems = [
    {
      title: "Storage runs out quickly",
      desc: "One Google Drive account has limited storage, so users often need more space."
    },
    {
      title: "Files become scattered",
      desc: "When files are spread across many Drive accounts, they become harder to find and organize."
    },
    {
      title: "Switching accounts is annoying",
      desc: "Users need to open different Google accounts just to manage files."
    },
    {
      title: "Storage needs one dashboard",
      desc: "CasaNest brings multiple connected Drives into one place."
    }
  ]

  return (
    <section id="problems" className="py-16 md:py-24 bg-[#F8FAFC] text-left border-y border-[#E5E7EB] scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
            Why CasaNest Was Created
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Why CasaNest was created
          </h2>
          <p className="mt-4 text-base text-[#475569] leading-relaxed font-medium">
            Google Drive is useful, but free storage can run out quickly. Many users solve this by creating more Drive accounts. The problem is that files become separated, storage becomes harder to track, and users need to switch accounts repeatedly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {problems.map((item, index) => (
            <div 
              key={index}
              className="bg-white border border-[#E2E8F0] p-6 rounded-[24px] shadow-sm flex items-start gap-4 transition-all hover:border-blue-200"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A] mb-1 text-base">{item.title}</h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 3. HOW IT WORKS SECTION
// ==========================================
export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Create a CasaNest account",
      desc: "Register and log in to your CasaNest workspace."
    },
    {
      step: "02",
      title: "Connect Google Drive accounts",
      desc: "Add up to 4 Google Drive accounts to increase your usable storage pool."
    },
    {
      step: "03",
      title: "Upload and organize files",
      desc: "Upload files, create folders, rename items, preview files, and manage your connected Drives from one dashboard."
    },
    {
      step: "04",
      title: "Use storage more flexibly",
      desc: "CasaNest helps you organize files across connected Drive accounts without switching Google accounts manually."
    },
    {
      step: "05",
      title: "Recover disconnected records",
      desc: "If a Drive is disconnected, CasaNest keeps the related dashboard records recoverable for 3 days."
    }
  ]

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white text-left scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            Workflow Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            How CasaNest works
          </h2>
          <p className="mt-4 text-base text-[#475569] leading-relaxed font-medium">
            Follow our roadmap to unify and expand your cloud storage workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((item, index) => (
            <div 
              key={index}
              className="relative overflow-hidden bg-white p-6 border border-[#E2E8F0] rounded-[24px] shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-[#CBD5E1] transition-all duration-300 flex flex-col justify-between min-h-[260px] group"
            >
              <span className="absolute right-6 top-4 text-slate-100 font-extrabold text-6xl select-none pointer-events-none transition-colors group-hover:text-blue-50">
                {item.step}
              </span>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[9px] font-bold uppercase tracking-wider mb-8 w-fit border border-blue-100">
                  Step {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-[11px] text-[#475569] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 4. SECURITY SECTION
// ==========================================
export function WhyItIsSafeSection() {
  const securityItems = [
    {
      title: "Limited Google Drive permission",
      desc: "CasaNest uses limited Google Drive access for files managed through the app.",
      icon: Shield
    },
    {
      title: "Encrypted tokens",
      desc: "Google OAuth tokens are encrypted before being stored.",
      icon: Lock
    },
    {
      title: "User isolation",
      desc: "Each connected Drive, file, and folder belongs to the correct CasaNest user.",
      icon: UserCheck
    },
    {
      title: "One Drive, one CasaNest user",
      desc: "The same Google Drive account cannot be linked to multiple CasaNest users.",
      icon: Layers
    },
    {
      title: "Files stay in Google Drive",
      desc: "CasaNest organizes access, but the real files remain inside Google Drive.",
      icon: Cloud
    }
  ]

  return (
    <section id="security" className="py-16 md:py-24 bg-[#F8FAFC] border-y border-[#E5E7EB] text-left scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            Security & Trust
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Designed to stay safe
          </h2>
          <p className="mt-4 text-base text-[#475569] leading-relaxed font-medium">
            CasaNest is built as a connector dashboard, not a replacement for Google Drive. Your real files remain inside your connected Google Drive accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {securityItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div 
                key={index}
                className="relative p-8 rounded-[24px] bg-[#0F172A] border border-[#1E293B] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left flex flex-col justify-between min-h-[220px] group"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 mb-6 border border-white/10">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 5. 3-DAY BACKUP SECTION
// ==========================================
export function RecoveryBackupSection() {
  return (
    <section id="recovery" className="py-16 bg-white text-left scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="bg-white rounded-[28px] border border-[#E2E8F0] p-8 md:p-12 shadow-sm flex flex-col lg:flex-row items-stretch justify-between gap-8">
          <div className="flex-1 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
              3-Day Backup
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Disconnected Drive? You still have 3 days.
            </h2>
            <p className="text-sm sm:text-base text-[#475569] mt-3 leading-relaxed font-medium">
              If a connected Google Drive account is removed from CasaNest, its related dashboard records move to Recovery & Backup for 3 days. Reconnect the same Google account within that period to restore the records.
            </p>

            <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs sm:text-sm text-[#475569] font-medium">
              <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <p>
                <strong>Important note:</strong> CasaNest does not delete the real files from Google Drive during metadata cleanup.
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-center w-full lg:w-64">
            <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <RotateCcw className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
            </div>
            <span className="font-bold text-lg text-[#0F172A] block">3-Day Backup</span>
            <span className="text-xs text-[#2563EB] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-50 border border-blue-100">
              Buffer Active
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==========================================
// 6. FEATURES SECTION
// ==========================================
export function DashboardFeaturesSection() {
  const featuresList = [
    { title: "Connect multiple Google Drive accounts", desc: "Link and sync from one centralized storage space.", icon: Layers },
    { title: "Manage up to 4 Drive accounts per user", desc: "Easily integrate several storage allocations under one profile.", icon: LayoutDashboard },
    { title: "Upload files", desc: "Stream uploads directly into Google Drive without local caching.", icon: Upload },
    { title: "Create folders", desc: "Build virtual directory structures in your unified dashboard.", icon: FolderPlus },
    { title: "Rename and organize files", desc: "Update titles, reorganize layout hierarchies, and move files.", icon: Edit3 },
    { title: "Preview and download files", desc: "View documents, images, and download assets seamlessly.", icon: Download },
    { title: "View connected storage in one dashboard", desc: "Instantly see the combined storage stats across your accounts.", icon: LayoutDashboard },
    { title: "Recover disconnected Drive records within 3 days", desc: "Unlink accounts without fearing immediate database record loss.", icon: RotateCcw },
  ]

  return (
    <section id="features" className="py-16 md:py-24 bg-[#F8FAFC] border-y border-[#E5E7EB] text-left scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4">
            What You Can Do
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            What you can do with CasaNest
          </h2>
          <p className="mt-4 text-base text-[#475569] leading-relaxed font-medium">
            Take full control of scattered storage resources with our core feature system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((item, index) => {
            const Icon = item.icon
            return (
              <div 
                key={index} 
                className="bg-white p-6 border border-[#E2E8F0] rounded-[24px] shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.03)] hover:border-[#CBD5E1] transition-all duration-300 text-left flex flex-col justify-between min-h-[170px]"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB] mb-4 border border-blue-100/50">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-[11px] sm:text-xs text-[#475569] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

