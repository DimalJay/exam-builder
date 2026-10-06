# Exam Builder

A browser-based exam paper builder. Write an exam once — header, instructions,
questions and print options — and get a live preview plus a print-ready PDF,
all generated locally in the browser by [Typst](https://typst.app/) compiled to
WebAssembly.

No backend, no account, no uploads. Your paper autosaves to `localStorage` as
you type, and the preview is always the exact artefact that downloads.

## Highlights

- **Live preview** — the right pane recompiles the paper as you edit the left
  pane, so you always see the finished page.
- **Four question kinds** in one paper:
  - **Multiple choice** — single or multiple answer, 1/2/4/auto column grid,
    `a)` / `A.` option styles, and optional nested sub-questions `(i)–(v)`.
  - **True / False** — a list of numbered statements with the correct answer.
  - **Fill in the blanks** — items with an optional word bank.
  - **Structured** — parts with their own marks, dotted answer lines, optional
    subtext and a blank drawing space.
- **Header editor** — two preset templates (school evaluation & university
  boxed), serif/sans typography, title lines, duration, candidate name line,
  footer text, and a fully styled **watermark** (text, size, faintness, angle,
  weight).
- **Display controls** — show/hide the answer key, mark counts, two-digit
  numbering (`01.` vs `1.`) and the END OF PAPER banner, so a candidate's copy
  and a marker's copy come from the same document.
- **PDF export** — one click downloads a print-ready A4 PDF with embedded
  fonts.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). The paper autosaves to
your browser and is restored on reload.

### Scripts

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Start the Vite dev server with HMR                  |
| `npm run build`  | Type-check (`tsc -b`) and produce a production build |
| `npm run lint`   | Run ESLint across the project                       |
| `npm run preview`| Serve the production build locally                  |

## How the preview works

Typst is a markup-based typesetting language. Every document is compiled by a
WASM build of the Typst compiler running in the browser:

1. The left pane edits a plain `ExamDocument` object (see
   `src/domain/exam.ts`).
2. `src/typst/generate.ts` serialises it into Typst source.
3. `src/typst/useTypstPreview.ts` compiles that source with
   `@myriaddreamin/typst-ts-web-compiler` and renders the pages with
   `@myriaddreamin/typst-ts-renderer`.
4. Compile diagnostics feed the diagnostic list, and a successful compile feeds
   the export button.

## Project structure

```
src/
  domain/          # Plain data model: ExamDocument, ExamHeader, Question, …
                   # No framework or IO — the source of truth for the paper.
  domain/factory.ts# Default/template documents and helpers.
  state/           # useReducer app state: actions, reducer, localStorage
                   # persistence (storage.ts), and React hooks (useExam.ts).
  typst/           # Typst source generation + WASM compiler/renderer glue,
                   # including PDF download.
  components/
    editor/        # Left pane: Questions / Header / Instructions / Display tabs.
    preview/       # Right pane: live Typst preview, diagnostic list, export.
    layout/        # App shell and split-pane layout.
    ui/            # shadcn-style primitives (button, input, select, switch…).
```

### Data model in one screen

```
ExamDocument
├─ header        # title lines, duration, watermark, footer, boxed meta table
├─ instructions  # general directive + numbered instructions list
├─ display       # answer key, marks, numbering, END OF PAPER toggles
└─ questions     # union of Mcq | TrueFalse | FillBlanks | Structured
```

The document object is the single source of truth — every tab dispatches
actions against it and every feature reads from it. The preview and the
exported PDF are derived purely from that one object.

## Adding a new question kind

Questions are a discriminated union keyed on `kind`, so a new style is mostly
addition, not surgery:

1. Add the interface to `src/domain/exam.ts` and extend the `Question` union.
2. Add its renderer in `src/typst/generate.ts`.
3. Add an editor block in `src/components/editor/QuestionsTab.tsx`.

## Persistence

Documents are debounced-autosaved to `localStorage` under
`exam-builder:document:v1`. Reads are defensive: older or corrupted documents
are migrated with `withDefaults()` in `src/state/storage.ts` rather than
crashing the app. All storage access is confined to that file.