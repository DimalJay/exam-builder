import {
  isFillBlanks,
  isMcq,
  isStructured,
  isTrueFalse,
  type ExamDocument,
  type FillBlanksQuestion,
  type McqQuestion,
  type Question,
  type StructuredQuestion,
  type TrueFalseQuestion,
} from '@/domain/exam'
import {
  createFillBlanksQuestion,
  createId,
  createMcqQuestion,
  createStructuredQuestion,
  createTrueFalseQuestion,
  normaliseMcqAnswerKey,
} from '@/domain/factory'
import type { ExamAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                              Internal helpers                              */
/* -------------------------------------------------------------------------- */

/**
 * Question numbers are positional state, not user input: they are re-derived
 * from array order after every structural edit so they can never drift out of
 * sync with the rendered paper.
 */
function renumber(questions: Question[]): Question[] {
  return questions.map((question, index) => ({
    ...question,
    number: index + 1,
  }))
}

/** Replace one question, leaving the rest of the document untouched. */
function replaceQuestion(
  document: ExamDocument,
  questionId: string,
  update: (question: Question) => Question,
): ExamDocument {
  return {
    ...document,
    questions: document.questions.map((question) =>
      question.id === questionId ? update(question) : question,
    ),
  }
}

/** Run `update` only if the target question is an MCQ. */
function mapMcq(
  document: ExamDocument,
  questionId: string,
  update: (question: McqQuestion) => McqQuestion,
): ExamDocument {
  return replaceQuestion(document, questionId, (question) =>
    isMcq(question) ? update(question) : question,
  )
}

/** Run `update` only if the target question is structured. */
function mapStructured(
  document: ExamDocument,
  questionId: string,
  update: (question: StructuredQuestion) => StructuredQuestion,
): ExamDocument {
  return replaceQuestion(document, questionId, (question) =>
    isStructured(question) ? update(question) : question,
  )
}

/** Run `update` only if the target question is True/False. */
function mapTrueFalse(
  document: ExamDocument,
  questionId: string,
  update: (question: TrueFalseQuestion) => TrueFalseQuestion,
): ExamDocument {
  return replaceQuestion(document, questionId, (question) =>
    isTrueFalse(question) ? update(question) : question,
  )
}

/** Run `update` only if the target question is Fill in Blanks. */
function mapFillBlanks(
  document: ExamDocument,
  questionId: string,
  update: (question: FillBlanksQuestion) => FillBlanksQuestion,
): ExamDocument {
  return replaceQuestion(document, questionId, (question) =>
    isFillBlanks(question) ? update(question) : question,
  )
}

/**
 * A single-answer question may only ever name one correct option.
 */
function withSingleAnswerInvariant<T extends Question>(question: T): T {
  return (isMcq(question) ? normaliseMcqAnswerKey(question) : question) as T
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return items
  }
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/* -------------------------------------------------------------------------- */
/*                                 The reducer                                */
/* -------------------------------------------------------------------------- */

export function examReducer(
  document: ExamDocument,
  action: ExamAction,
): ExamDocument {
  switch (action.type) {
    /* -------------------------------- document ------------------------------- */
    case 'document/load':
      return action.document

    /* --------------------------------- header -------------------------------- */
    case 'header/update':
      return {
        ...document,
        header: { ...document.header, ...action.patch },
      }

    case 'header/metadata/add':
      return {
        ...document,
        header: {
          ...document.header,
          metadata: [
            ...document.header.metadata,
            { id: createId('meta'), label: '', value: '' },
          ],
        },
      }

    case 'header/metadata/update':
      return {
        ...document,
        header: {
          ...document.header,
          metadata: document.header.metadata.map((entry) =>
            entry.id === action.id ? { ...entry, ...action.patch } : entry,
          ),
        },
      }

    case 'header/metadata/remove':
      return {
        ...document,
        header: {
          ...document.header,
          metadata: document.header.metadata.filter(
            (entry) => entry.id !== action.id,
          ),
        },
      }

    /* -------------------------------- display -------------------------------- */
    case 'display/update':
      return {
        ...document,
        display: { ...document.display, ...action.patch },
      }

    /* ------------------------------ instructions ----------------------------- */
    case 'instructions/update':
      return {
        ...document,
        instructions: { ...document.instructions, ...action.patch },
      }

    case 'instructions/item/add':
      return {
        ...document,
        instructions: {
          ...document.instructions,
          items: [
            ...document.instructions.items,
            { id: createId('ins'), text: '' },
          ],
        },
      }

    case 'instructions/item/update':
      return {
        ...document,
        instructions: {
          ...document.instructions,
          items: document.instructions.items.map((item) =>
            item.id === action.id ? { ...item, text: action.text } : item,
          ),
        },
      }

    case 'instructions/item/remove':
      return {
        ...document,
        instructions: {
          ...document.instructions,
          items: document.instructions.items.filter(
            (item) => item.id !== action.id,
          ),
        },
      }

    /* -------------------------------- questions ------------------------------- */
    case 'question/add': {
      const nextNumber = document.questions.length + 1
      let question: Question
      if (action.kind === 'mcq') {
        question = createMcqQuestion(nextNumber)
      } else if (action.kind === 'true-false') {
        question = createTrueFalseQuestion(nextNumber)
      } else if (action.kind === 'fill-blanks') {
        question = createFillBlanksQuestion(nextNumber)
      } else {
        question = createStructuredQuestion(nextNumber)
      }

      const questions = [...document.questions]
      const at = action.at ?? questions.length
      questions.splice(Math.max(0, Math.min(at, questions.length)), 0, question)

      return { ...document, questions: renumber(questions) }
    }

    case 'question/remove': {
      const questions = document.questions.filter(
        (question) => question.id !== action.id,
      )
      return { ...document, questions: renumber(questions) }
    }

    case 'question/duplicate': {
      const index = document.questions.findIndex(
        (question) => question.id === action.id,
      )
      if (index === -1) return document

      const source = document.questions[index]
      let copy: Question
      if (isMcq(source)) {
        copy = {
          ...source,
          id: createId('q'),
          options: source.options.map((option) => ({
            ...option,
            id: createId('opt'),
          })),
          subItems: source.subItems?.map((sub) => ({
            ...sub,
            id: createId('sub'),
            options: sub.options.map((opt) => ({
              ...opt,
              id: createId('opt'),
            })),
          })),
        }
      } else if (isTrueFalse(source)) {
        copy = {
          ...source,
          id: createId('q'),
          statements: source.statements.map((s) => ({
            ...s,
            id: createId('tf'),
          })),
        }
      } else if (isFillBlanks(source)) {
        copy = {
          ...source,
          id: createId('q'),
          items: source.items.map((it) => ({
            ...it,
            id: createId('fb'),
          })),
        }
      } else {
        copy = {
          ...source,
          id: createId('q'),
          parts: source.parts.map((part) => ({
            ...part,
            id: createId('part'),
          })),
        }
      }

      const questions = [...document.questions]
      questions.splice(index + 1, 0, copy)
      return { ...document, questions: renumber(questions) }
    }

    case 'question/move': {
      const from = document.questions.findIndex(
        (question) => question.id === action.id,
      )
      if (from === -1) return document
      return {
        ...document,
        questions: renumber(
          move(document.questions, from, from + action.direction),
        ),
      }
    }

    case 'question/patch':
      return replaceQuestion(document, action.id, (question) => {
        if (action.update.kind !== question.kind) return question
        return withSingleAnswerInvariant({
          ...question,
          ...action.update.patch,
        } as Question)
      })

    /* ------------------------------ mcq options ------------------------------ */
    case 'mcq/option/add':
      return mapMcq(document, action.questionId, (question) => ({
        ...question,
        options: [
          ...question.options,
          { id: createId('opt'), text: '', isCorrect: false },
        ],
      }))

    case 'mcq/option/remove':
      return mapMcq(document, action.questionId, (question) =>
        withSingleAnswerInvariant({
          ...question,
          options: question.options.filter(
            (option) => option.id !== action.optionId,
          ),
        }),
      )

    case 'mcq/option/update':
      return mapMcq(document, action.questionId, (question) => ({
        ...question,
        options: question.options.map((option) =>
          option.id === action.optionId ? { ...option, text: action.text } : option,
        ),
      }))

    case 'mcq/option/setCorrect':
      return mapMcq(document, action.questionId, (question) => {
        const next: McqQuestion = {
          ...question,
          options: question.options.map((option) =>
            option.id === action.optionId
              ? { ...option, isCorrect: action.isCorrect }
              : question.answerMode === 'single'
              ? { ...option, isCorrect: false }
              : option,
          ),
        }
        return withSingleAnswerInvariant(next)
      })

    /* ---------------------------- structured parts --------------------------- */
    case 'part/add':
      return mapStructured(document, action.questionId, (question) => {
        const part = {
          id: createId('part'),
          label: String.fromCharCode(97 + question.parts.length),
          prompt: '',
          marks: 1,
          answerLines: 3,
        }
        return { ...question, parts: [...question.parts, part] }
      })

    case 'part/remove':
      return mapStructured(document, action.questionId, (question) => ({
        ...question,
        parts: question.parts.filter((part) => part.id !== action.partId),
      }))

    case 'part/update':
      return mapStructured(document, action.questionId, (question) => ({
        ...question,
        parts: question.parts.map((part) =>
          part.id === action.partId ? { ...part, ...action.patch } : part,
        ),
      }))

    /* --------------------------- true / false statements -------------------- */
    case 'true-false/statement/add':
      return mapTrueFalse(document, action.questionId, (question) => ({
        ...question,
        statements: [
          ...question.statements,
          {
            id: createId('tf'),
            label: `(${toRoman(question.statements.length + 1)})`,
            statement: '',
            isTrue: true,
          },
        ],
      }))

    case 'true-false/statement/remove':
      return mapTrueFalse(document, action.questionId, (question) => ({
        ...question,
        statements: question.statements.filter(
          (s) => s.id !== action.statementId,
        ),
      }))

    case 'true-false/statement/update':
      return mapTrueFalse(document, action.questionId, (question) => ({
        ...question,
        statements: question.statements.map((s) =>
          s.id === action.statementId ? { ...s, ...action.patch } : s,
        ),
      }))

    /* --------------------------- fill-in blanks items ------------------------ */
    case 'fill-blanks/item/add':
      return mapFillBlanks(document, action.questionId, (question) => ({
        ...question,
        items: [
          ...question.items,
          {
            id: createId('fb'),
            label: `(${toRoman(question.items.length + 1)})`,
            text: '',
            answer: '',
          },
        ],
      }))

    case 'fill-blanks/item/remove':
      return mapFillBlanks(document, action.questionId, (question) => ({
        ...question,
        items: question.items.filter((it) => it.id !== action.itemId),
      }))

    case 'fill-blanks/item/update':
      return mapFillBlanks(document, action.questionId, (question) => ({
        ...question,
        items: question.items.map((it) =>
          it.id === action.itemId ? { ...it, ...action.patch } : it,
        ),
      }))
  }
}

function toRoman(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ]
  let result = ''
  let n = num
  for (const [val, str] of romanMap) {
    while (n >= val) {
      result += str
      n -= val
    }
  }
  return result || 'i'
}