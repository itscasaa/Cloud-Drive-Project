import { cn } from '@/lib/utils'

export function BrandLogo({ 
  className, 
  logoClassName = 'h-14 w-14' 
}: { 
  className?: string; 
  logoClassName?: string 
}) {
  return (
    <div className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200', className)}>
      <img src="/brand/logos.png" alt="CasaNest logo" className={cn('absolute max-w-none object-contain', logoClassName)} />
    </div>
  )
}
