import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useExamDocument, useExamDispatch } from '@/state/useExam'

/**
 * A labelled toggle row. The label is a `<label for>` rather than a plain
 * heading, so clicking the text toggles the switch too.
 */
function ToggleRow({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

/**
 * Which parts of the paper are printed.
 *
 * These live on the document rather than on the export dialog so the preview is
 * always the exact artefact that downloads: switching off the answer key here
 * strips it from the PDF you are about to save, with nothing else to configure.
 */
export function DisplayTab() {
  const { display } = useExamDocument()
  const dispatch = useExamDispatch()

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs text-muted-foreground">
        Applies to the preview and the exported PDF alike. A candidate's copy
        usually wants the answer key off; a marker's copy keeps it on.
      </p>

      <p className="text-xs font-medium text-foreground">Questions & answers</p>

      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <ToggleRow
          id="display-answer-key"
          label="Show answer key"
          hint="Appends an answer key page listing the correct option for each multiple-choice question."
        >
          <Switch
            id="display-answer-key"
            checked={display.showAnswerKey}
            onCheckedChange={(checked) =>
              dispatch({ type: 'display/update', patch: { showAnswerKey: checked } })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-marks"
          label="Show marks"
          hint="Prints the mark count beside each question and sub-part, e.g. “(2 marks)”."
        >
          <Switch
            id="display-marks"
            checked={display.showMarks}
            onCheckedChange={(checked) =>
              dispatch({ type: 'display/update', patch: { showMarks: checked } })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-two-digit"
          label="Two-digit question numbering (01., 02.)"
          hint="Numbers questions with leading zeros (01., 02.) as standard in school examination papers."
        >
          <Switch
            id="display-two-digit"
            checked={display.twoDigitNumbering !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { twoDigitNumbering: checked },
              })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-end-of-paper"
          label="Show END OF PAPER banner"
          hint="Prints an END OF PAPER divider, pinned to the bottom of the final page."
        >
          <Switch
            id="display-end-of-paper"
            checked={display.showEndOfPaper !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { showEndOfPaper: checked },
              })
            }
          />
        </ToggleRow>
      </div>

      <p className="text-xs font-medium text-foreground">Page layout</p>

      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <ToggleRow
          id="display-instructions"
          label="Show instructions"
          hint="Prints the instructions block (general directive and numbered list) between the header and the questions."
        >
          <Switch
            id="display-instructions"
            checked={display.showInstructions !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { showInstructions: checked },
              })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-header-meta"
          label="Show header details"
          hint="Prints the header extras: time duration, unit/topic line and the details table."
        >
          <Switch
            id="display-header-meta"
            checked={display.showHeaderMeta !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { showHeaderMeta: checked },
              })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-watermark"
          label="Show watermark"
          hint="Prints the diagonal watermark text set on the Header tab. Turning it off keeps the text for later."
        >
          <Switch
            id="display-watermark"
            checked={display.showWatermark !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { showWatermark: checked },
              })
            }
          />
        </ToggleRow>

        <div className="h-px bg-border" />

        <ToggleRow
          id="display-page-numbers"
          label="Show page numbers & footer"
          hint="Prints the page number in the bottom corner, plus the footer text from the Header tab when one is set."
        >
          <Switch
            id="display-page-numbers"
            checked={display.showPageNumbers !== false}
            onCheckedChange={(checked) =>
              dispatch({
                type: 'display/update',
                patch: { showPageNumbers: checked },
              })
            }
          />
        </ToggleRow>
      </div>
    </div>
  )
}