import React from "react"
import { 
  Lock, 
  RotateCcw, 
  UserCheck, 
  Cloud, 
  Layers
} from "lucide-react"
import { SiGoogledrive } from "react-icons/si"

interface MarqueeItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isBrand?: boolean
}

const marqueeItems: MarqueeItem[] = [
  {
    id: "google-drive",
    label: "Google Drive",
    icon: SiGoogledrive,
    isBrand: true,
  },
  {
    id: "drive-1",
    label: "Drive 1",
    icon: SiGoogledrive,
    isBrand: true,
  },
  {
    id: "drive-2",
    label: "Drive 2",
    icon: SiGoogledrive,
    isBrand: true,
  },
  {
    id: "drive-3",
    label: "Drive 3",
    icon: SiGoogledrive,
    isBrand: true,
  },
  {
    id: "drive-4",
    label: "Drive 4",
    icon: SiGoogledrive,
    isBrand: true,
  },
  {
    id: "unified-storage",
    label: "Unified Storage",
    icon: Layers,
  },
  {
    id: "encrypted-tokens",
    label: "Encrypted Tokens",
    icon: Lock,
  },
  {
    id: "3-day-backup",
    label: "3-Day Backup",
    icon: RotateCcw,
  },
  {
    id: "user-isolation",
    label: "User Isolation",
    icon: UserCheck,
  },
  {
    id: "files-stay-in-drive",
    label: "Files Stay in Drive",
    icon: Cloud,
  },
]

export function TrustLogoMarquee() {
  const doubledItems = [...marqueeItems, ...marqueeItems, ...marqueeItems]

  return (
    <section className="border-y border-[#E5E7EB] bg-white overflow-hidden relative z-20 pointer-events-none select-none">
      <div 
        className="relative flex overflow-hidden py-6 md:py-8"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="marquee-track flex min-w-max items-center gap-6 md:gap-8 pr-6 md:pr-8 pointer-events-auto select-auto">
          {doubledItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={`${item.id}-${index}`}
                className="inline-flex items-center gap-2.5 md:gap-3 px-4.5 py-2.5 md:px-6 md:py-3 bg-white border border-[#E2E8F0] rounded-full shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[border-color,box-shadow] duration-200 hover:border-[#CBD5E1] hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-default"
              >
                <Icon 
                  className={`w-5 h-5 shrink-0 ${
                    item.isBrand ? "text-[#1A73E8]" : "text-[#2563EB]"
                  }`} 
                />
                <span className="text-xs md:text-sm font-semibold text-[#334155] select-none whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
