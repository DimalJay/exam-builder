import { AlertTriangle, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { DiagnosticList } from '@/components/preview/DiagnosticList'
import { ExportPdfButton } from '@/components/preview/ExportPdfButton'
import { Badge } from '@/components/ui/badge'
import { useExamDocument } from '@/state/useExam'
import { buildTypstSource } from '@/typst/generate'
import { useTypstPreview } from '@/typst/useTypstPreview'

/**
 * Live Typst preview.
 *
 * A presentational component: it derives source from the document and hands
 * rendering to `useTypstPreview`, so it holds no Typst logic of its own.
 *
 * The host element is always mounted and the last successful render is left in
 * place while a recompile runs, so the paper stays on screen instead of
 * flashing an empty panel on every keystroke.
 */
export function TypstPreview() {
  const document = useExamDocument()

  // Recomputed only when the document changes, because `document` identity is
  // what drives it.
  const source = useMemo(() => buildTypstSource(document), [document])

  const { state, isSlow, hostRef, exportPdf } = useTypstPreview(source)
  const { status, pages, diagnostics } = state

  const errors = diagnostics.filter((d) => d.severity === 'error')
  const warnings = diagnostics.filter((d) => d.severity === 'warning')
  const hasPages = pages.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* ------------------------------ toolbar ------------------------------ */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4">
        <p className="text-sm font-medium">Preview</p>

        {status === 'compiling' && isSlow ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Compiling
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          {errors.length > 0 ? (
            <Badge
              variant="destructive"
              className="h-5 gap-1 px-1.5 text-[0.7rem]"
            >
              <AlertTriangle />
              {errors.length} {errors.length === 1 ? 'error' : 'errors'}
            </Badge>
          ) : null}
          {warnings.length > 0 ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[0.7rem]">
              {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
            </Badge>
          ) : null}
          {hasPages ? (
            <span className="text-xs text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'page' : 'pages'}
            </span>
          ) : null}

          {/*
            Blocked while there are errors: the export compiles the same source,
            so it would fail in exactly the same way. Warnings are fine — a font
            substitution should not block a download.
          */}
          <ExportPdfButton
            exportPdf={exportPdf}
            title={document.header.title}
            disabled={errors.length > 0}
          />
        </div>
      </div>

      {/* ------------------------------- pages ------------------------------- */}
      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
        {!hasPages ? (
          <p
            className={
              status === 'error'
                ? 'py-16 text-center text-sm font-medium text-destructive'
                : 'py-16 text-center text-sm text-muted-foreground'
            }
          >
            {status === 'error'
              ? 'The document could not be compiled.'
              : 'Preparing the Typst compiler…'}
          </p>
        ) : null}

        {/*
          typst.ts fills this element itself: it clears the subtree and creates
          one canvas per page, scaled to fit. React must not add children here.
        */}
        <div ref={hostRef} className="mx-auto max-w-3xl" />

        {/* Diagnostics sit below the pages so an error never hides the paper. */}
        {diagnostics.length > 0 ? (
          <DiagnosticList
            diagnostics={diagnostics}
            className="mx-auto mt-4 max-w-3xl"
          />
        ) : null}
      </div>
    </div>
  )
}
