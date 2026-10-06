import { createContext, useContext } from 'react'

import type { ExamDocument } from '@/domain/exam'
import type { ExamAction } from './actions'

/**
 * The context object and its accessor live here rather than alongside the
 * provider, so `ExamProvider.tsx` exports only a component (a requirement for
 * React Fast Refresh to hot-reload it correctly).
 */
export interface ExamContextValue {
  document: ExamDocument
  dispatch: React.Dispatch<ExamAction>
  /** True once the stored document has been read, so the UI can avoid a flash. */
  isHydrated: boolean
}

export const ExamContext = createContext<ExamContextValue | null>(null)

/** Fail loudly on misuse rather than letting a null context crash deep in render. */
export function useRequiredExamContext(): ExamContextValue {
  const context = useContext(ExamContext)
  if (!context) {
    throw new Error('Exam hooks must be used within an ExamProvider')
  }
  return context
}