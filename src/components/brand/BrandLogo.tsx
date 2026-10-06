interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
}

export function BrandLogo({
  className = '',
  size = 'md',
  showBadge = true,
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'size-6',
    md: 'size-8',
    lg: 'size-9',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon Emblem */}
      <div
        className={`relative flex ${iconSizes[size]} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-1.5 shadow-sm shadow-indigo-500/25 ring-1 ring-black/5`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full text-white"
        >
          {/* Document outline with folded corner */}
          <path
            d="M5 4.5C5 3.67157 5.67157 3 6.5 3H14.5L19 7.5V19.5C19 20.3284 18.3284 21 17.5 21H6.5C5.67157 21 5 20.3284 5 19.5V4.5Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Folded corner flap */}
          <path
            d="M14 3V8H19"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          {/* Exam ruling lines */}
          <path
            d="M8.5 11.5H15.5M8.5 15H13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          {/* Pen / Quill nib accent */}
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* Brand Name Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight text-foreground ${textSizes[size]}`}
          >
            Exam<span className="text-indigo-600">Craft</span>
          </span>
          {showBadge && (
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Studio
            </span>
          )}
        </div>
        <span className="text-[0.68rem] font-medium text-muted-foreground hidden sm:block">
          Professional Exam Paper Builder
        </span>
      </div>
    </div>
  )
}
