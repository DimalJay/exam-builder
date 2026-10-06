import { Download, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { downloadPdf, pdfFileName } from '@/typst/download'
import type { PdfExportResult } from '@/typst/useTypstPreview'

/** How long the confirmation stays before the button returns to idle. */
const CONFIRM_MS = 2500

/** How long a failure message stays before it clears itself. */
const ERROR_MS = 6000

interface ExportPdfButtonProps {
  /** Compiles the current document. Never rejects; see `PdfExportResult`. */
  exportPdf: () => Promise<PdfExportResult>
  /** Paper title, used to name the downloaded file. */
  title: string
  /** Disabled while the preview cannot produce a paper. */
  disabled?: boolean
}

type Phase = 'idle' | 'working' | 'done'

/**
 * Exports the paper as a PDF.
 *
 * Owns its in-flight and result state rather than lifting it, so the export
 * lifecycle stays next to the one control that triggers it. Two guards keep it
 * honest: an unmount mid-export cannot fire a state update, and a transient
 * failure never leaves a stale complaint on screen while the user keeps typing.
 */
export function ExportPdfButton({
  exportPdf,
  title,
  disabled = false,
}: ExportPdfButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleClick = useCallback(async () => {
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
      downloadPdf(result.pdf, pdfFileName(title))
      setPhase('done')
    } catch {
      // The bytes were produced but the browser refused them; almost always a
      // download blocked because it was no longer tied to a user gesture.
      setPhase('idle')
      setError('The browser blocked the download.')
    }
  }, [exportPdf, title])

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
    <Button
      type="button"
      size="sm"
      disabled={disabled || phase === 'working'}
      onClick={() => void handleClick()}
      title="Download the paper as a print-ready PDF"
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all active:scale-[0.98] gap-1.5"
    >
      {phase === 'working' ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Exporting…
        </>
      ) : phase === 'done' ? (
        <>
          <Download className="size-3.5" />
          Downloaded
        </>
      ) : (
        <>
          <Download className="size-3.5" />
          Export PDF
        </>
      )}
      {/* The label alone conveys nothing to a screen reader; this does. */}
      <span role="status" className="sr-only">
        {phase === 'working'
          ? 'Exporting PDF'
          : phase === 'done'
            ? 'PDF downloaded'
            : ''}
      </span>
    </Button>

  )
}