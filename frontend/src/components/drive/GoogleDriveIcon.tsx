import { cn } from '@/lib/utils'

/** Official-style Google Drive triangle logo (multi-color brand mark). */
export function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 87.3 78"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#0066DA"
        d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
      />
      <path
        fill="#00AC47"
        d="M43.65 25L29.9 1.2C28.5 1.95 27.35 3.05 26.55 4.45L1.2 48.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
      />
      <path
        fill="#EA4335"
        d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.85 11.5z"
      />
      <path
        fill="#00832D"
        d="M43.65 25L57.4 1.2C56 0.4 54.4 0 52.8 0H34.5c-1.6 0-3.2.4-4.6 1.2z"
      />
      <path
        fill="#2684FC"
        d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
      />
      <path
        fill="#FFBA00"
        d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z"
      />
    </svg>
  )
}
