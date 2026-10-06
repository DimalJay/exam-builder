import { Plus, Trash2 } from 'lucide-react'

import { Field, NumberField } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { TrueFalseStatement } from '@/domain/exam'

interface TrueFalseQuestionEditorProps {
  questionId: string
  prompt: string
  marks: number
  statements: TrueFalseStatement[]
  onChange: (patch: { prompt?: string; marks?: number }) => void
  onStatementAdd: () => void
  onStatementRemove: (statementId: string) => void
  onStatementChange: (
    statementId: string,
    patch: Partial<TrueFalseStatement>,
  ) => void
}

export function TrueFalseQuestionEditor({
  questionId,
  prompt,
  marks,
  statements,
  onChange,
  onStatementAdd,
  onStatementRemove,
  onStatementChange,
}: TrueFalseQuestionEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field htmlFor={`${questionId}-prompt`} label="Question Directive">
        <Textarea
          id={`${questionId}-prompt`}
          value={prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Write whether the following statements are true or false."
          rows={2}
          className="resize-y"
        />
      </Field>

      <NumberField
        htmlFor={`${questionId}-marks`}
        label="Total marks"
        value={marks}
        onValueChange={(val) => onChange({ marks: val })}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Statements ({statements.length})
          </p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onStatementAdd}
          >
            <Plus />
            Add statement
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {statements.map((stmt) => (
            <div
              key={stmt.id}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5"
            >
              <Input
                value={stmt.label}
                onChange={(e) =>
                  onStatementChange(stmt.id, { label: e.target.value })
                }
                placeholder="(i)"
                aria-label="Statement label"
                className="h-8 w-14 shrink-0 text-center font-mono text-xs"
              />

              <Input
                value={stmt.statement}
                onChange={(e) =>
                  onStatementChange(stmt.id, { statement: e.target.value })
                }
                placeholder="Growth is a characteristic of living organisms."
                aria-label="Statement text"
                className="h-8 flex-1 text-sm"
              />

              <div className="flex items-center gap-1.5 shrink-0 pt-1">
                <span className="text-[0.7rem] text-muted-foreground">
                  {stmt.isTrue ? 'True' : 'False'}
                </span>
                <Switch
                  checked={stmt.isTrue ?? true}
                  onCheckedChange={(checked) =>
                    onStatementChange(stmt.id, { isTrue: checked })
                  }
                  aria-label="True or False answer"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onStatementRemove(stmt.id)}
                disabled={statements.length <= 1}
                aria-label="Remove statement"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
