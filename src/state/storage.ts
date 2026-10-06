import type { ExamDocument } from '@/domain/exam'
import { createDisplay } from '@/domain/factory'

const STORAGE_KEY = 'exam-builder:document:v1'

/**
 * Persistence boundary. All `localStorage` access is confined here so the
 * reducer stays pure and the storage format can evolve in one place.
 *
 * Reads are defensive: a stored document from an older or corrupted schema
 * returns `null` rather than crashing the app on boot.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Structural check that is just loose enough to reject garbage. */
function looksLikeDocument(value: unknown): value is ExamDocument {
  if (!isRecord(value)) return false

  const { header, instructions, questions } = value
  if (!isRecord(header) || !isRecord(instructions)) return false
  if (!Array.isArray(questions)) return false

  return Array.isArray(header.metadata) && Array.isArray(instructions.items)
}

/**
 * Fill in fields added to the schema after a document was written.
 *
 * `looksLikeDocument` only checks the fields it knows about, so a stored
 * document predating `display` would pass validation and then throw on the
 * first `document.display.showAnswerKey` read. Defaulting to "show
 * everything" matches how those documents rendered before the option existed.
 */
function withDefaults(document: ExamDocument): ExamDocument {
  // Read through `unknown`: `document.display` is typed as non-optional, so a
  // stored document that predates the field is a lie the type system cannot
  // warn about here but the runtime must survive.
  const stored: unknown = document.display
  const display: Record<string, unknown> = isRecord(stored) ? stored : {}

  const bool = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback

  const defaults = createDisplay()

  return {
    ...document,
    display: {
      showAnswerKey: bool(display.showAnswerKey, defaults.showAnswerKey),
      showMarks: bool(display.showMarks, defaults.showMarks),
      twoDigitNumbering: bool(display.twoDigitNumbering, defaults.twoDigitNumbering ?? true),
      showEndOfPaper: bool(display.showEndOfPaper, defaults.showEndOfPaper ?? true),
    },


  }
}

export function loadDocument(): ExamDocument | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    return looksLikeDocument(parsed) ? withDefaults(parsed) : null
  } catch {
    return null
  }
}

export function saveDocument(document: ExamDocument): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
  } catch {
    // Quota exceeded or storage disabled (private browsing). Autosave is a
    // convenience, so a failure must never interrupt editing.
  }
}