import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Copy,
  FormInput,
  ListChecks,
  TextQuote,
  Trash2,
} from 'lucide-react'

import { FillBlanksEditor } from '@/components/editor/questions/FillBlanksEditor'
import { McqQuestionEditor } from '@/components/editor/questions/McqQuestionEditor'
import { StructuredQuestionEditor } from '@/components/editor/questions/StructuredQuestionEditor'
import { TrueFalseQuestionEditor } from '@/components/editor/questions/TrueFalseQuestionEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Question } from '@/domain/exam'
import { cn } from '@/lib/utils'
import { useExamDispatch } from '@/state/useExam'

interface QuestionCardProps {
  question: Question
  isFirst: boolean
  isLast: boolean
}

export function QuestionCard({ question, isFirst, isLast }: QuestionCardProps) {
  const dispatch = useExamDispatch()

  const kindBadge = () => {
    switch (question.kind) {
      case 'mcq':
        return (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[0.7rem] font-medium">
            <ListChecks className="size-3" /> MCQ
          </Badge>
        )
      case 'true-false':
        return (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[0.7rem] font-medium">
            <CheckSquare className="size-3" /> True/False
          </Badge>
        )
      case 'fill-blanks':
        return (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[0.7rem] font-medium">
            <FormInput className="size-3" /> Fill-in
          </Badge>
        )
      case 'structured':
        return (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[0.7rem] font-medium">
            <TextQuote className="size-3" /> Structured
          </Badge>
        )
    }
  }

  return (
    <Card className="gap-0 p-0 shadow-none">
      {/* ------------------------------- toolbar ------------------------------ */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-semibold text-primary">
          {question.number}
        </span>

        {kindBadge()}

        {/* Part Selector */}
        <div className="w-24">
          <Select
            value={question.part ?? (question.kind === 'structured' ? 'PART II' : 'PART I')}
            onValueChange={(val) => {
              if (question.kind === 'mcq') {
                dispatch({
                  type: 'question/patch',
                  id: question.id,
                  update: { kind: 'mcq', patch: { part: val } },
                })
              } else if (question.kind === 'true-false') {
                dispatch({
                  type: 'question/patch',
                  id: question.id,
                  update: { kind: 'true-false', patch: { part: val } },
                })
              } else if (question.kind === 'fill-blanks') {
                dispatch({
                  type: 'question/patch',
                  id: question.id,
                  update: { kind: 'fill-blanks', patch: { part: val } },
                })
              } else {
                dispatch({
                  type: 'question/patch',
                  id: question.id,
                  update: { kind: 'structured', patch: { part: val } },
                })
              }
            }}
          >
            <SelectTrigger className="h-6 text-[0.7rem] px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PART I">PART I</SelectItem>
              <SelectItem value="PART II">PART II</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground">
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              dispatch({ type: 'question/move', id: question.id, direction: -1 })
            }
            disabled={isFirst}
            aria-label="Move question up"
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              dispatch({ type: 'question/move', id: question.id, direction: 1 })
            }
            disabled={isLast}
            aria-label="Move question down"
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => dispatch({ type: 'question/duplicate', id: question.id })}
            aria-label="Duplicate question"
          >
            <Copy />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => dispatch({ type: 'question/remove', id: question.id })}
            aria-label="Delete question"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* -------------------------------- body -------------------------------- */}
      <div className={cn('p-4')}>
        {question.kind === 'mcq' && (
          <McqQuestionEditor
            questionId={question.id}
            prompt={question.prompt}
            marks={question.marks}
            answerMode={question.answerMode}
            columns={question.columns}
            optionStyle={question.optionStyle}
            options={question.options}
            onChange={(patch) =>
              dispatch({
                type: 'question/patch',
                id: question.id,
                update: { kind: 'mcq', patch },
              })
            }
            onOptionAdd={() =>
              dispatch({ type: 'mcq/option/add', questionId: question.id })
            }
            onOptionRemove={(optionId) =>
              dispatch({
                type: 'mcq/option/remove',
                questionId: question.id,
                optionId,
              })
            }
            onOptionTextChange={(optionId, text) =>
              dispatch({
                type: 'mcq/option/update',
                questionId: question.id,
                optionId,
                text,
              })
            }
            onOptionCorrectChange={(optionId, isCorrect) =>
              dispatch({
                type: 'mcq/option/setCorrect',
                questionId: question.id,
                optionId,
                isCorrect,
              })
            }
          />
        )}

        {question.kind === 'true-false' && (
          <TrueFalseQuestionEditor
            questionId={question.id}
            prompt={question.prompt}
            marks={question.marks}
            statements={question.statements}
            onChange={(patch) =>
              dispatch({
                type: 'question/patch',
                id: question.id,
                update: { kind: 'true-false', patch },
              })
            }
            onStatementAdd={() =>
              dispatch({
                type: 'true-false/statement/add',
                questionId: question.id,
              })
            }
            onStatementRemove={(statementId) =>
              dispatch({
                type: 'true-false/statement/remove',
                questionId: question.id,
                statementId,
              })
            }
            onStatementChange={(statementId, patch) =>
              dispatch({
                type: 'true-false/statement/update',
                questionId: question.id,
                statementId,
                patch,
              })
            }
          />
        )}

        {question.kind === 'fill-blanks' && (
          <FillBlanksEditor
            questionId={question.id}
            prompt={question.prompt}
            marks={question.marks}
            wordBank={question.wordBank}
            items={question.items}
            onChange={(patch) =>
              dispatch({
                type: 'question/patch',
                id: question.id,
                update: { kind: 'fill-blanks', patch },
              })
            }
            onItemAdd={() =>
              dispatch({
                type: 'fill-blanks/item/add',
                questionId: question.id,
              })
            }
            onItemRemove={(itemId) =>
              dispatch({
                type: 'fill-blanks/item/remove',
                questionId: question.id,
                itemId,
              })
            }
            onItemChange={(itemId, patch) =>
              dispatch({
                type: 'fill-blanks/item/update',
                questionId: question.id,
                itemId,
                patch,
              })
            }
          />
        )}

        {question.kind === 'structured' && (
          <StructuredQuestionEditor
            questionId={question.id}
            prompt={question.prompt}
            subtext={question.subtext}
            blankSpaceMm={question.blankSpaceMm}
            marks={question.marks}
            parts={question.parts}
            onChange={(patch) =>
              dispatch({
                type: 'question/patch',
                id: question.id,
                update: { kind: 'structured', patch },
              })
            }
            onPartAdd={() =>
              dispatch({ type: 'part/add', questionId: question.id })
            }
            onPartRemove={(partId) =>
              dispatch({
                type: 'part/remove',
                questionId: question.id,
                partId,
              })
            }
            onPartChange={(partId, patch) =>
              dispatch({
                type: 'part/update',
                questionId: question.id,
                partId,
                patch,
              })
            }
          />
        )}
      </div>
    </Card>
  )
}