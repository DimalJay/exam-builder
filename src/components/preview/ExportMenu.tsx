import {
  ChevronDown,
  Download,
  FileCode2,
  FileJson2,
  FileText,
  Loader2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import type { ExamDocument } from '@/domain/exam'
import {
  downloadJson,
  downloadPdf,
  downloadText,
  fileStem,
} from '@/typst/download'
import type { PdfExportResult } from '@/typst/useTypstPreview'

/** How long the confirmation stays before the button returns to idle. */
const CONFIRM_MS = 2500

/** How long a failure message stays before it clears itself. */
const ERROR_MS = 6000

/** How far below the trigger the menu drops. */
const MENU_GAP_PX = 6

interface ExportMenuProps {
  /** Compiles the current document to PDF. Never rejects; see `PdfExportResult`. */
  exportPdf: () => Promise<PdfExportResult>
  /** Paper title, used to name the downloaded file. */
  title: string
  /** The document itself, serialised for the JSON export. */
  examDocument: ExamDocument
  /** The Typst source, saved verbatim for the `.typ` export. */
  source: string
  /** Blocks the PDF item (inherited from the preview's error state). The JSON
   *  and source items stay enabled -- neither needs the compiler. */
  pdfDisabled?: boolean
}

type Phase = 'idle' | 'working' | 'done'

type ExportKind = 'pdf' | 'typst' | 'json'

/**
 * Exports the paper in one of three formats:
 *
 * - **PDF** — rendered by the Typst engine (the same compile the preview runs).
 * - **Typst source (.typ)** — the exact markup `buildTypstSource` produces, so
 *   a paper can be reopened in the Typst toolchain.
 * - **Document JSON (.json)** — the `ExamDocument` object, re-importable here
 *   via the header's Import button.
 *
 * The dropdown is portalled to `document.body` rather than laid out in place:
 * the preview sheet's zoom scaler applies a `transform` to the next page, and a
 * transformed subtree is its own stacking context, so an in-place absolute menu
 * would paint *under* the white canvas and swallow every click. Portalling
 * lifts the menu out of the preview pane entirely.
 */
export function ExportMenu({
  exportPdf,
  title,
  examDocument,
  source,
  pdfDisabled = false,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const triggerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const top = rect.bottom + MENU_GAP_PX
      const right = window.innerWidth - rect.right
      setMenuPos({
        top,
        right: Math.max(right, 0),
      })
    }
    setOpen((value) => !value)
  }, [])

  // Clicking anywhere but the trigger or the menu closes it; Escape does too,
  // and so does scrolling or resizing (the menu is fixed, not tracked).
  useEffect(() => {
    if (!open) return

    const close = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnLayout = () => setOpen(false)

    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', closeOnLayout)
    window.addEventListener('scroll', closeOnLayout, true)

    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', closeOnLayout)
      window.removeEventListener('scroll', closeOnLayout, true)
    }
  }, [open])

  const handlePdf = useCallback(async () => {
    setOpen(false)
    setPhase('working')
    setError(null)

    const result = await exportPdf()

    if (!mountedRef.current) return

    if (!result.ok) {
      setPhase('idle')
      setError(result.message)
      return
    }

    try {
      downloadPdf(result.pdf, `${fileStem(title)}.pdf`)
      setPhase('done')
    } catch {
      setPhase('idle')
      setError('The browser blocked the download.')
    }
  }, [exportPdf, title])

  const handleFile = useCallback(
    (kind: Exclude<ExportKind, 'pdf'>) => {
      setOpen(false)
      setError(null)

      const stem = fileStem(title)
      try {
        if (kind === 'json') {
          downloadJson(examDocument, `${stem}.json`)
        } else {
          downloadText(source, `${stem}.typ`)
        }
        setPhase('done')
      } catch {
        setError('The browser blocked the download.')
      }
    },
    [examDocument, source, title],
  )

  // Let both transient states expire on their own: a "Saved" label that sticks
  // forever reads as a stuck button, and an error the user has already fixed
  // keeps nagging in the toolbar.
  useEffect(() => {
    if (phase !== 'done') return
    const timeout = window.setTimeout(() => setPhase('idle'), CONFIRM_MS)
    return () => window.clearTimeout(timeout)
  }, [phase])

  useEffect(() => {
    if (error === null) return
    const timeout = window.setTimeout(() => setError(null), ERROR_MS)
    return () => window.clearTimeout(timeout)
  }, [error])

  const menu = open && menuPos ? (
    <div
      ref={menuRef}
      role="menu"
      data-slot="export-menu"
      style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
      className="z-[9999] w-64 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
    >
      <button
        type="button"
        role="menuitem"
        disabled={pdfDisabled}
        onClick={() => void handlePdf()}
        className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileText className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <span className="pointer-events-none block">
          <span className="block font-medium text-foreground">
            Print-ready PDF (.pdf)
          </span>
          <span className="block text-xs text-muted-foreground">
            Compiled by the Typst engine
          </span>
        </span>
      </button>

      <div className="mx-2 my-1 h-px bg-border" />

      <button
        type="button"
        role="menuitem"
        onClick={() => handleFile('typst')}
        className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
      >
        <FileCode2 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <span className="pointer-events-none block">
          <span className="block font-medium text-foreground">
            Typst source (.typ)
          </span>
          <span className="block text-xs text-muted-foreground">
            The exact markup of this paper
          </span>
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => handleFile('json')}
        className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
      >
        <FileJson2 className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <span className="pointer-events-none block">
          <span className="block font-medium text-foreground">
            Exam JSON (.json)
          </span>
          <span className="block text-xs text-muted-foreground">
            Re-importable via the Import button
          </span>
        </span>
      </button>
    </div>
  ) : null

  if (error !== null) {
    return (
      <span
        role="alert"
        className="max-w-56 truncate text-xs text-destructive"
        title={error}
      >
        {error}
      </span>
    )
  }

  return (
    <>
      <div ref={triggerRef} className="relative inline-flex">
        <Button
          type="button"
          size="sm"
          disabled={phase === 'working'}
          onClick={openMenu}
          title="Export the paper as PDF, Typst source or JSON"
          aria-haspopup="menu"
          aria-expanded={open}
          className="gap-1.5 bg-indigo-600 font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
        >
          {phase === 'working' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {phase === 'working' ? (
            'Exporting…'
          ) : phase === 'done' ? (
            'Downloaded'
          ) : (
            'Export'
          )}
          <ChevronDown
            className={`size-3 text-white/70 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </Button>
      </div>

      {/* The label alone conveys nothing to a screen reader; this does. */}
      <span role="status" className="sr-only">
        {phase === 'working'
          ? 'Exporting paper'
          : phase === 'done'
            ? 'Export downloaded'
            : ''}
      </span>

      {createPortal(menu, document.body)}
    </>
  )
}