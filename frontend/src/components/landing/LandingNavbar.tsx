import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { getStoredUser, type AuthUser } from "@/lib/auth"
import { BrandLogo } from "@/components/drive/BrandLogo"

export function LandingNavbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())

    const trigger = document.getElementById("nav-scroll-trigger")
    if (!trigger) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: [0] }
    )

    observer.observe(trigger)
    return () => observer.disconnect()
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <div id="nav-scroll-trigger" className="absolute top-0 left-0 w-full h-px pointer-events-none" />
      <header 
        className={`fixed left-1/2 -translate-x-1/2 w-[92%] max-w-7xl z-50 transition-all duration-300 ${
          isMobileMenuOpen
            ? "top-3 bg-white border border-slate-200/80 shadow-xl rounded-2xl py-4"
            : isScrolled 
              ? "top-4 bg-white/90 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_32px_rgba(15,23,42,0.08)] py-3 rounded-full"
              : "top-6 bg-white/40 backdrop-blur-md border border-slate-200/30 py-4.5 rounded-full"
        }`}
      >
        <div className="w-full px-6 sm:px-8 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <BrandLogo transparentBg className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[2deg]" logoClassName="h-16 w-16 brightness-0" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base leading-none tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition-colors duration-200">CasaNest</span>
              <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-[0.12em] mt-0.5">Secure Gateway</span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/features" className="text-[13px] font-semibold text-[#475569] hover:text-[#2563EB] px-3.5 py-2 rounded-full hover:bg-[#2563EB]/5 transition-all duration-200">Features</Link>
            <Link to="/about-security" className="text-[13px] font-semibold text-[#475569] hover:text-[#2563EB] px-3.5 py-2 rounded-full hover:bg-[#2563EB]/5 transition-all duration-200">Security</Link>
            <Link to="/about-recovery" className="text-[13px] font-semibold text-[#475569] hover:text-[#2563EB] px-3.5 py-2 rounded-full hover:bg-[#2563EB]/5 transition-all duration-200">3-Day Backup</Link>
            <Link to="/pricing" className="text-[13px] font-semibold text-[#475569] hover:text-[#2563EB] px-3.5 py-2 rounded-full hover:bg-[#2563EB]/5 transition-all duration-200 flex items-center gap-1.5">
              Pricing
              <span className="px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[9px] font-bold border border-[#2563EB]/15">Free</span>
            </Link>
          </nav>

          {/* Right Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => navigate("/dashboard")}
                className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 duration-200 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate("/login")}
                  className="text-sm font-bold text-[#475569] hover:text-[#0F172A] px-4 py-2 transition-colors hover:bg-slate-100/50 rounded-full"
                >
                  Log In
                </button>
                <button 
                  onClick={() => navigate("/register")}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 duration-200 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Connect Drive</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={toggleMobileMenu} 
            className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 px-2 flex flex-col gap-4">
            <Link to="/features" onClick={toggleMobileMenu} className="text-base font-bold text-[#475569] py-2 border-b border-[#E5E7EB]/50 px-2 hover:text-[#2563EB]">Features</Link>
            <Link to="/about-security" onClick={toggleMobileMenu} className="text-base font-bold text-[#475569] py-2 border-b border-[#E5E7EB]/50 px-2 hover:text-[#2563EB]">Security</Link>
            <Link to="/about-recovery" onClick={toggleMobileMenu} className="text-base font-bold text-[#475569] py-2 border-b border-[#E5E7EB]/50 px-2 hover:text-[#2563EB]">3-Day Backup</Link>
            <Link to="/pricing" onClick={toggleMobileMenu} className="text-base font-bold text-[#475569] py-2 px-2 hover:text-[#2563EB]">Pricing</Link>
            <hr className="border-[#E5E7EB]" />
            <div className="flex flex-col gap-3">
              {user ? (
                <button 
                  onClick={() => { toggleMobileMenu(); navigate("/dashboard") }}
                  className="bg-[#2563EB] text-white text-center font-bold py-3 rounded-full shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { toggleMobileMenu(); navigate("/login") }}
                    className="text-center font-bold text-[#475569] py-2 rounded-xl hover:bg-black/5 transition-colors"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={() => { toggleMobileMenu(); navigate("/register") }}
                    className="bg-[#2563EB] text-white text-center font-bold py-3 rounded-full shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Connect Drive</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}

