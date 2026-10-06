import { EditorPanel } from '@/components/editor/EditorPanel'
import { SplitPane } from '@/components/layout/SplitPane'
import { TypstPreview } from '@/components/preview/TypstPreview'
import { useExamTotals } from '@/state/useExam'

/**
 * The application shell: a compact status bar over the split workspace.
 * Pure composition — it wires the two panes together and shows document totals.
 */
export function ExamWorkspace() {
  const { questionCount, totalMarks } = useExamTotals()

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
        <h1 className="text-sm font-semibold tracking-tight">Exam Paper Editor</h1>

        <span className="text-xs text-muted-foreground">
          {questionCount} {questionCount === 1 ? 'question' : 'questions'} ·{' '}
          {totalMarks} {totalMarks === 1 ? 'mark' : 'marks'}
        </span>

        <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
          Autosaved to this browser
        </span>
      </header>

      <main className="min-h-0 flex-1">
        <SplitPane
          leftLabel="Editor"
          rightLabel="Preview"
          left={<EditorPanel />}
          right={<TypstPreview />}
        />
      </main>
    </div>
  )
}