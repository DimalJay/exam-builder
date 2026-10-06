import type {
  ExamDisplay,
  ExamDocument,
  FillBlanksQuestion,
  McqQuestion,
  StructuredQuestion,
  TrueFalseQuestion,
} from './exam'

/**
 * Short, collision-resistant id. Deliberately not `crypto.randomUUID()`: ids
 * are persisted to localStorage and read back by the same browser, so a
 * readable prefix keeps debugging stored documents sane.
 */
export function createId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export const LOWER_OPTION_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'] as const

/** How many options a new MCQ starts with. */
const DEFAULT_OPTION_COUNT = 4

function createOptions(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: createId('opt'),
    text: '',
    // First option starts correct so a fresh paper renders a valid answer key.
    isCorrect: index === 0,
  }))
}

export function createMcqQuestion(number: number): McqQuestion {
  return {
    kind: 'mcq',
    id: createId('q'),
    number,
    part: 'PART I',
    prompt: '',
    marks: 1,
    answerMode: 'single',
    columns: 4,
    optionStyle: 'alpha-paren',
    options: createOptions(DEFAULT_OPTION_COUNT),
  }
}

export function createTrueFalseQuestion(number: number): TrueFalseQuestion {
  return {
    kind: 'true-false',
    id: createId('q'),
    number,
    part: 'PART I',
    prompt: 'Write whether the following statements are true or false.',
    marks: 5,
    statements: [
      { id: createId('tf'), label: '(i)', statement: 'Growth is a characteristic of living organisms.', isTrue: true },
      { id: createId('tf'), label: '(ii)', statement: 'Non-living things can reproduce.', isTrue: false },
    ],
  }
}

export function createFillBlanksQuestion(number: number): FillBlanksQuestion {
  return {
    kind: 'fill-blanks',
    id: createId('q'),
    number,
    part: 'PART I',
    prompt: 'Fill in the blanks using the most suitable word.',
    marks: 5,
    wordBank: 'reproduction, photosynthesis, autotrophic, micro organisms, locomotion',
    items: [
      { id: createId('fb'), label: '(i)', text: 'Organisms that produce their own food are called ______ organisms.', answer: 'autotrophic' },
      { id: createId('fb'), label: '(ii)', text: 'The process of producing food in green plants is called ______.', answer: 'photosynthesis' },
    ],
  }
}

export function createStructuredQuestion(number: number): StructuredQuestion {
  return {
    kind: 'structured',
    id: createId('q'),
    number,
    part: 'PART II',
    prompt: '',
    marks: 10,
    parts: [
      {
        id: createId('part'),
        label: 'i',
        prompt: '',
        marks: 5,
        answerLines: 3,
      },
      {
        id: createId('part'),
        label: 'ii',
        prompt: '',
        marks: 5,
        answerLines: 3,
      },
    ],
  }
}

/**
 * Marks the answer key exactly once for `single`-answer questions. Multiple
 * correct options are legitimate for `multiple`, so they are left untouched.
 */
export function normaliseMcqAnswerKey(question: McqQuestion): McqQuestion {
  if (question.answerMode !== 'single') return question

  const firstCorrect = question.options.find((option) => option.isCorrect)
  if (!firstCorrect) return question

  let seenCorrect = false
  return {
    ...question,
    options: question.options.map((option) => {
      if (!option.isCorrect) return option
      if (!seenCorrect) {
        seenCorrect = true
        return option
      }
      return { ...option, isCorrect: false }
    }),
  }
}

/**
 * A new paper shows everything: the answer key and mark counts are what make a
 * freshly built paper recognisable as a complete one.
 */
export function createDisplay(): ExamDisplay {
  return {
    showAnswerKey: true,
    showMarks: true,
    twoDigitNumbering: true,
    showEndOfPaper: true,
    showInstructions: true,
    showHeaderMeta: true,
    showWatermark: true,
    showPageNumbers: true,
  }
}

/**
 * The Grade 6 Science Unit Evaluation paper requested by the user:
 * matches the exact header, watermark "Exam Craft", PART I MCQs, True/False,
 * Fill in blanks, PART II structured questions with dotted lines, and dichotomous key.
 */
export function createScienceExamDocument(): ExamDocument {
  return {
    header: {
      title: 'Grade 6 - Science',
      subtitle: 'Unit Evaluation',
      unit: 'Unit 01 - Wonders of the Living World',
      institution: '',
      course: '',
      time: '1 ½ hours',
      showCandidateName: true,
      watermark: 'Exam Craft',
      style: 'school',
      fontFamily: 'serif',
      footer: '',
      metadata: [],
    },
    instructions: {
      general: 'Answer the following questions.',
      items: [],
    },
    display: {
      showAnswerKey: false,
      showMarks: false,
      twoDigitNumbering: true,
      showEndOfPaper: false,
    },
    questions: [
      {
        kind: 'mcq',
        id: createId('q'),
        number: 1,
        part: 'PART I',
        prompt: 'Select the most suitable answer.',
        marks: 5,
        answerMode: 'single',
        columns: 4,
        optionStyle: 'alpha-paren',
        options: [
          { id: createId('opt'), text: 'Stone', isCorrect: false },
          { id: createId('opt'), text: 'Pencil', isCorrect: false },
          { id: createId('opt'), text: 'Butterfly', isCorrect: true },
          { id: createId('opt'), text: 'Chair', isCorrect: false },
        ],
        subItems: [
          {
            id: createId('sub'),
            label: '(i)',
            prompt: 'Which of the following is a living thing?',
            columns: 4,
            options: [
              { id: createId('opt'), text: 'Stone', isCorrect: false },
              { id: createId('opt'), text: 'Pencil', isCorrect: false },
              { id: createId('opt'), text: 'Butterfly', isCorrect: true },
              { id: createId('opt'), text: 'Chair', isCorrect: false },
            ],
          },
          {
            id: createId('sub'),
            label: '(ii)',
            prompt: 'Which group contains only living organisms?',
            columns: 2,
            options: [
              { id: createId('opt'), text: 'Tree, dog, stone', isCorrect: false },
              { id: createId('opt'), text: 'Fish, bird, coconut tree', isCorrect: true },
              { id: createId('opt'), text: 'Chair, pencil, book', isCorrect: false },
              { id: createId('opt'), text: 'Water, soil, grass', isCorrect: false },
            ],
          },
          {
            id: createId('sub'),
            label: '(iii)',
            prompt: 'Which process helps organisms obtain energy from food?',
            columns: 4,
            options: [
              { id: createId('opt'), text: 'Growth', isCorrect: false },
              { id: createId('opt'), text: 'Respiration', isCorrect: true },
              { id: createId('opt'), text: 'Reproduction', isCorrect: false },
              { id: createId('opt'), text: 'Locomotion', isCorrect: false },
            ],
          },
          {
            id: createId('sub'),
            label: '(iv)',
            prompt: 'Which gas is released during photosynthesis?',
            columns: 4,
            options: [
              { id: createId('opt'), text: 'Oxygen', isCorrect: true },
              { id: createId('opt'), text: 'Carbon dioxide', isCorrect: false },
              { id: createId('opt'), text: 'Nitrogen', isCorrect: false },
              { id: createId('opt'), text: 'Hydrogen', isCorrect: false },
            ],
          },
          {
            id: createId('sub'),
            label: '(v)',
            prompt: 'Which equipment is used to observe microorganisms?',
            columns: 4,
            options: [
              { id: createId('opt'), text: 'Telescope', isCorrect: false },
              { id: createId('opt'), text: 'Compound microscope', isCorrect: true },
              { id: createId('opt'), text: 'Thermometer', isCorrect: false },
              { id: createId('opt'), text: 'Measuring tape', isCorrect: false },
            ],
          },
        ],
      },
      {
        kind: 'true-false',
        id: createId('q'),
        number: 2,
        part: 'PART I',
        prompt: 'Write whether the following statements are true or false.',
        marks: 5,
        statements: [
          {
            id: createId('tf'),
            label: '(i)',
            statement: 'Growth is a characteristic of living organisms.',
            isTrue: true,
          },
          {
            id: createId('tf'),
            label: '(ii)',
            statement: 'Non-living things can reproduce.',
            isTrue: false,
          },
          {
            id: createId('tf'),
            label: '(iii)',
            statement: 'Green plants are autotrophic organisms.',
            isTrue: true,
          },
          {
            id: createId('tf'),
            label: '(iv)',
            statement: 'Animals do not need food for survival.',
            isTrue: false,
          },
          {
            id: createId('tf'),
            label: '(v)',
            statement: 'Plants also carry out respiration.',
            isTrue: true,
          },
        ],
      },
      {
        kind: 'fill-blanks',
        id: createId('q'),
        number: 3,
        part: 'PART I',
        prompt: 'Fill in the blanks using the most suitable word.',
        marks: 5,
        wordBank: 'reproduction, photosynthesis, autotrophic, micro organisms, locomotion',
        items: [
          {
            id: createId('fb'),
            label: '(i)',
            text: 'Organisms that produce their own food are called ............ organisms.',
            answer: 'autotrophic',
          },
          {
            id: createId('fb'),
            label: '(ii)',
            text: 'The process of producing food in green plants is called ................',
            answer: 'photosynthesis',
          },
          {
            id: createId('fb'),
            label: '(iii)',
            text: 'The movement of animals from one place to another is called ............',
            answer: 'locomotion',
          },
          {
            id: createId('fb'),
            label: '(iv)',
            text: 'The production of new members of the same species is called ............',
            answer: 'reproduction',
          },
          {
            id: createId('fb'),
            label: '(v)',
            text: 'Organisms that cannot be seen with the naked eye are called .............',
            answer: 'micro organisms',
          },
        ],
      },
      {
        kind: 'structured',
        id: createId('q'),
        number: 1,
        part: 'PART II',
        prompt: 'Answer the following questions briefly.',
        marks: 10,
        parts: [
          {
            id: createId('part'),
            label: 'i',
            prompt: 'Name the three main groups of organisms.',
            marks: 3,
            answerLines: 3,
          },
          {
            id: createId('part'),
            label: 'ii',
            prompt: 'What is nutrition?',
            marks: 2,
            answerLines: 3,
          },
          {
            id: createId('part'),
            label: 'iii',
            prompt: 'Why are animals called heterotrophic organisms?',
            marks: 3,
            answerLines: 3,
          },
          {
            id: createId('part'),
            label: 'iv',
            prompt: 'What happens to lime water when exhaled air is passed through it, and why?',
            marks: 2,
            answerLines: 3,
          },
        ],
      },
      {
        kind: 'structured',
        id: createId('q'),
        number: 2,
        part: 'PART II',
        prompt: 'Classify the following organisms using a dichotomous key.',
        subtext: 'Earthworm, giraffe, monkey, butterfly, bat',
        marks: 5,
        blankSpaceMm: 80,
        parts: [],
      },
    ],
  }

}

/**
 * Standard university style exam document.
 */
export function createBoxedExamDocument(): ExamDocument {
  return {
    header: {
      title: 'End of Semester Examination',
      subtitle: 'Sample Paper',
      institution: 'University of Example',
      course: 'CS101 — Introduction to Computer Science',
      footer: 'Confidential — do not distribute.',
      style: 'boxed',
      fontFamily: 'serif',
      metadata: [
        { id: createId('meta'), label: 'Duration', value: '3 hours' },
        { id: createId('meta'), label: 'Marks', value: '100' },
        { id: createId('meta'), label: 'Pages', value: '4' },
      ],
    },
    instructions: {
      general: 'Answer ALL questions in the spaces provided.',
      items: [
        { id: createId('ins'), text: 'Write your answers in the spaces provided.' },
        { id: createId('ins'), text: 'Rough work must be crossed out neatly.' },
      ],
    },
    display: createDisplay(),
    questions: [
      createMcqQuestion(1),
      createStructuredQuestion(2),
    ],
  }
}

export function createInitialDocument(): ExamDocument {
  return createScienceExamDocument()
}

/** Total marks across every question and structured sub-part. */
export function countTotalMarks(document: ExamDocument): number {
  return document.questions.reduce((total, question) => {
    if (question.kind === 'structured' && question.parts.length > 0) {
      return total + question.parts.reduce((pTot, p) => pTot + (p.marks || 0), 0)
    }
    return total + (question.marks || 0)
  }, 0)
}