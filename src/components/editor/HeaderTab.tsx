import { BookOpen, GraduationCap, Plus, X } from 'lucide-react'

import { Field, NumberField } from '@/components/editor/Field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createBoxedExamDocument,
  createScienceExamDocument,
} from '@/domain/factory'
import { useExamDispatch, useExamDocument } from '@/state/useExam'

export function HeaderTab() {
  const { header } = useExamDocument()
  const dispatch = useExamDispatch()
  const isSchool = header.style !== 'boxed'

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ----------------- Template Quick Switcher ----------------- */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-foreground">Preset Templates</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isSchool ? 'default' : 'outline'}
            size="xs"
            onClick={() =>
              dispatch({
                type: 'document/load',
                document: createScienceExamDocument(),
              })
            }
            className="flex-1 text-[0.75rem]"
          >
            <BookOpen className="size-3.5 mr-1" />
            Science Unit Evaluation
          </Button>
          <Button
            type="button"
            variant={!isSchool ? 'default' : 'outline'}
            size="xs"
            onClick={() =>
              dispatch({
                type: 'document/load',
                document: createBoxedExamDocument(),
              })
            }
            className="flex-1 text-[0.75rem]"
          >
            <GraduationCap className="size-3.5 mr-1" />
            University Boxed
          </Button>
        </div>
      </div>

      {/* ----------------- Paper Style & Typography ----------------- */}
      <div className="grid grid-cols-2 gap-3">
        <Field htmlFor="header-style" label="Header Style">
          <Select
            value={header.style ?? 'school'}
            onValueChange={(value) =>
              dispatch({
                type: 'header/update',
                patch: { style: value as 'school' | 'boxed' },
              })
            }
          >
            <SelectTrigger id="header-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="school">School / Evaluation (Clean)</SelectItem>
              <SelectItem value="boxed">University (Boxed Table)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field htmlFor="header-font" label="Typography">
          <Select
            value={header.fontFamily ?? 'serif'}
            onValueChange={(value) =>
              dispatch({
                type: 'header/update',
                patch: { fontFamily: value as 'serif' | 'sans' },
              })
            }
          >
            <SelectTrigger id="header-font">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="serif">Times New Roman (Serif)</SelectItem>
              <SelectItem value="sans">Sans-serif (Noto Sans)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* ----------------- Header Titles ----------------- */}
      <div className="flex flex-col gap-3">
        <Field
          htmlFor="header-title"
          label={isSchool ? 'Subject & Grade (Line 1)' : 'Paper Title'}
        >
          <Input
            id="header-title"
            value={header.title}
            placeholder={isSchool ? 'Grade 6 - Science' : 'Examination Title'}
            onChange={(event) =>
              dispatch({
                type: 'header/update',
                patch: { title: event.target.value },
              })
            }
          />
        </Field>

        <Field
          htmlFor="header-subtitle"
          label={isSchool ? 'Evaluation / Exam Type (Line 2)' : 'Subtitle'}
        >
          <Input
            id="header-subtitle"
            value={header.subtitle}
            placeholder={isSchool ? 'Unit Evaluation' : 'Midterm / Final'}
            onChange={(event) =>
              dispatch({
                type: 'header/update',
                patch: { subtitle: event.target.value },
              })
            }
          />
        </Field>

        <Field
          htmlFor="header-unit"
          label={isSchool ? 'Unit / Topic (Line 3)' : 'Course Code & Name'}
        >
          <Input
            id="header-unit"
            value={header.unit ?? header.course ?? ''}
            placeholder={isSchool ? 'Unit 01 - Wonders of the Living World' : 'CS101'}
            onChange={(event) =>
              dispatch({
                type: 'header/update',
                patch: isSchool
                  ? { unit: event.target.value }
                  : { course: event.target.value },
              })
            }
          />
        </Field>

        <Field htmlFor="header-time" label="Time Duration">
          <Input
            id="header-time"
            value={header.time ?? ''}
            placeholder="1 ½ hours"
            onChange={(event) =>
              dispatch({
                type: 'header/update',
                patch: { time: event.target.value },
              })
            }
          />
        </Field>

        {isSchool && (
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="header-name-line" className="text-xs font-medium">
                Candidate Name Line
              </Label>
              <p className="text-xs text-muted-foreground">
                Prints &ldquo;Name: ....................&rdquo; on the header bar
              </p>
            </div>
            <Switch
              id="header-name-line"
              checked={header.showCandidateName !== false}
              onCheckedChange={(checked) =>
                dispatch({
                  type: 'header/update',
                  patch: { showCandidateName: checked },
                })
              }
            />
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <Field
            htmlFor="header-watermark"
            label="Watermark Text"
            hint="Faint diagonal text on every page (e.g. Teacher/School name). Leave empty to disable."
          >
            <Input
              id="header-watermark"
              value={header.watermark ?? ''}
              placeholder="Exam Craft"
              onChange={(event) =>
                dispatch({
                  type: 'header/update',
                  patch: { watermark: event.target.value },
                })
              }
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <NumberField
              htmlFor="watermark-size"
              label="Size (pt)"
              value={header.watermarkSize ?? 68}
              min={20}
              max={160}
              onValueChange={(value) =>
                dispatch({
                  type: 'header/update',
                  patch: { watermarkSize: value },
                })
              }
            />
            <NumberField
              htmlFor="watermark-faintness"
              label="Faintness"
              value={header.watermarkLuma ?? 94}
              min={50}
              max={98}
              onValueChange={(value) =>
                dispatch({
                  type: 'header/update',
                  patch: { watermarkLuma: value },
                })
              }
            />
            <NumberField
              htmlFor="watermark-angle"
              label="Angle (°)"
              value={header.watermarkAngle ?? -45}
              min={-90}
              max={90}
              onValueChange={(value) =>
                dispatch({
                  type: 'header/update',
                  patch: { watermarkAngle: value },
                })
              }
            />
          </div>
          <p className="-mt-1 text-xs text-muted-foreground/80">
            Faintness 50–98: higher is lighter, lower is darker and more visible.
          </p>

          <Field htmlFor="watermark-weight" label="Weight">
            <Select
              value={header.watermarkWeight ?? 'bold'}
              onValueChange={(value) =>
                dispatch({
                  type: 'header/update',
                  patch: { watermarkWeight: value as 'bold' | 'regular' },
                })
              }
            >
              <SelectTrigger id="watermark-weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* ----------------- Boxed Style Metadata Table ----------------- */}
      {!isSchool && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Details table
            </p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => dispatch({ type: 'header/metadata/add' })}
            >
              <Plus />
              Add row
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            {header.metadata.map((entry) => (
              <div key={entry.id} className="group flex items-center gap-2">
                <Input
                  value={entry.label}
                  onChange={(event) =>
                    dispatch({
                      type: 'header/metadata/update',
                      id: entry.id,
                      patch: { label: event.target.value },
                    })
                  }
                  placeholder="Label"
                  aria-label="Detail label"
                  className="h-8 w-32 shrink-0"
                />
                <Input
                  value={entry.value}
                  onChange={(event) =>
                    dispatch({
                      type: 'header/metadata/update',
                      id: entry.id,
                      patch: { value: event.target.value },
                    })
                  }
                  placeholder="Value"
                  aria-label="Detail value"
                  className="h-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    dispatch({ type: 'header/metadata/remove', id: entry.id })
                  }
                  aria-label="Remove detail row"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X />
                </Button>
              </div>
            ))}

            {header.metadata.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No detail rows. Add rows such as Duration, Marks or Pages.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* ----------------- Footer ----------------- */}
      <Field
        htmlFor="header-footer"
        label="Custom page footer text"
        hint="By default, page numbers (1, 2, 3) are printed in the bottom right corner. Entering text here prints it beside the page number."
      >
        <Textarea
          id="header-footer"
          rows={2}
          placeholder="Leave blank for standard page numbering"
          className="resize-y"
          onChange={(event) =>
            dispatch({
              type: 'header/update',
              patch: { footer: event.target.value },
            })
          }
          value={header.footer ?? ''}
        />
      </Field>
    </div>
  )
}