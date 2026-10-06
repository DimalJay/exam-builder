import { useEffect, useMemo, useReducer, type ReactNode } from 'react'

import type { ExamDocument } from '@/domain/exam'
import { createInitialDocument } from '@/domain/factory'
import { ExamContext, type ExamContextValue } from './examContext'
import { examReducer } from './reducer'
import { loadDocument, saveDocument } from './storage'

/** Autosave debounce. Long enough to avoid a write per keystroke. */
const AUTOSAVE_DELAY_MS = 600

function init(): ExamDocument {
  return loadDocument() ?? createInitialDocument()
}

/**
 * Owns the exam document for the whole app and persists changes to
 * localStorage. Children stay unaware of storage entirely.
 */
export function ExamProvider({ children }: { children: ReactNode }) {
  const [document, dispatch] = useReducer(examReducer, undefined, init)

  useEffect(() => {
    const timeout = window.setTimeout(
      () => saveDocument(document),
      AUTOSAVE_DELAY_MS,
    )
    // Clearing on every keystroke is what turns this into a debounce.
    return () => window.clearTimeout(timeout)
  }, [document])

  const value = useMemo<ExamContextValue>(
    () => ({ document, dispatch, isHydrated: true }),
    [document],
  )

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}