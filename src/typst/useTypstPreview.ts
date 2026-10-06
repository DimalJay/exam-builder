import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

import { createBrowserTypstEngine } from './browserEngine'
import type { TypstDiagnostic, TypstEngine } from './engine'
import { getTypstRenderer } from './renderer'

/** Page geometry in points, as reported by Typst. */
export interface PageGeometry {
  width: number
  height: number
}

export type PreviewStatus = 'idle' | 'compiling' | 'ready' | 'error'

export interface PreviewState {
  status: PreviewStatus
  pages: PageGeometry[]
  diagnostics: TypstDiagnostic[]
}

/**
 * Outcome of a PDF export.
 *
 * A discriminated union rather than a rejected promise: a failed export is an
 * expected outcome the UI reports next to the button, not an exception the
 * caller has to remember to catch.
 */
export type PdfExportResult =
  | { ok: true; pdf: Uint8Array }
  | { ok: false; message: string }

/** Debounce so typing does not queue a compile per keystroke. */
const COMPILE_DEBOUNCE_MS = 300

/**
 * A compile slower than this is worth telling the user about. Below it the
 * spinner never appears, so ordinary typing looks instantaneous.
 */
const SLOW_COMPILE_MS = 400

/** Treat a compile that exceeds this as failed rather than hanging forever. */
const COMPILE_TIMEOUT_MS = 20_000

/**
 * Rasterisation scale for the page bitmaps. Two device-independent pixels per
 * Typst point keeps a full A4 page sharp at any pane width while costing less
 * than the library default of three.
 */
const PIXEL_PER_PT = 2

/**
 * Shown once the compiler has overrun the watchdog. The WASM call is still
 * running at that point and the instance is single-use, so the only way back is
 * a page reload.
 */
const WEDGED_MESSAGE =
  'The Typst compiler stopped responding. Reload the page to restart the preview.'

function toDiagnostic(error: unknown): TypstDiagnostic {
  return {
    severity: 'error',
    message:
      error instanceof Error
        ? `Preview failed: ${error.message}`
        : 'Preview failed for an unknown reason.',
    location: '',
  }
}

/**
 * Marks a call that overran the watchdog, as opposed to one that failed
 * outright. The distinction matters: an overrun leaves work running inside
 * WASM, so the pipeline must not start another call.
 */
class CompileTimeout extends Error {
  constructor(ms: number) {
    super(`Typst did not respond within ${ms / 1000}s.`)
    this.name = 'CompileTimeout'
  }
}

/** Reject with {@link CompileTimeout} if `promise` has not settled in `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new CompileTimeout(ms)),
      ms,
    )
    promise.then(
      (value) => {
        window.clearTimeout(timeout)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

/** A PDF export waiting its turn for the compiler. */
interface ExportRequest {
  source: string
  resolve: (result: PdfExportResult) => void
}

/**
 * The message to show when a compile produced no artifact.
 *
 * The first *error* wins over an earlier warning: a warning is usually a font
 * substitution notice that has nothing to do with why the run failed.
 */
function failureMessage(diagnostics: TypstDiagnostic[], fallback: string): string {
  const error = diagnostics.find((d) => d.severity === 'error')
  return error?.message ?? diagnostics[0]?.message ?? fallback
}

/**
 * Owns the compile -> render pipeline and exposes only presentation state.
 *
 * Rendering is delegated to typst.ts's `renderToCanvas`, which owns the DOM it
 * creates inside the host element: it sizes each page bitmap, overlays the
 * text layer and rescales with a CSS transform as the container resizes. Doing
 * that by hand against the lower-level `renderCanvas` is unsupported and
 * panics inside the WASM renderer.
 */
export function useTypstPreview(source: string) {
  /**
   * Element typst.ts renders into. React must never place children inside it:
   * the renderer clears and rebuilds that subtree on every pass.
   */
  const hostRef = useRef<HTMLDivElement | null>(null)

  const engineRef = useRef<TypstEngine | null>(null)
  /** Artifact of the last successful compile, reused by the render pass. */
  const artifactRef = useRef<Uint8Array | null>(null)

  /**
   * Newest source, kept in a ref so `exportPdf` can be a stable callback that
   * still exports what is on screen. Reading the debounced compile instead
   * would silently export the previous revision if the button is clicked
   * immediately after typing.
   */
  const sourceRef = useRef(source)

  const [state, setState] = useState<PreviewState>({
    status: 'idle',
    pages: [],
    diagnostics: [],
  })

  /** True only once a compile has already run longer than SLOW_COMPILE_MS. */
  const [isSlow, setIsSlow] = useState(false)

  /**
   * Bumped when the host resizes. The renderer sizes pages from the container
   * width, so dragging the split pane must trigger another pass or the pages
   * stay at the previous scale.
   */
  const [widthTick, setWidthTick] = useState(0)

  /* --------------------------- single-flight queue -------------------------- */
  /**
   * The Typst compiler is one WASM instance and cannot compile two sources at
   * once. Rather than letting requests overlap, only the most recent source is
   * kept while a compile is in flight, so a burst of typing collapses into a
   * single follow-up compile of the final text.
   */
  const pendingSourceRef = useRef<string | null>(null)
  /**
   * Exports are queued rather than coalesced: each one is an explicit request for
   * a file, so dropping a superseded one would leave the caller awaiting a
   * promise that never settles.
   */
  const pendingExportsRef = useRef<ExportRequest[]>([])
  const inFlightRef = useRef(false)
  /**
   * Latched once a call overruns the watchdog. The WASM call is still running at
   * that point and the compiler is a single instance, so letting a new compile
   * start would run two at once. An overrun means the module is wedged, so the
   * preview stops trying and asks for a reload instead.
   */
  const wedgedRef = useRef(false)

  useEffect(() => {
    sourceRef.current = source
  }, [source])

  /** Compile one source and publish the result. Never rejects. */
  const compileOnce = useCallback(async (next: string) => {
    const slowTimer = window.setTimeout(() => setIsSlow(true), SLOW_COMPILE_MS)

    // Keep the previous pages on screen while recompiling so the preview never
    // blanks out between edits.
    setState((prev) => ({ ...prev, status: 'compiling' }))

    try {
      engineRef.current ??= createBrowserTypstEngine()

      const output = await withTimeout(
        engineRef.current.compile(next),
        COMPILE_TIMEOUT_MS,
      )

      if (!output.artifact) {
        setState((prev) => ({
          status: 'error',
          pages: prev.pages,
          diagnostics: output.diagnostics.length
            ? output.diagnostics
            : [toDiagnostic(new Error('Typst produced no output.'))],
        }))
        return
      }

      artifactRef.current = output.artifact

      // Page geometry needs a session; this one only measures, so it closes
      // as soon as the callback returns.
      const renderer = await getTypstRenderer()
      const pages = await withTimeout(
        renderer.runWithSession(
          { format: 'vector', artifactContent: output.artifact },
          async (session) =>
            session
              .retrievePagesInfo()
              .map(({ width, height }) => ({ width, height })),
        ),
        COMPILE_TIMEOUT_MS,
      )

      setState({ status: 'ready', pages, diagnostics: output.diagnostics })
    } catch (error) {
      // Any failure at all has to land in the error state. Leaving the status
      // on "compiling" is what previously left the preview stuck with no
      // explanation.
      if (error instanceof CompileTimeout) wedgedRef.current = true

      setState((prev) => ({
        status: 'error',
        pages: prev.pages,
        diagnostics: [
          ...(wedgedRef.current
            ? [{ severity: 'error' as const, message: WEDGED_MESSAGE, location: '' }]
            : []),
          toDiagnostic(error),
        ],
      }))
    } finally {
      window.clearTimeout(slowTimer)
      setIsSlow(false)
    }
  }, [])

  /** Compile one export and hand the bytes back. Never rejects. */
  const exportOnce = useCallback(async (request: ExportRequest) => {
    try {
      engineRef.current ??= createBrowserTypstEngine()

      const output = await withTimeout(
        engineRef.current.exportPdf(request.source),
        COMPILE_TIMEOUT_MS,
      )

      if (!output.pdf) {
        request.resolve({
          ok: false,
          message: failureMessage(
            output.diagnostics,
            'Typst produced no PDF.',
          ),
        })
        return
      }

      request.resolve({ ok: true, pdf: output.pdf })
    } catch (error) {
      // An overrun here wedges the compiler exactly as it does for a preview
      // compile, so the preview has to say so rather than quietly freezing on
      // its last rendered pages.
      if (error instanceof CompileTimeout) {
        wedgedRef.current = true
        setState((prev) => ({
          ...prev,
          status: 'error',
          diagnostics: [
            ...prev.diagnostics,
            { severity: 'error', message: WEDGED_MESSAGE, location: '' },
          ],
        }))
      }

      request.resolve({
        ok: false,
        message:
          error instanceof Error ? error.message : 'The export failed.',
      })
    }
  }, [])

  /** Drain the queue, compiling only the latest source each time. */
  const drain = useCallback(async () => {
    // The wedge check drives the exit rather than a `break` after each call: it
    // has to stop the loop on the *next* iteration so that an export which
    // overruns does not get followed by another call into the same WASM module.
    while (!wedgedRef.current) {
      // Exports jump ahead of a queued compile: they are a direct request for a
      // file, while the compile only exists to catch the preview up with the
      // latest text and will be re-issued by the debounce either way.
      const request = pendingExportsRef.current.shift()
      if (request) {
        await exportOnce(request)
        continue
      }

      // Read once into a local, not after an await: narrowing a ref to `null`
      // does not survive a suspension.
      const next = pendingSourceRef.current
      if (next === null) break

      pendingSourceRef.current = null
      await compileOnce(next)
    }

    // Nothing further will run, so any export still waiting has to be failed
    // rather than left hanging on a promise that can never settle.
    if (wedgedRef.current) {
      for (const pending of pendingExportsRef.current.splice(0)) {
        pending.resolve({ ok: false, message: WEDGED_MESSAGE })
      }
    }

    inFlightRef.current = false
  }, [compileOnce, exportOnce])

  const requestCompile = useCallback(
    (next: string) => {
      if (wedgedRef.current) return

      pendingSourceRef.current = next
      if (inFlightRef.current) return

      inFlightRef.current = true
      void drain()
    },
    [drain],
  )

  /**
   * Compile the current document to PDF.
   *
   * Shares the queue with the preview rather than opening a second compiler:
   * the WASM module is a single instance, and a parallel export would either
   * interleave with an in-flight compile or pay to instantiate a second copy.
   */
  const exportPdf = useCallback((): Promise<PdfExportResult> => {
    if (wedgedRef.current) {
      return Promise.resolve({ ok: false, message: WEDGED_MESSAGE })
    }

    return new Promise<PdfExportResult>((resolve) => {
      pendingExportsRef.current.push({ source: sourceRef.current, resolve })

      if (inFlightRef.current) return

      inFlightRef.current = true
      void drain()
    })
  }, [drain])

  /* ------------------------------- compile -------------------------------- */
  useEffect(() => {
    const timeout = window.setTimeout(
      () => requestCompile(source),
      COMPILE_DEBOUNCE_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [source, requestCompile])

  /* ------------------------- re-render on resize ------------------------- */
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Width only. Rendering changes the host's *height* to fit the pages, so
    // reacting to height would make every render trigger the next one forever.
    let lastWidth = host.getBoundingClientRect().width

    // ResizeObserver rather than window resize: dragging the split pane
    // changes the pane width without firing a window resize event.
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? host.clientWidth
      if (Math.abs(width - lastWidth) < 1) return
      lastWidth = width
      setWidthTick((tick) => tick + 1)
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  /* -------------------------------- render ------------------------------- */
  useEffect(() => {
    const host = hostRef.current
    const artifact = artifactRef.current
    if (state.status !== 'ready' || !artifact || !host) return

    let cancelled = false

    void (async () => {
      try {
        const renderer = await getTypstRenderer()
        if (cancelled) return

        await renderer.renderToCanvas({
          container: host,
          format: 'vector',
          artifactContent: artifact,
          pixelPerPt: PIXEL_PER_PT,
          backgroundColor: '#ffffff',
        })
      } catch (error) {
        // A render failure must surface too, otherwise the pages stay blank
        // behind a "ready" badge with no explanation.
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          status: 'error',
          diagnostics: [...prev.diagnostics, toDiagnostic(error)],
        }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state, widthTick])

  return { state, isSlow, hostRef, exportPdf } satisfies {
    state: PreviewState
    isSlow: boolean
    hostRef: RefObject<HTMLDivElement | null>
    exportPdf: () => Promise<PdfExportResult>
  }
}