import { LandingNavbar } from "@/components/landing/LandingNavbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingDashboardPreview } from "@/components/landing/LandingDashboardPreview"
import { LandingFeatureCards } from "@/components/landing/LandingFeatureCards"
import { useNavigate } from "react-router-dom"

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-white text-[#0D1117] selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden">
      {/* HERO SECTION WITH CLOUD BACKGROUND */}
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

      {/* INTERACTIVE DASHBOARD PREVIEW */}
      <section className="relative z-20 -mt-28 bg-white px-4 pb-24">
        <div className="mobile-preview-frame">
          <div className="mobile-preview-inner">
            <div className="rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden">
              <LandingDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES, SECURITY, AND RECOVERY CARDS */}
      <section className="bg-white relative z-10">
        <LandingFeatureCards />
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-2.5">
            <a href="#" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white">
                <img src="/brand/logos.png" alt="CasaNest Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-bold text-[#0D1117] tracking-tight text-base">CasaNest Cloud Gateway</span>
            </a>
            <p className="text-xs text-[#475569] font-medium max-w-sm">
              Secure storage nest for your connected drives. Zero-Knowledge integration system for premium cloud architectures.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs font-semibold text-[#475569]">
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy") }} className="hover:text-[#2563EB] transition-colors">Privacy Policy</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms") }} className="hover:text-[#2563EB] transition-colors">Terms of Service</a>
            <a href="/data-deletion" onClick={(e) => { e.preventDefault(); navigate("/data-deletion") }} className="hover:text-[#2563EB] transition-colors">Data Deletion</a>
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login") }} className="hover:text-[#2563EB] transition-colors">Login</a>
            <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register") }} className="hover:text-[#2563EB] transition-colors">Register</a>
          </div>

          {/* Copy Note */}
          <p className="text-[10px] text-[#475569]/60 font-medium">
            &copy; {new Date().getFullYear()} CasaNest Ltd. All rights reserved.
          </p>

        </div>
      </footer>
    </main>
  )
}
