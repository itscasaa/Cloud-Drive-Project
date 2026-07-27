import { useEffect, useState } from "react"
import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { 
  ProductIntroSection,
  ProblemSection,
  HowItWorksSection,
  WhyItIsSafeSection,
  RecoveryBackupSection,
  DashboardFeaturesSection
} from "@/components/landing/LandingFeatureCards"
import { TrustLogoMarquee } from "@/components/landing/TrustLogoMarquee"
import { useNavigate, Link } from "react-router-dom"
import { getStoredUser, type AuthUser } from "@/lib/auth"
import { BrandLogo } from "@/components/drive/BrandLogo"
import Lenis from "lenis"

export function LandingPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

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
    <main className="min-h-screen bg-white text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden">
      
      {/* 1. HERO SECTION WITH CLOUD BACKGROUND */}
      <section className="relative min-h-[640px] md:min-h-[720px] overflow-hidden bg-[#EAF5FF]">
        <img
          src="/images/cloud-hero.png"
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover object-top"
        />

        {/* Ambient radial-gradient / linear-gradient overlay */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_42%),linear-gradient(180deg,rgba(239,246,255,0.35)_0%,rgba(255,255,255,0.85)_92%,#FFFFFF_100%)] pointer-events-none" />

        {/* Bottom soft white fade overlay */}
        <div className="absolute bottom-0 inset-x-0 z-0 h-[240px] bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none" />

        <LandingNavbar />
        <LandingHero />
      </section>

      {/* 2. PROBLEM SECTION */}
      <ProblemSection />

      {/* 3. SOLUTION SECTION */}
      <ProductIntroSection />

      {/* 4. HOW IT WORKS SECTION */}
      <HowItWorksSection />

      {/* 5. FEATURE SECTION */}
      <DashboardFeaturesSection />

      {/* 6. SECURITY SECTION */}
      <WhyItIsSafeSection />

      {/* 7. 3-DAY BACKUP SECTION */}
      <RecoveryBackupSection />

      {/* 8. ICON MARQUEE SECTION */}
      <TrustLogoMarquee />

      {/* 9. FINAL CTA SECTION */}
      <section className="bg-[#EAF5FF] bg-gradient-to-b from-[#EAF5FF]/30 to-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-[#E5E7EB] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-[#0F172A] sm:text-4xl tracking-tight mb-4">
            Need more Google Drive space without messy account switching?
          </h2>
          <p className="text-base sm:text-lg text-[#475569] max-w-xl mx-auto mb-8 font-medium">
            Connect multiple Google Drive accounts to CasaNest and manage them from one secure dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] pt-16 pb-12 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Grid */}
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 gap-x-6 pb-12 border-b border-[#E2E8F0]">
            
            {/* Column 1: Brand Info */}
            <div className="col-span-2 md:col-span-4 flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-3 w-fit group">
                <BrandLogo transparentBg className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-105" logoClassName="h-16 w-16 brightness-0" />
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-[#0D1117] group-hover:text-[#2563EB] tracking-tight text-base transition-colors">CasaNest</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Secure Gateway</span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium max-w-sm">
                Secure storage nest for your connected drives.
              </p>
              
              {/* System Status Alert */}
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                All systems operational
              </div>
            </div>

            {/* Column 2: Product Features */}
            <div className="col-span-1 md:col-span-2 md:col-start-6 flex flex-col gap-4">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Features</span>
              <ul className="space-y-2.5 text-sm font-semibold text-[#475569]">
                <li><Link to="/features" className="hover:text-[#2563EB] transition-colors">Storage Gateway</Link></li>
                <li><Link to="/features" className="hover:text-[#2563EB] transition-colors">Continuous Sync</Link></li>
                <li><Link to="/about-security" className="hover:text-[#2563EB] transition-colors">Security</Link></li>
                <li><Link to="/about-recovery" className="hover:text-[#2563EB] transition-colors">3-Day Backup</Link></li>
              </ul>
            </div>

            {/* Column 3: Privacy & Security */}
            <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Security & Trust</span>
              <ul className="space-y-2.5 text-sm font-semibold text-[#475569]">
                <li>
                  <Link to="/privacy" className="hover:text-[#2563EB] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#2563EB] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/data-deletion" className="hover:text-[#2563EB] transition-colors">
                    Data Deletion Instructions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Access */}
            <div className="col-span-2 sm:col-span-1 md:col-span-2 flex flex-col gap-4">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Gateway Connect</span>
              <ul className="flex flex-row sm:flex-col gap-x-6 gap-y-2.5 sm:space-y-2.5 text-sm font-semibold text-[#475569] flex-wrap">
                <li>
                  <Link to="/login" className="hover:text-[#2563EB] transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#2563EB] transition-colors">
                    Register
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar: Copyright and Small Print */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs font-semibold text-slate-400">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} CasaNest Ltd. All rights reserved.
            </p>
            <p className="font-medium text-[10px] text-slate-400/60 uppercase tracking-widest">
              Secure nesting technology
            </p>
          </div>

        </div>
      </footer>
    </main>
  )
}
