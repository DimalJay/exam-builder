import { useMemo } from 'react'

import type { ExamDocument } from '@/domain/exam'
import { countTotalMarks } from '@/domain/factory'
import { useRequiredExamContext } from './examContext'

/**
 * Narrow accessors over the single exam context.
 *
 * Components depend on these hooks instead of the raw context, so a preview
 * component cannot dispatch a `question/patch` — the type system encodes the
 * capability each part of the UI actually has (Interface Segregation).
 */

/** Read-only access to the document. */
export function useExamDocument(): ExamDocument {
  return useRequiredExamContext().document
}

/** Dispatch-only access, for controls that need no document data. */
export function useExamDispatch() {
  return useRequiredExamContext().dispatch
}

/** Document-level totals for the status bar. */
export function useExamTotals() {
  const document = useExamDocument()
  return useMemo(
    () => ({
      questionCount: document.questions.length,
      totalMarks: countTotalMarks(document),
    }),
    [document],
  )
}