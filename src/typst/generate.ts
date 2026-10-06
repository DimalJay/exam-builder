import type {
  ExamDocument,
  ExamHeader,
  ExamInstructions,
  FillBlanksQuestion,
  McqQuestion,
  Question,
  StructuredQuestion,
  TrueFalseQuestion,
} from '@/domain/exam'
import { LOWER_OPTION_LABELS, OPTION_LABELS } from '@/domain/factory'

/**
 * Transforms the exam document into Typst markup.
 *
 * This module is deliberately free of React and of the Typst compiler: it is a
 * pure string builder, so the exact source sent to Typst can be unit-tested and
 * shown in the UI without a running compiler.
 */

/* -------------------------------------------------------------------------- */
/*                                 Primitives                                 */
/* -------------------------------------------------------------------------- */

/**
 * Neutralise Typst markup characters so user input is rendered literally.
 */
export function escapeTypst(text: string): string {
  return text.replace(/[#$*_`<>@\\[\]~]/g, (char) => `\\${char}`)
}

/** Collapse empty/whitespace-only content, which would render as a stray blank. */
function present(text?: string | null): string | null {
  if (!text) return null
  const trimmed = text.trim()
  return trimmed.length > 0 ? escapeTypst(trimmed) : null
}

/** `12 marks`, `1 mark` — singular/plural handled once here. */
export function formatMarks(marks: number): string {
  return `${marks} ${Math.abs(marks) === 1 ? 'mark' : 'marks'}`
}

/**
 * A label/value cell: bold label on the first line, value beneath it. Used for
 * the metadata and candidate-detail tables.
 */
function metaCell(label: string, value: string): string {
  return `[*${escapeTypst(label)}:* \\\n    ${escapeTypst(value)}]`
}

/* -------------------------------------------------------------------------- */
/*                                Section blocks                              */
/* -------------------------------------------------------------------------- */

function renderBoxedHeader(header: ExamHeader): string {
  const institution = present(header.institution)
  const title = present(header.title)
  const course = present(header.course)

  const titleLines: string[] = []
  if (institution) {
    titleLines.push(`#text(size: 16pt, weight: "bold")[${institution}]`)
  }
  if (title) {
    titleLines.push(`#v(4pt)
    #text(size: 11pt, weight: "bold")[${title}]`)
  }
  if (course) {
    titleLines.push(`#v(3pt)
    #text(size: 10pt)[${course}]`)
  }

  const meta = header.metadata
    .map((entry) => {
      const label = present(entry.label)
      const value = present(entry.value)
      return label !== null && value !== null ? metaCell(label, value) : null
    })
    .filter((cell): cell is string => cell !== null)

  const boxMeta = meta.slice(0, 3)
  const infoMeta = meta.slice(3, 7)

  const box: string[] = [
    `#align(center)[
    ${titleLines.join('\n    ')}
  ]`,
  ]

  if (boxMeta.length > 0) {
    box.push(`#table(
    columns: (1fr, 1fr, 1fr),
    stroke: none,
    inset: 3pt,
    ${boxMeta.join(',\n    ')},
  )`)
  }

  box.push(`#table(
    columns: (1fr, 1fr),
    stroke: none,
    inset: 3pt,
    ${metaCell('Name', '__________________________')},
    ${metaCell('Index No', '__________________________')},
    ${metaCell('School', '__________________________')},
    ${metaCell('Date', '__________________________')},
  )`)

  const boxInner = box
    .map((block, index) =>
      index === 0 ? block : `#v(8pt)
  #line(length: 100%)
  #v(6pt)
  ${block}`,
    )
    .join('\n  ')

  const examInfo =
    infoMeta.length > 0
      ? `#v(10pt)
  #table(
    columns: (1fr, 1fr),
    stroke: none,
    inset: 3pt,
    ${infoMeta.join(',\n    ')},
  )`
      : ''

  return `#box(
  width: 100%,
  inset: 12pt,
  radius: 8pt,
  stroke: 0.8pt,
)[
  ${boxInner}
]${examInfo}`
}

function renderSchoolHeader(header: ExamHeader): string {
  const institution = present(header.institution)
  const title = present(header.title)
  const subtitle = present(header.subtitle)
  const unit = present(header.unit || header.course)
  const time = header.time ? escapeTypst(header.time.trim()) : '1 ½ hours'
  const showName = header.showCandidateName !== false

  const titles: string[] = []
  if (institution && title) {
    titles.push(`#text(size: 15pt, weight: "bold")[${institution}]`)
    titles.push(`#v(3pt)\n  #text(size: 14pt, weight: "bold")[${title}]`)
    if (subtitle) titles.push(`#v(3pt)\n  #text(size: 13.5pt, weight: "bold")[${subtitle}]`)
    if (unit) titles.push(`#v(3pt)\n  #text(size: 13.5pt, weight: "bold")[${unit}]`)
  } else {
    const line1 = title || institution
    if (line1) titles.push(`#text(size: 15pt, weight: "bold")[${line1}]`)
    if (subtitle) titles.push(`#v(3pt)\n  #text(size: 14pt, weight: "bold")[${subtitle}]`)
    if (unit) titles.push(`#v(3pt)\n  #text(size: 14pt, weight: "bold")[${unit}]`)
  }

  const metaRow = `#grid(
  columns: (auto, 1fr),
  align: (bottom + left, bottom + right),
  [Time: ${time}],
  ${showName ? `[Name: #box(width: 82%, repeat[.])],` : '[],'}
)`

  return `#align(center)[
  ${titles.join('\n  ')}
]

#v(14pt)
${metaRow}
#v(3pt)
#line(length: 100%, stroke: 0.6pt)
#v(10pt)`
}

function renderHeader(header: ExamHeader): string {
  if (header.style === 'boxed') {
    return renderBoxedHeader(header)
  }
  return renderSchoolHeader(header)
}

function renderInstructions(
  instructions: ExamInstructions,
  headerStyle?: string,
): string {
  const general = present(instructions.general)
  const items = instructions.items
    .map((item) => present(item.text))
    .filter((text): text is string => text !== null)

  if (!general && items.length === 0) return ''

  if (headerStyle === 'boxed' || items.length > 0) {
    const body: string[] = ['*Instructions to Candidates*']
    if (general) body.push(`#v(4pt)\n    ${general}`)
    if (items.length > 0) {
      body.push(`#v(6pt)\n    #enum(\n      ${items.map((text) => `[${text}]`).join(',\n      ')},\n    )`)
    }
    return `#v(10pt)
  #block(
    width: 100%,
    stroke: 0.7pt,
    inset: 8pt,
  )[
    ${body.join('\n    ')}
  ]`
  }

  // School exam style: clean bold italic directive
  return `#text(style: "italic", weight: "bold")[${general}]
#v(4pt)`
}

/* -------------------------------------------------------------------------- */
/*                                 Questions                                  */
/* -------------------------------------------------------------------------- */

function formatQuestionNumber(num: number, twoDigit: boolean): string {
  return twoDigit ? String(num).padStart(2, '0') : String(num)
}

function renderQuestionLead(
  numStr: string,
  prompt: string,
  marks: number,
  showMarks: boolean,
) {
  const promptBlock = present(prompt) ?? `[#text(fill: luma(70%))[_untitled_]]`
  const lead = `#text(weight: "bold")[${numStr}.] #h(5pt) ${promptBlock}`

  return showMarks
    ? `${lead} \\
#text(size: 9pt, fill: luma(45%))[(${formatMarks(marks)})]`
    : lead
}

function renderMcq(
  question: McqQuestion,
  numStr: string,
  showMarks: boolean,
): string {
  const lead = renderQuestionLead(
    numStr,
    question.prompt,
    question.marks,
    showMarks,
  )

  const isAlphaParen = question.optionStyle !== 'alpha-dot'

  // If question contains nested sub-questions (e.g. (i) to (v))
  if (question.subItems && question.subItems.length > 0) {
    const renderedSubs = question.subItems.map((sub) => {
      const subPrompt = present(sub.prompt) ?? ''
      const subCols =
        sub.columns === 2
          ? '(1fr, 1fr)'
          : sub.columns === 1
          ? '(1fr)'
          : '(1fr, 1.15fr, 1fr, 1fr)'

      const subOptions = sub.options
        .map((opt, i) => {
          const lbl = isAlphaParen
            ? `${LOWER_OPTION_LABELS[i] ?? String.fromCharCode(97 + i)})`
            : `${OPTION_LABELS[i] ?? String.fromCharCode(65 + i)}.`
          const text = present(opt.text) ?? ''
          return `[${lbl} ${text}]`
        })
        .join(', ')

      return `#text(weight: "bold")[${sub.label}] #h(5pt) ${subPrompt}
      #v(5pt)
      #grid(
        columns: ${subCols},
        gutter: (8pt, 6pt),
        ${subOptions}
      )`
    })

    return `${lead}
    #v(10pt)
    ${renderedSubs.join('\n#v(16pt)\n')}`
  }

  // Standalone MCQ
  const options = question.options
    .map((option, index) => {
      const lbl = isAlphaParen
        ? `${LOWER_OPTION_LABELS[index] ?? String.fromCharCode(97 + index)})`
        : `${OPTION_LABELS[index] ?? String.fromCharCode(65 + index)}.`
      return {
        label: lbl,
        text: present(option.text),
      }
    })
    .filter((option) => option.text !== null)

  if (options.length === 0) return `${lead}\n    #v(2pt)`

  const colCount = question.columns === 4 ? 4 : question.columns === 1 ? 1 : 2
  const colDef =
    colCount === 4
      ? '(1fr, 1fr, 1fr, 1fr)'
      : colCount === 1
      ? '(1fr)'
      : '(1fr, 1fr)'

  const cells = options
    .map((option) => `[${option.label} ${option.text}]`)
    .join(',\n        ')

  return `${lead}
    #v(6pt)
    #grid(
      columns: ${colDef},
      gutter: (8pt, 6pt),
      ${cells},
    )`
}

function renderTrueFalse(
  question: TrueFalseQuestion,
  numStr: string,
  showMarks: boolean,
): string {
  const lead = renderQuestionLead(
    numStr,
    question.prompt,
    question.marks,
    showMarks,
  )

  const rows = question.statements.map((stmt) => {
    const text = present(stmt.statement) ?? ''
    return `#grid(
      columns: (auto, 1fr, auto),
      gutter: (8pt, 0pt),
      align: (top + left, top + left, bottom + right),
      [#text(weight: "bold")[${stmt.label}]],
      [${text}],
      [[#box(width: 44pt, repeat[.])] ]
    )`
  })

  return `${lead}
  #v(10pt)
  ${rows.join('\n#v(14pt)\n')}`
}


function renderFillBlanks(
  question: FillBlanksQuestion,
  numStr: string,
  showMarks: boolean,
): string {
  const lead = renderQuestionLead(
    numStr,
    question.prompt,
    question.marks,
    showMarks,
  )

  const wordBankBlock = question.wordBank?.trim()
    ? `#align(center)[#text(style: "italic", size: 11pt)[(${escapeTypst(question.wordBank.trim())})]]\n#v(8pt)`
    : ''

  const rows = question.items.map((item) => {
    const textWithPlaceholder = item.text.replace(/_{2,}|(?:\.){3,}|…+/g, 'TYPSTBLANKBOXTOKEN')
    const escaped = escapeTypst(textWithPlaceholder)
    const raw = escaped.replace(/TYPSTBLANKBOXTOKEN/g, '#box(width: 55pt, repeat[.])')

    return `#grid(
      columns: (auto, 1fr),
      gutter: (8pt, 0pt),
      align: (top + left, top + left),
      [#text(weight: "bold")[${item.label}]],
      [${raw}],
    )`
  })

  return `${lead}
  #v(6pt)
  ${wordBankBlock}
  ${rows.join('\n#v(12pt)\n')}`
}

function renderStructured(
  question: StructuredQuestion,
  numStr: string,
  showMarks: boolean,
): string {
  const lead = renderQuestionLead(
    numStr,
    question.prompt,
    question.marks,
    showMarks,
  )

  const subtextBlock = question.subtext?.trim()
    ? `#v(6pt)\n#align(center)[#text(style: "italic", size: 11.5pt)[${escapeTypst(question.subtext.trim())}]]`
    : ''

  const blankSpaceBlock =
    question.blankSpaceMm && question.blankSpaceMm > 0
      ? `#v(${question.blankSpaceMm}mm)`
      : ''

  const parts = question.parts.map((part) => ({
    label: present(part.label) ?? 'i',
    prompt: present(part.prompt),
    marks: formatMarks(part.marks),
    answerLines: part.answerLines ?? 0,
  }))

  if (parts.length === 0) {
    return `${lead}${subtextBlock}${blankSpaceBlock}`
  }

  const items = parts.map((part) => {
    const partLead = `#grid(
      columns: ${showMarks ? '(auto, 1fr, auto)' : '(auto, 1fr)'},
      gutter: ${showMarks ? '(8pt, 0pt, 8pt)' : '(8pt, 0pt)'},
      align: (top + left, top + left),
      [#text(weight: "bold")[(${part.label})]],
      [${part.prompt ?? ''}],${showMarks ? `\n      [#text(size: 9pt)[(${part.marks})]]` : ''}
    )`

    let linesBlock = ''
    if (part.answerLines > 0) {
      const lineList = Array.from(
        { length: part.answerLines },
        () =>
          `#v(20pt)\n#line(length: 100%, stroke: (paint: luma(25%), dash: "dotted", thickness: 0.8pt))`,
      ).join('\n')
      linesBlock = `\n${lineList}`
    }

    return `#block(breakable: false)[
      ${partLead}${linesBlock}
    ]`
  })

  return `${lead}
  ${subtextBlock}
  #v(8pt)
  ${items.join('\n#v(16pt)\n')}
  ${blankSpaceBlock}`
}


function renderQuestion(
  question: Question,
  numStr: string,
  showMarks: boolean,
): string {
  if (question.kind === 'mcq') {
    return renderMcq(question, numStr, showMarks)
  } else if (question.kind === 'true-false') {
    return renderTrueFalse(question, numStr, showMarks)
  } else if (question.kind === 'fill-blanks') {
    return renderFillBlanks(question, numStr, showMarks)
  }
  return renderStructured(question, numStr, showMarks)
}


function renderEndOfPaper(): string {
  return `#v(15pt)
  #line(length: 100%, stroke: 0.6pt)
  #v(5pt)
  #align(center)[
    *END OF PAPER*
  ]`
}

function renderAnswerKey(questions: Question[]): string {
  const lines: string[] = []

  questions.forEach((q, qIndex) => {
    const qNum = q.number || qIndex + 1
    if (q.kind === 'mcq') {
      if (q.subItems && q.subItems.length > 0) {
        const subAnswers = q.subItems
          .map((sub) => {
            const corr = sub.options.findIndex((o) => o.isCorrect)
            return `${sub.label} ${corr >= 0 ? LOWER_OPTION_LABELS[corr] : '—'}`
          })
          .join(', ')
        lines.push(`[*${qNum}.* MCQ: ${subAnswers}]`)
      } else {
        const letters = q.options
          .map((o, i) => (o.isCorrect ? (OPTION_LABELS[i] ?? 'A') : null))
          .filter(Boolean)
          .join(', ')
        lines.push(`[*${qNum}.* ${letters || '—'}]`)
      }
    } else if (q.kind === 'true-false') {
      const answers = q.statements
        .map((s) => `${s.label} ${s.isTrue ? 'True' : 'False'}`)
        .join(', ')
      lines.push(`[*${qNum}.* T/F: ${answers}]`)
    } else if (q.kind === 'fill-blanks') {
      const answers = q.items
        .map((it) => `${it.label} ${it.answer ?? ''}`)
        .filter(Boolean)
        .join(', ')
      lines.push(`[*${qNum}.* Fill: ${answers}]`)
    }
  })

  if (lines.length === 0) return ''

  return `
#pagebreak()

#text(size: 14pt, weight: "bold")[Answer Key]

#v(8pt)

#grid(
  columns: (1fr, 1fr),
  gutter: (10pt, 20pt),
  ${lines.join(',\n  ')}
)
`
}

/* -------------------------------------------------------------------------- */
/*                              Document assembly                             */
/* -------------------------------------------------------------------------- */

export interface BuildTypstOptions {
  showAnswerKey?: boolean
  showMarks?: boolean
}

export function buildTypstSource(
  document: ExamDocument,
  options: BuildTypstOptions = {},
): string {
  const showAnswerKey = options.showAnswerKey ?? document.display.showAnswerKey
  const showMarks = options.showMarks ?? document.display.showMarks
  const twoDigit = document.display.twoDigitNumbering !== false
  const footerText = present(document.header.footer)
  const isBoxed = document.header.style === 'boxed'
  const fontName =
    document.header.fontFamily === 'sans' ? 'Noto Sans' : 'Libertinus Serif'
  const watermark = present(document.header.watermark)
  const watermarkSize = document.header.watermarkSize ?? 68
  const watermarkLuma = document.header.watermarkLuma ?? 94
  const watermarkAngle = document.header.watermarkAngle ?? -45
  const watermarkWeight =
    document.header.watermarkWeight === 'regular' ? 'regular' : 'bold'

  const backgroundSetup = watermark
    ? `  background: rotate(${watermarkAngle}deg)[#text(font: "${fontName}", size: ${watermarkSize}pt, fill: luma(${watermarkLuma}%), weight: "${watermarkWeight}")[${watermark}]],`
    : ''

  const footerSetup = footerText
    ? `  footer: context [#grid(columns: (1fr, auto), align: (left + horizon, right + horizon), [#text(font: "${fontName}", size: 9pt, fill: luma(45%))[${footerText}]], [#text(font: "${fontName}", size: 11pt)[#counter(page).display()]])],`
    : `  footer: context align(right)[#text(font: "${fontName}", size: 11pt)[#counter(page).display()]],`

  const pageSetup = [
    '#set page(',
    '  paper: "a4",',
    '  margin: (top: 20mm, bottom: 20mm, left: 22mm, right: 22mm),',
    backgroundSetup,
    footerSetup,
    ')',
  ]
    .filter(Boolean)
    .join('\n')

  // Group questions by section/part.
  // Part I questions come first, followed by Part II.
  const partOneQuestions: Question[] = []
  const partTwoQuestions: Question[] = []
  const otherQuestions: Question[] = []

  document.questions.forEach((q) => {
    const partUpper = q.part?.toUpperCase()
    if (partUpper === 'PART I' || partUpper === 'PART 1' || (!q.part && (q.kind === 'mcq' || q.kind === 'true-false' || q.kind === 'fill-blanks'))) {
      partOneQuestions.push(q)
    } else if (partUpper === 'PART II' || partUpper === 'PART 2' || (!q.part && q.kind === 'structured')) {
      partTwoQuestions.push(q)
    } else {
      otherQuestions.push(q)
    }
  })

  // Assemble question blocks with proper part headings
  const questionBlocks: string[] = []

  const renderPartGroup = (partTitle: string, list: Question[]) => {
    if (list.length === 0) return
    const heading = isBoxed
      ? (partTitle.includes('I') && !partTitle.includes('II')
          ? 'PART I – MULTIPLE CHOICE QUESTIONS'
          : 'PART II – STRUCTURED QUESTIONS')
      : partTitle

    questionBlocks.push(
      `#v(16pt)\n#align(center)[\n  #text(size: 13pt, weight: "bold")[#underline[${heading}]]\n]\n#v(12pt)`,
    )

    list.forEach((question, index) => {
      const numStr = formatQuestionNumber(index + 1, twoDigit)
      questionBlocks.push(renderQuestion(question, numStr, showMarks))
    })
  }

  renderPartGroup('PART I', partOneQuestions)
  renderPartGroup('PART II', partTwoQuestions)
  if (otherQuestions.length > 0) {
    otherQuestions.forEach((question, index) => {
      const numStr = formatQuestionNumber(
        partOneQuestions.length + partTwoQuestions.length + index + 1,
        twoDigit,
      )
      questionBlocks.push(renderQuestion(question, numStr, showMarks))
    })
  }

  const sections = [
    renderHeader(document.header),
    renderInstructions(document.instructions, document.header.style),
    questionBlocks.join('\n#v(16pt)\n'),
    document.display.showEndOfPaper !== false ? renderEndOfPaper() : '',
  ].filter((section) => section.trim().length > 0)

  return `${pageSetup}

#set text(font: "${fontName}", size: 11.5pt, lang: "en")
#set par(justify: true, leading: 0.8em)
#show heading: it => text(weight: "bold")

${sections.join('\n#v(14pt)\n')}
${showAnswerKey ? renderAnswerKey(document.questions) : ''}
`

}

