import { Plus, Trash2 } from 'lucide-react'

import { Field, NumberField } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FillBlankItem } from '@/domain/exam'

interface FillBlanksEditorProps {
  questionId: string
  prompt: string
  marks: number
  wordBank?: string
  items: FillBlankItem[]
  onChange: (patch: { prompt?: string; marks?: number; wordBank?: string }) => void
  onItemAdd: () => void
  onItemRemove: (itemId: string) => void
  onItemChange: (itemId: string, patch: Partial<FillBlankItem>) => void
}

export function FillBlanksEditor({
  questionId,
  prompt,
  marks,
  wordBank,
  items,
  onChange,
  onItemAdd,
  onItemRemove,
  onItemChange,
}: FillBlanksEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field htmlFor={`${questionId}-prompt`} label="Question Directive">
        <Textarea
          id={`${questionId}-prompt`}
          value={prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Fill in the blanks using the most suitable word."
          rows={2}
          className="resize-y"
        />
      </Field>

      <Field
        htmlFor={`${questionId}-wordbank`}
        label="Word Bank / Pool"
        hint="Comma-separated words shown in italics in parentheses above the questions"
      >
        <Input
          id={`${questionId}-wordbank`}
          value={wordBank ?? ''}
          placeholder="reproduction, photosynthesis, autotrophic, micro organisms, locomotion"
          onChange={(event) => onChange({ wordBank: event.target.value })}
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
            Sentences ({items.length})
            <span className="ml-1.5 font-normal text-muted-foreground/70">
              (use ______ or ... for the blank)
            </span>
          </p>
          <Button type="button" variant="ghost" size="xs" onClick={onItemAdd}>
            <Plus />
            Add sentence
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={item.label}
                  onChange={(e) =>
                    onItemChange(item.id, { label: e.target.value })
                  }
                  placeholder="(i)"
                  aria-label="Sentence label"
                  className="h-8 w-14 shrink-0 text-center font-mono text-xs"
                />
                <Input
                  value={item.text}
                  onChange={(e) =>
                    onItemChange(item.id, { text: e.target.value })
                  }
                  placeholder="Organisms that produce their own food are called ______ organisms."
                  aria-label="Sentence text with blank"
                  className="h-8 flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onItemRemove(item.id)}
                  disabled={items.length <= 1}
                  aria-label="Remove sentence"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="flex items-center gap-2 pl-16">
                <span className="text-[0.7rem] font-medium text-muted-foreground">
                  Answer key:
                </span>
                <Input
                  value={item.answer ?? ''}
                  onChange={(e) =>
                    onItemChange(item.id, { answer: e.target.value })
                  }
                  placeholder="autotrophic"
                  aria-label="Correct word"
                  className="h-7 max-w-xs text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
