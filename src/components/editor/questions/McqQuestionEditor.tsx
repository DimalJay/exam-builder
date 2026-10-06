import { Trash2 } from 'lucide-react'

import { Field, FieldRow, NumberField } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { McqAnswerMode, McqColumns, McqOption, McqOptionStyle } from '@/domain/exam'
import { OPTION_LABELS } from '@/domain/factory'

interface McqOptionRowProps {
  option: McqOption
  label: string
  answerMode: 'single' | 'multiple'
  onTextChange: (text: string) => void
  onCorrectChange: (isCorrect: boolean) => void
  onRemove: () => void
  canRemove: boolean
}

/**
 * One editable MCQ option.
 *
 * Extracted so `McqQuestionEditor` renders the list with a plain `.map`. The
 * correctness control switches between a radio (single-answer) and a checkbox
 * (multi-answer) — the same intent, two interaction models.
 */
export function McqOptionRow({
  option,
  label,
  answerMode,
  onTextChange,
  onCorrectChange,
  onRemove,
  canRemove,
}: McqOptionRowProps) {
  const id = `option-${option.id}`

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-md border border-transparent px-1.5 py-1 transition-colors',
        'hover:border-border hover:bg-muted/40',
      )}
    >
      {answerMode === 'single' ? (
        <RadioGroup
          value={option.isCorrect ? 'correct' : ''}
          onValueChange={(value) => onCorrectChange(value === 'correct')}
          // `w-auto` overrides the component's own `w-full`. Without it the group
          // claims the whole row and squeezes the option text field down to a
          // couple of pixels, making the answer impossible to type into.
          className="w-auto shrink-0"
        >
          <RadioGroupItem
            id={`${id}-correct`}
            value="correct"
            aria-label={`Mark option ${label} as correct`}
          />
        </RadioGroup>
      ) : (
        <Checkbox
          id={`${id}-correct`}
          checked={option.isCorrect}
          onCheckedChange={(checked) => onCorrectChange(checked === true)}
          aria-label={`Mark option ${label} as correct`}
          className="shrink-0"
        />
      )}

      <span className="w-4 shrink-0 text-center font-mono text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <Input
        id={id}
        value={option.text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder={`Option ${label}`}
        className="h-8 border-transparent bg-transparent font-normal shadow-none hover:border-input focus-visible:border-ring"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Remove option ${label}`}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Question editor                               */
/* -------------------------------------------------------------------------- */

/** Scalar fields of an MCQ that the editor can patch. */
type McqQuestionPatch = {
  prompt: string
  marks: number
  answerMode: McqAnswerMode
  columns?: McqColumns
  optionStyle?: McqOptionStyle
}

interface McqQuestionEditorProps {
  questionId: string
  prompt: string
  marks: number
  answerMode: McqAnswerMode
  columns?: McqColumns
  optionStyle?: McqOptionStyle
  options: McqOption[]
  onChange: (patch: Partial<McqQuestionPatch>) => void
  onOptionAdd: () => void
  onOptionRemove: (optionId: string) => void
  onOptionTextChange: (optionId: string, text: string) => void
  onOptionCorrectChange: (optionId: string, isCorrect: boolean) => void
}

const MAX_OPTIONS = OPTION_LABELS.length

/** Editor body for a multiple-choice question. */
export function McqQuestionEditor({
  questionId,
  prompt,
  marks,
  answerMode,
  columns,
  optionStyle,
  options,
  onChange,
  onOptionAdd,
  onOptionRemove,
  onOptionTextChange,
  onOptionCorrectChange,
}: McqQuestionEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field htmlFor={`${questionId}-prompt`} label="Question">
        <Textarea
          id={`${questionId}-prompt`}
          value={prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="What is the capital of Sri Lanka?"
          rows={2}
          className="resize-y"
        />
      </Field>

      <FieldRow>
        <NumberField
          htmlFor={`${questionId}-marks`}
          label="Marks"
          value={marks}
          onValueChange={(value) => onChange({ marks: value })}
        />

        <Field htmlFor={`${questionId}-mode`} label="Answer mode">
          <Select
            value={answerMode}
            onValueChange={(value) =>
              onChange({ answerMode: value as 'single' | 'multiple' })
            }
          >
            <SelectTrigger id={`${questionId}-mode`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single correct</SelectItem>
              <SelectItem value="multiple">Multiple correct</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldRow>

      <FieldRow>
        <Field htmlFor={`${questionId}-cols`} label="Columns Layout">
          <Select
            value={String(columns ?? (options.length <= 4 ? 4 : 2))}
            onValueChange={(val) =>
              onChange({ columns: Number(val) as 1 | 2 | 4 })
            }
          >
            <SelectTrigger id={`${questionId}-cols`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 Columns (1 line across)</SelectItem>
              <SelectItem value="2">2 Columns (2 x 2 grid)</SelectItem>
              <SelectItem value="1">1 Column (stacked)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field htmlFor={`${questionId}-optstyle`} label="Option Labels">
          <Select
            value={optionStyle ?? 'alpha-paren'}
            onValueChange={(val) =>
              onChange({ optionStyle: val as 'alpha-paren' | 'alpha-dot' })
            }
          >
            <SelectTrigger id={`${questionId}-optstyle`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha-paren">a), b), c), d)</SelectItem>
              <SelectItem value="alpha-dot">A., B., C., D.</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldRow>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Options
            <span className="ml-1.5 font-normal text-muted-foreground/70">
              {answerMode === 'single'
                ? 'select one correct answer'
                : 'select all correct answers'}
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onOptionAdd}
            disabled={options.length >= MAX_OPTIONS}
          >
            Add option
          </Button>
        </div>

        <div className="flex flex-col gap-0.5">
          {options.map((option, index) => (
            <McqOptionRow
              key={option.id}
              option={option}
              label={OPTION_LABELS[index] ?? String.fromCharCode(65 + index)}
              answerMode={answerMode}
              onTextChange={(text) => onOptionTextChange(option.id, text)}
              onCorrectChange={(isCorrect) =>
                onOptionCorrectChange(option.id, isCorrect)
              }
              onRemove={() => onOptionRemove(option.id)}
              canRemove={options.length > 2}
            />
          ))}
        </div>
      </div>
    </div>
  )
}