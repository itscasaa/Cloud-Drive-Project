import { useEffect, useId, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  GitCommitHorizontal,
  Loader2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UpdateLogEntry, UpdateLogKind } from '@/data/update-logs'
import { formatDate } from '@/lib/api'
import { cn } from '@/lib/utils'

const KIND_META: Record<
  UpdateLogKind,
  { label: string; icon: typeof Sparkles; chip: string; dot: string }
> = {
  feature: {
    label: 'New',
    icon: Sparkles,
    chip: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900',
    dot: 'bg-blue-600',
  },
  improvement: {
    label: 'Improved',
    icon: Wrench,
    chip: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
    dot: 'bg-sky-500',
  },
  fix: {
    label: 'Fix',
    icon: Wrench,
    chip: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900',
    dot: 'bg-amber-500',
  },
  security: {
    label: 'Security',
    icon: ShieldCheck,
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
  },
  notice: {
    label: 'Notice',
    icon: Megaphone,
    chip: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    dot: 'bg-slate-400',
  },
}

function relativeDay(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return formatDate(iso)
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(iso)
}

function UpdateLogRow({ entry, isNew }: { entry: UpdateLogEntry; isNew: boolean }) {
  const meta = KIND_META[entry.kind]
  const Icon = entry.source === 'github' ? GitCommitHorizontal : meta.icon

  const body = (
    <div
      className={cn(
        'group relative rounded-2xl border p-3.5 transition sm:p-4',
        isNew
          ? 'border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-white shadow-sm dark:border-blue-900/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/70',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800',
            isNew && 'border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50',
          )}
        >
          <Icon className={cn('h-4 w-4', isNew ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-300')} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ring-1 ring-inset', meta.chip)}>
              {meta.label}
            </span>
            {entry.version ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                v{entry.version}
              </span>
            ) : null}
            {isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm shadow-blue-600/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                New
              </span>
            ) : null}
            <span className="ml-auto text-[11px] font-bold text-slate-400 dark:text-slate-500">{relativeDay(entry.date)}</span>
          </div>

          <p className="mt-1.5 text-sm font-extrabold leading-snug text-slate-950 dark:text-slate-50">{entry.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">{entry.summary}</p>

          {entry.highlights?.length ? (
            <ul className="mt-2.5 space-y-1.5">
              {entry.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:text-xs">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
                  <span className="min-w-0 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {entry.href ? (
            <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              View details
              <ExternalLink className="h-3 w-3 opacity-70 transition group-hover:translate-x-0.5" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (entry.href) {
    return (
      <a href={entry.href} target="_blank" rel="noreferrer" className="block outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500">
        {body}
      </a>
    )
  }

  return body
}

export function UpdateLogsPanel({
  open,
  onClose,
  entries,
  loading,
  error,
  unseenCount,
  onMarkAllRead,
}: {
  open: boolean
  onClose: () => void
  entries: UpdateLogEntry[]
  loading: boolean
  error: string
  unseenCount: number
  onMarkAllRead: () => void
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const seenCutoffId = useMemo(() => {
    if (unseenCount <= 0) return null
    return entries[unseenCount - 1]?.id ?? null
  }, [entries, unseenCount])

  useEffect(() => {
    if (!open) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    // Lock body scroll on mobile sheet only; desktop dropdown keeps page scroll.
    const isMobileSheet = window.matchMedia('(max-width: 639px)').matches
    if (isMobileSheet) document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', onKey)
    // Focus panel for a11y without stealing focus from unrelated UI when closed.
    panelRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Mobile/tablet backdrop — full-screen sheet pattern */}
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] dark:bg-black/65 sm:hidden"
        aria-label="Close update logs"
        onClick={onClose}
      />

      {/* Desktop/tablet click-away under panel but above page content */}
      <button
        type="button"
        className="fixed inset-0 z-[55] hidden sm:block"
        aria-label="Close update logs"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'z-[80] flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 outline-none dark:border-slate-700 dark:bg-slate-950 dark:shadow-black/50',
          // Mobile: bottom sheet
          'fixed inset-x-0 bottom-0 max-h-[min(88vh,40rem)] rounded-t-3xl',
          // Tablet+: anchored dropdown near header bell
          'sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:max-h-[min(32rem,70vh)] sm:w-[min(calc(100vw-2rem),26rem)] sm:rounded-2xl',
          // Wide desktop: slightly wider panel
          'lg:w-[28rem]',
        )}
      >
        {/* Grab handle (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="border-b border-slate-100 px-4 pb-3 pt-2 dark:border-slate-800 sm:px-4 sm:pt-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/25">
              <Megaphone className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[15px]">
                  Update logs
                </h2>
                {unseenCount > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {unseenCount} new
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400 sm:text-xs">
                What&apos;s new in CasaNest — product notes & repo activity
              </p>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Close update logs" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {unseenCount > 0 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-[11px] font-bold text-blue-800 dark:text-blue-200">You have unread updates</p>
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-extrabold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                Mark all read
              </button>
            </div>
          ) : null}
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-3.5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Loading updates…
            </div>
          ) : null}

          {error ? (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {!loading && entries.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No updates yet.</p>
          ) : null}

          <div className="space-y-2.5">
            {entries.map((entry, index) => {
              const isNew = unseenCount > 0 && index < unseenCount
              // Visual divider after last unseen item
              const showDivider = seenCutoffId != null && entry.id === seenCutoffId && index < entries.length - 1
              return (
                <div key={entry.id}>
                  <UpdateLogRow entry={entry} isNew={isNew} />
                  {showDivider ? (
                    <div className="my-3 flex items-center gap-2 px-1">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Earlier</span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">CasaNest product stream</p>
          <a
            href="https://github.com/zenhosta/9drive"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View repository
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </>
  )
}
