import { cn } from '@/lib/utils'

export function BrandLogo({
  className,
  logoClassName = 'h-14 w-14',
  transparentBg = false,
}: {
  className?: string
  logoClassName?: string
  transparentBg?: boolean
}) {
  if (transparentBg) {
    return (
      <div className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center', className)}>
        <img
          src="/brand/logos.png"
          alt="CasaNest logo"
          className={cn(
            'absolute max-w-none object-contain drop-shadow-[0_1px_2px_rgba(15,23,42,0.35)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]',
            logoClassName,
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 ring-1 ring-blue-500/20 dark:bg-blue-500 dark:shadow-blue-950/50 dark:ring-blue-300/20',
        className,
      )}
    >
      {/* Logo asset is light — keep solid blue plate so it stays visible in dark mode */}
      <img
        src="/brand/logos.png"
        alt="CasaNest logo"
        className={cn('absolute max-w-none object-contain drop-shadow-sm', logoClassName)}
      />
    </div>
  )
}
