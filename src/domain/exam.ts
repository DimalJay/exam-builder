/**
 * Domain model for an exam paper.
 *
 * Questions are modelled as a discriminated union keyed on `kind`. Each variant
 * owns only the fields that make sense for it, so an MCQ can never carry
 * structured-question data and vice versa. Adding a third question style means
 * adding one variant here plus one renderer in `src/typst/generate.ts` — no
 * existing code changes (Open/Closed).
 */

/** A single selectable option belonging to a multiple-choice question. */
export interface McqOption {
  id: string
  text: string
  /** Whether this option is part of the answer key. Multiple may be correct. */
  isCorrect: boolean
}

export type McqOptionStyle = 'alpha-paren' | 'alpha-dot' // 'a)' vs 'A.'
export type McqColumns = 1 | 2 | 4 | 'auto'

export interface McqSubItem {
  id: string
  label: string // e.g. "(i)"
  prompt: string
  options: McqOption[]
  columns?: McqColumns
}

interface QuestionBase {
  id: string
  /** Display number shown in the paper. Managed by the document, not the user. */
  number: number
  /** Marks awarded for a correct response. */
  marks: number
  /** Section / Part in the paper, e.g. "PART I" or "PART II". */
  part?: string
}

export interface McqQuestion extends QuestionBase {
  kind: 'mcq'
  prompt: string
  options: McqOption[]
  /** e.g. "Single correct", "Multiple correct" — rendered under the section. */
  answerMode: McqAnswerMode
  columns?: McqColumns
  optionStyle?: McqOptionStyle
  /** Optional nested sub-questions, e.g. (i) ... (v) under "01. Select the most suitable answer." */
  subItems?: McqSubItem[]
}

/** How many options a candidate may tick. */
export type McqAnswerMode = 'single' | 'multiple'

/** Statement for a True/False question */
export interface TrueFalseStatement {
  id: string
  label: string // e.g. "(i)"
  statement: string
  isTrue?: boolean
}

export interface TrueFalseQuestion extends QuestionBase {
  kind: 'true-false'
  prompt: string
  statements: TrueFalseStatement[]
}

/** Item for a Fill in the blanks question */
export interface FillBlankItem {
  id: string
  label: string // e.g. "(i)"
  text: string
  answer?: string
}

export interface FillBlanksQuestion extends QuestionBase {
  kind: 'fill-blanks'
  prompt: string
  wordBank?: string
  items: FillBlankItem[]
}

/**
 * A longer-form question. Sub-parts let a single numbered question carry
 * several independently-marked sections, which is the common convention for
 * structured exam papers.
 */
export interface StructuredPart {
  id: string
  label: string
  prompt: string
  marks: number
  /** Dotted lines for student answer writing, e.g. 3 lines */
  answerLines?: number
}

export interface StructuredQuestion extends QuestionBase {
  kind: 'structured'
  prompt: string
  /** Optional italic subtext / item list, e.g. "Earthworm, giraffe, monkey, butterfly, bat" */
  subtext?: string
  /** Optional blank drawing / answer space in millimeters, e.g. 60mm */
  blankSpaceMm?: number
  parts: StructuredPart[]
}

export type Question =
  | McqQuestion
  | TrueFalseQuestion
  | FillBlanksQuestion
  | StructuredQuestion

export type QuestionKind = Question['kind']

/** The letter/heading block printed above the question list. */
export interface ExamHeader {
  title: string
  subtitle: string
  institution: string
  course: string
  /** Third title line, e.g. "Unit 01 - Wonders of the Living World" */
  unit?: string
  /** Examination duration on metadata bar, e.g. "1 ½ hours" */
  time?: string
  /** Whether to show candidate name dotted line on header bar */
  showCandidateName?: boolean
  /** Diagonal watermark text across every page," */
  watermark?: string
  /** Watermark font size in points. Defaults to 68. */
  watermarkSize?: number
  /** Watermark lightness 0–100 (Typst `luma`); lower = darker, higher = fainter. Defaults to 94. */
  watermarkLuma?: number
  /** Watermark rotation in degrees. Defaults to -45. */
  watermarkAngle?: number
  /** Watermark font weight. Defaults to 'bold'. */
  watermarkWeight?: 'regular' | 'bold'
  /** Header presentation style: 'school' (Sri Lankan / School exam) or 'boxed' (University exam) */
  style?: 'school' | 'boxed'
  /** Typeface: 'serif' (Times New Roman) or 'sans' (Noto Sans) */
  fontFamily?: 'serif' | 'sans'
  /** Repeated on every page footer. Empty string omits it. */
  footer: string
  /** Free-form lines rendered in the exam metadata table. */
  metadata: Array<{ id: string; label: string; value: string }>
}

/**
 * Which parts of the paper are printed.
 */
export interface ExamDisplay {
  /** Append the answer key page after the paper. */
  showAnswerKey: boolean
  /** Print the `(n marks)` suffix on each question and sub-part. */
  showMarks: boolean
  /** Whether question numbers use leading zeros: "01." vs "1." */
  twoDigitNumbering?: boolean
  /** Show "END OF PAPER" at the end of the paper, pinned to the bottom of the page */
  showEndOfPaper?: boolean
  /** Print the instructions block between the header and the questions. */
  showInstructions?: boolean
  /** Print the header extras: time duration, unit/topic line and details table. */
  showHeaderMeta?: boolean
  /** Print the diagonal watermark text configured on the header. */
  showWatermark?: boolean
  /** Print the page footer: page numbers and any custom footer text. */
  showPageNumbers?: boolean
}

/** Candidate-facing guidance rendered between the header and the questions. */
export interface ExamInstructions {
  /** e.g. "Answer ALL questions" */
  general: string
  items: Array<{ id: string; text: string }>
}

export interface ExamDocument {
  header: ExamHeader
  instructions: ExamInstructions
  display: ExamDisplay
  questions: Question[]
}

/* -------------------------------------------------------------------------- */
/*                              Narrowing helpers                             */
/* -------------------------------------------------------------------------- */

export function isMcq(question: Question): question is McqQuestion {
  return question.kind === 'mcq'
}

export function isTrueFalse(question: Question): question is TrueFalseQuestion {
  return question.kind === 'true-false'
}

export function isFillBlanks(question: Question): question is FillBlanksQuestion {
  return question.kind === 'fill-blanks'
}

export function isStructured(
  question: Question,
): question is StructuredQuestion {
  return question.kind === 'structured'
}