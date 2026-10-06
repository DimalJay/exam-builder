import { BrandLogo } from '@/components/brand/BrandLogo'
import { EditorPanel } from '@/components/editor/EditorPanel'
import { ImportJsonButton } from '@/components/layout/ImportJsonButton'
import { SplitPane } from '@/components/layout/SplitPane'
import { TypstPreview } from '@/components/preview/TypstPreview'
import { useExamTotals } from '@/state/useExam'

/**
 * The application shell: a sleek branded status bar over the split workspace.
 */
export function ExamWorkspace() {
  const { questionCount, totalMarks } = useExamTotals()

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <BrandLogo size="md" />

          <div className="hidden h-4 w-px bg-border sm:block" />

          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs sm:flex">
            <span className="font-medium text-foreground">
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="font-medium text-foreground">
              {totalMarks} {totalMarks === 1 ? 'mark' : 'marks'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ImportJsonButton />

          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Autosaved to browser</span>
            <span className="sm:hidden">Saved</span>
          </span>
        </div>
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