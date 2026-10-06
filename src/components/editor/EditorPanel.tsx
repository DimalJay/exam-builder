import type { ComponentType } from 'react'

import { DisplayTab } from '@/components/editor/DisplayTab'
import { HeaderTab } from '@/components/editor/HeaderTab'
import { InstructionsTab } from '@/components/editor/InstructionsTab'
import { QuestionsTab } from '@/components/editor/QuestionsTab'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ExamDocument } from '@/domain/exam'
import { useExamDocument } from '@/state/useExam'

interface EditorTab {
  value: string
  label: string
  Panel: ComponentType
  /** Badge count; tabs that make no sense with a number omit it. */
  count?: (document: ExamDocument) => number
}

/**
 * Adding a tab is a one-line change here. The trigger, the badge and the
 * scrollable panel all derive from this list, so they cannot fall out of sync.
 */
const EDITOR_TABS: EditorTab[] = [
  {
    value: 'questions',
    label: 'Questions',
    Panel: QuestionsTab,
    count: (document) => document.questions.length,
  },
  { value: 'header', label: 'Header', Panel: HeaderTab },
  {
    value: 'instructions',
    label: 'Instructions',
    Panel: InstructionsTab,
    // The general directive counts as one item alongside the list entries.
    count: (document) => document.instructions.items.length + 1,
  },
  { value: 'display', label: 'Display', Panel: DisplayTab },
]

/**
 * The editor pane: a tab strip over a scrollable body.
 *
 * Each panel owns its own ScrollArea so a long question list scrolls
 * independently of the tab strip above it. Radix unmounts inactive panels,
 * which is what we want here: only the visible tab's form controls are in the
 * DOM, and switching back starts at the top.
 */
export function EditorPanel() {
  const document = useExamDocument()

  return (
    <Tabs defaultValue={EDITOR_TABS[0].value} className="flex h-full flex-col gap-0">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <TabsList className="w-full">
          {EDITOR_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.label}
              {tab.count ? <TabCount value={tab.count(document)} /> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {EDITOR_TABS.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="min-h-0 flex-1"
        >
          <ScrollArea className="h-full">
            <tab.Panel />
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Small count pill rendered beside a tab label. */
function TabCount({ value }: { value: number }) {
  return (
    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-px text-[0.65rem] font-medium tabular-nums text-muted-foreground">
      {value}
    </span>
  )
}