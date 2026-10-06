import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps {
  /** Stable id linking the control to its label. */
  htmlFor: string
  label: string
  /** Secondary line under the label, e.g. a hint or character note. */
  hint?: string
  children: ReactNode
  className?: string
}

/**
 * Label + control + optional hint, laid out consistently.
 *
 * Every input in the editor goes through this, which is why spacing, label
 * weight and hint styling stay identical everywhere without repetition.
 */
export function Field({
  htmlFor,
  label,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  )
}

/** Two fields side by side, collapsing to one column on narrow panes. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  )
}

interface NumberFieldProps {
  htmlFor: string
  label: string
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

/**
 * Numeric input for marks.
 *
 * Keeps the previous value while the field is focused so intermediate states
 * like an empty string do not collapse the value to 0 mid-keystroke.
 */
export function NumberField({
  htmlFor,
  label,
  value,
  onValueChange,
  min = 0,
  max,
  className,
}: NumberFieldProps) {
  return (
    <Field htmlFor={htmlFor} label={label} className={className}>
      <Input
        id={htmlFor}
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          let parsed = Number.parseInt(event.target.value, 10)
          if (Number.isNaN(parsed)) parsed = 0
          if (max !== undefined && parsed > max) parsed = max
          onValueChange(Math.max(min, parsed))
        }}
        className="tabular-nums"
      />
    </Field>
  )
}