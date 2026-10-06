import { AlertCircle, TriangleAlert } from 'lucide-react'

import type { TypstDiagnostic } from '@/typst/engine'
import { cn } from '@/lib/utils'

interface DiagnosticListProps {
  diagnostics: TypstDiagnostic[]
  className?: string
}

/**
 * Compiler messages for the current document.
 *
 * Kept separate from the preview so the same list can be reused wherever
 * diagnostics need surfacing.
 */
export function DiagnosticList({ diagnostics, className }: DiagnosticListProps) {
  if (diagnostics.length === 0) return null

  return (
    <ul
      className={cn(
        'flex flex-col divide-y divide-border overflow-hidden rounded-lg border bg-background',
        className,
      )}
    >
      {diagnostics.map((diagnostic, index) => (
        <li key={`${diagnostic.location}-${index}`} className="flex gap-2.5 p-3">
          <span
            className={cn(
              'mt-px shrink-0',
              diagnostic.severity === 'error'
                ? 'text-destructive'
                : 'text-amber-600',
            )}
          >
            {diagnostic.severity === 'error' ? (
              <AlertCircle className="size-4" />
            ) : (
              <TriangleAlert className="size-4" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed text-foreground">
              {diagnostic.message}
            </p>
            {diagnostic.location ? (
              <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground">
                {diagnostic.location}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}