import type {
  ExamDisplay,
  ExamDocument,
  ExamHeader,
  ExamInstructions,
  FillBlanksQuestion,
  McqQuestion,
  StructuredQuestion,
  TrueFalseQuestion,
} from '@/domain/exam'
import type { QuestionKind } from '@/domain/exam'

/**
 * A partial update to a question, narrowed by `kind` so the compiler rejects
 * structural edits (e.g. writing `parts` onto an MCQ) at the call site.
 */
export type QuestionPatch =
  | {
      kind: 'mcq'
      patch: Partial<Omit<McqQuestion, 'kind' | 'id'>>
    }
  | {
      kind: 'structured'
      patch: Partial<Omit<StructuredQuestion, 'kind' | 'id'>>
    }
  | {
      kind: 'true-false'
      patch: Partial<Omit<TrueFalseQuestion, 'kind' | 'id'>>
    }
  | {
      kind: 'fill-blanks'
      patch: Partial<Omit<FillBlanksQuestion, 'kind' | 'id'>>
    }

/**
 * Every state transition in the app. Keeping them in one discriminated union
 * means the reducer is exhaustive-checked: adding a new action is a compile
 * error until it is handled, and the UI can only dispatch documented intents.
 */
export type ExamAction =
  /* --------------------------------- document ------------------------------ */
  | { type: 'document/load'; document: ExamDocument }

  /* --------------------------------- header -------------------------------- */
  | { type: 'header/update'; patch: Partial<Omit<ExamHeader, 'metadata'>> }
  | { type: 'header/metadata/add' }
  | { type: 'header/metadata/update'; id: string; patch: Partial<{ label: string; value: string }> }
  | { type: 'header/metadata/remove'; id: string }

  /* -------------------------------- display -------------------------------- */
  | { type: 'display/update'; patch: Partial<ExamDisplay> }

  /* ------------------------------ instructions ----------------------------- */
  | { type: 'instructions/update'; patch: Partial<Pick<ExamInstructions, 'general'>> }
  | { type: 'instructions/item/add' }
  | { type: 'instructions/item/update'; id: string; text: string }
  | { type: 'instructions/item/remove'; id: string }

  /* -------------------------------- questions ------------------------------- */
  | { type: 'question/add'; kind: QuestionKind; at?: number }
  | { type: 'question/remove'; id: string }
  | { type: 'question/duplicate'; id: string }
  | { type: 'question/move'; id: string; direction: -1 | 1 }
  | { type: 'question/patch'; id: string; update: QuestionPatch }

  /* ------------------------------ mcq options ------------------------------ */
  | { type: 'mcq/option/add'; questionId: string }
  | { type: 'mcq/option/remove'; questionId: string; optionId: string }
  | { type: 'mcq/option/update'; questionId: string; optionId: string; text: string }
  | { type: 'mcq/option/setCorrect'; questionId: string; optionId: string; isCorrect: boolean }

  /* ---------------------------- structured parts --------------------------- */
  | { type: 'part/add'; questionId: string }
  | { type: 'part/remove'; questionId: string; partId: string }
  | {
      type: 'part/update'
      questionId: string
      partId: string
      patch: Partial<{ label: string; prompt: string; marks: number; answerLines: number }>
    }

  /* --------------------------- true / false statements -------------------- */
  | { type: 'true-false/statement/add'; questionId: string }
  | { type: 'true-false/statement/remove'; questionId: string; statementId: string }
  | {
      type: 'true-false/statement/update'
      questionId: string
      statementId: string
      patch: Partial<{ label: string; statement: string; isTrue: boolean }>
    }

  /* --------------------------- fill-in blanks items ------------------------ */
  | { type: 'fill-blanks/item/add'; questionId: string }
  | { type: 'fill-blanks/item/remove'; questionId: string; itemId: string }
  | {
      type: 'fill-blanks/item/update'
      questionId: string
      itemId: string
      patch: Partial<{ label: string; text: string; answer: string }>
    }