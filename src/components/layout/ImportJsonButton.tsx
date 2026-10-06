import { Loader2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useExamDispatch } from '@/state/useExam'
import { parseDocument } from '@/state/storage'

/** How long the confirmation stays before the button returns to idle. */
const CONFIRM_MS = 2500

/** How long a failure message stays before it clears itself. */
const ERROR_MS = 6000

type Phase = 'idle' | 'working' | 'done'

/**
 * Loads an exam document from a JSON file exported by the app.
 *
 * A hidden `<input type="file">` keeps the OS file picker while the visible
 * control stays a plain button. The file is parsed and defensively defaulted
 * through the same `parseDocument` path the localStorage loader uses, then
 * replaces the document with a single `document/load` action -- so an import
 * behaves exactly like switching to a preset template, autosave included.
 */
export function ImportJsonButton() {
  const dispatch = useExamDispatch()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      setPhase('working')
      setError(null)

      // `parseDocument` swallows JSON syntax errors and returns `null` on any
      // non-document shape; `.catch(() => null)` covers read failures.
      const parsed = await file.text().then(parseDocument).catch(() => null)

      if (!mountedRef.current) return

      if (!parsed) {
        setPhase('idle')
        setError('That file is not a valid exam document.')
        return
      }

      dispatch({ type: 'document/load', document: parsed })
      setPhase('done')
    },
    [dispatch],
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
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          // Reset the input so choosing the very same file again re-triggers.
          event.target.value = ''
        }}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={phase === 'working'}
        onClick={() => inputRef.current?.click()}
        title="Load a previously exported exam JSON file"
        className="gap-1.5 text-foreground font-medium"
      >
        {phase === 'working' ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {phase === 'working' ? 'Importing…' : phase === 'done' ? 'Imported' : 'Import'}
      </Button>
    </>
  )
}