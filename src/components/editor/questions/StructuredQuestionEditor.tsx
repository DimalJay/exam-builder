import { Plus, Trash2 } from 'lucide-react'

import { Field, NumberField } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { StructuredPart } from '@/domain/exam'

interface StructuredPartRowProps {
  part: StructuredPart
  onChange: (patch: Partial<StructuredPart>) => void
  onRemove: () => void
  canRemove: boolean
}

/** One editable sub-part of a structured question. */
function StructuredPartRow({
  part,
  onChange,
  onRemove,
  canRemove,
}: StructuredPartRowProps) {
  const id = `part-${part.id}`

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border bg-muted/25 p-3">
      <div className="flex items-end gap-2">
        <Field htmlFor={`${id}-label`} label="Label" className="w-16">
          <Input
            id={`${id}-label`}
            value={part.label}
            onChange={(event) => onChange({ label: event.target.value })}
            placeholder="i"
            className="h-8 text-center font-mono"
          />
        </Field>

        <NumberField
          htmlFor={`${id}-marks`}
          label="Marks"
          value={part.marks}
          onValueChange={(marks) => onChange({ marks })}
          className="w-20"
        />

        <NumberField
          htmlFor={`${id}-lines`}
          label="Dotted lines"
          value={part.answerLines ?? 3}
          min={0}
          max={10}
          onValueChange={(lines) => onChange({ answerLines: lines })}
          className="w-24"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove part ${part.label}`}
          className="mb-0.5 shrink-0 text-muted-foreground"
        >
          <Trash2 />
        </Button>
      </div>

      <Field htmlFor={`${id}-prompt`} label="Part Prompt">
        <Textarea
          id={`${id}-prompt`}
          value={part.prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Name the three main groups of organisms."
          rows={2}
          className="resize-y bg-background"
        />
      </Field>
    </div>
  )
}

interface StructuredQuestionEditorProps {
  questionId: string
  prompt: string
  subtext?: string
  blankSpaceMm?: number
  marks: number
  parts: StructuredPart[]
  onChange: (patch: Partial<{ prompt: string; subtext: string; blankSpaceMm: number; marks: number }>) => void
  onPartAdd: () => void
  onPartRemove: (partId: string) => void
  onPartChange: (
    partId: string,
    patch: Partial<StructuredPart>,
  ) => void
}

/** Editor body for a long-form, optionally-parted question. */
export function StructuredQuestionEditor({
  questionId,
  prompt,
  subtext,
  blankSpaceMm,
  marks,
  parts,
  onChange,
  onPartAdd,
  onPartRemove,
  onPartChange,
}: StructuredQuestionEditorProps) {
  const partTotal = parts.reduce((total, part) => total + part.marks, 0)
  const unallocated = marks - partTotal

  return (
    <div className="flex flex-col gap-4">
      <Field htmlFor={`${questionId}-prompt`} label="Question Directive">
        <Textarea
          id={`${questionId}-prompt`}
          value={prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Answer the following questions briefly."
          rows={2}
          className="resize-y"
        />
      </Field>

      <Field
        htmlFor={`${questionId}-subtext`}
        label="Context / Item List (Italics)"
        hint="Optional list, e.g. for classification: 'Earthworm, giraffe, monkey, butterfly, bat'"
      >
        <Input
          id={`${questionId}-subtext`}
          value={subtext ?? ''}
          placeholder="Earthworm, giraffe, monkey, butterfly, bat"
          onChange={(event) => onChange({ subtext: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          htmlFor={`${questionId}-marks`}
          label="Total marks"
          value={marks}
          onValueChange={(value) => onChange({ marks: value })}
        />

        <NumberField
          htmlFor={`${questionId}-blankspace`}
          label="Drawing Space (mm)"
          value={blankSpaceMm ?? 0}
          min={0}
          max={150}
          onValueChange={(value) => onChange({ blankSpaceMm: value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Sub-questions / Parts
            <span className="ml-1.5 font-normal text-muted-foreground/70">
              {parts.length === 0
                ? '(none — uses drawing space)'
                : `${partTotal} of ${marks} marks allocated`}
            </span>
          </p>
          <Button type="button" variant="ghost" size="xs" onClick={onPartAdd}>
            <Plus />
            Add part
          </Button>
        </div>

        {parts.length > 0 && unallocated !== 0 ? (
          <p className="text-xs text-amber-700">
            {unallocated > 0
              ? `${unallocated} mark${unallocated === 1 ? '' : 's'} unallocated.`
              : `Parts exceed the total by ${Math.abs(unallocated)}.`}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {parts.map((part) => (
            <StructuredPartRow
              key={part.id}
              part={part}
              onChange={(patch) => onPartChange(part.id, patch)}
              onRemove={() => onPartRemove(part.id)}
              canRemove={parts.length > 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}