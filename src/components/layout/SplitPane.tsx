import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  /** Initial width of the left pane, in percent. */
  defaultLeftPercent?: number
  minPercent?: number
  maxPercent?: number
  className?: string
  leftLabel: string
  rightLabel: string
}

const KEYBOARD_STEP = 2
const DOUBLE_CLICK_PERCENT = 50

/**
 * Two resizable panes with a draggable divider.
 *
 * Intentionally generic — it knows nothing about exams or Typst — so it can be
 * reused for any side-by-side workspace.
 */
export function SplitPane({
  left,
  right,
  defaultLeftPercent = 50,
  minPercent = 25,
  maxPercent = 75,
  className,
  leftLabel,
  rightLabel,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent)
  const [isDragging, setIsDragging] = useState(false)

  const clamp = useCallback(
    (percent: number) => Math.min(maxPercent, Math.max(minPercent, percent)),
    [maxPercent, minPercent],
  )

  /**
   * Pointer capture keeps the drag alive even when the cursor leaves the
   * divider or the window, which is what makes the handle feel solid.
   */
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      if (rect.width === 0) return

      setLeftPercent(clamp(((event.clientX - rect.left) / rect.width) * 100))
    },
    [clamp],
  )

  useEffect(() => {
    if (!isDragging) return

    const stop = () => setIsDragging(false)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)

    // Prevent the browser's text-selection drag behaviour during the resize.
    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      document.body.style.userSelect = previousUserSelect
    }
  }, [isDragging, handlePointerMove])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowLeft'
        ? -KEYBOARD_STEP
        : event.key === 'ArrowRight'
          ? KEYBOARD_STEP
          : 0

    if (step !== 0) {
      event.preventDefault()
      setLeftPercent((percent) => clamp(percent + step))
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setLeftPercent(minPercent)
    }

    if (event.key === 'End') {
      event.preventDefault()
      setLeftPercent(maxPercent)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full min-h-0 w-full', className)}
      style={{
        // Grid tracks keep both panes independently scrollable; a flex split
        // would let the widest child push the other out of view.
        gridTemplateColumns: `${leftPercent}% 1px 1fr`,
        display: 'grid',
      }}
    >
      <div className="min-h-0 min-w-0 overflow-hidden">{left}</div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${leftLabel} and ${rightLabel} panes`}
        aria-valuenow={Math.round(leftPercent)}
        aria-valuemin={minPercent}
        aria-valuemax={maxPercent}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => setLeftPercent(clamp(DOUBLE_CLICK_PERCENT))}
        className={cn(
          'group relative cursor-col-resize bg-border outline-none transition-colors',
          'hover:bg-primary/40 focus-visible:bg-primary',
          isDragging && 'bg-primary',
        )}
      >
        {/* Widens the grab area without widening the visual rule. */}
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      <div className="min-h-0 min-w-0 overflow-hidden">{right}</div>
    </div>
  )
}