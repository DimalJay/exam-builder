import { CheckSquare, FormInput, ListChecks, TextQuote } from 'lucide-react'

import { QuestionCard } from '@/components/editor/QuestionCard'
import { Button } from '@/components/ui/button'
import { useExamDocument, useExamDispatch, useExamTotals } from '@/state/useExam'

export function QuestionsTab() {
  const { questions } = useExamDocument()
  const { totalMarks } = useExamTotals()
  const dispatch = useExamDispatch()

  if (questions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm font-medium">No questions yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Choose a question type to start building your paper.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => dispatch({ type: 'question/add', kind: 'mcq' })}
          >
            <ListChecks />
            Add MCQ
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'true-false' })}
          >
            <CheckSquare />
            Add True/False
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'fill-blanks' })}
          >
            <FormInput />
            Add Fill-in-Blanks
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'structured' })}
          >
            <TextQuote />
            Add Structured
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'} ·{' '}
          {totalMarks} {totalMarks === 1 ? 'mark' : 'marks'} total
        </p>

        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'mcq' })}
            title="Add Multiple Choice Question"
          >
            <ListChecks />
            MCQ
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'true-false' })}
            title="Add True/False Question"
          >
            <CheckSquare />
            T/F
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => dispatch({ type: 'question/add', kind: 'fill-blanks' })}
            title="Add Fill in Blanks Question"
          >
            <FormInput />
            Fill
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() =>
              dispatch({ type: 'question/add', kind: 'structured' })
            }
            title="Add Structured Question"
          >
            <TextQuote />
            Structured
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            isFirst={index === 0}
            isLast={index === questions.length - 1}
          />
        ))}
      </div>
    </div>
  )
}