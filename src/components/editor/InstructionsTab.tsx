import { Plus, X } from 'lucide-react'

import { Field } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useExamDocument, useExamDispatch } from '@/state/useExam'

/**
 * The instructions tab: the general directive plus the ordered list of
 * candidate instructions rendered between the header and the questions.
 */
export function InstructionsTab() {
  const { instructions } = useExamDocument()
  const dispatch = useExamDispatch()

  return (
    <div className="flex flex-col gap-4 p-4">
      <Field
        htmlFor="instructions-general"
        label="General instruction"
        hint="Printed immediately below the heading."
      >
        <Textarea
          id="instructions-general"
          value={instructions.general}
          onChange={(event) =>
            dispatch({
              type: 'instructions/update',
              patch: { general: event.target.value },
            })
          }
          rows={2}
          className="resize-y"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Additional instructions
          </p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => dispatch({ type: 'instructions/item/add' })}
          >
            <Plus />
            Add item
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          {instructions.items.map((item, index) => (
            <div key={item.id} className="group flex items-center gap-2">
              <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
                ({toRoman(index + 1)})
              </span>
              <Input
                value={item.text}
                onChange={(event) =>
                  dispatch({
                    type: 'instructions/item/update',
                    id: item.id,
                    text: event.target.value,
                  })
                }
                placeholder="Instruction"
                aria-label={`Instruction ${index + 1}`}
                className="h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  dispatch({ type: 'instructions/item/remove', id: item.id })
                }
                aria-label={`Remove instruction ${index + 1}`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X />
              </Button>
            </div>
          ))}

          {instructions.items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No additional instructions.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Lowercase roman numerals, matching the `(i) (ii) (iii)` numbering the Typst
 * generator uses. Kept here so the editor preview and the rendered paper agree.
 */
function toRoman(value: number): string {
  const table: Array<[number, string]> = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ]

  let remaining = value
  let result = ''

  for (const [amount, symbol] of table) {
    while (remaining >= amount) {
      result += symbol
      remaining -= amount
    }
  }

  return result
}