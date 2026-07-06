import { useLogBarStore } from '@/hooks/useLogBarStore'
import { useValidation } from '@/hooks/useValidation'
import { cn } from '@/lib/utils'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'



export function LogBar() {
  const { issues, errors, warnings } = useValidation()

  const expanded = useLogBarStore((s) => s.expanded)
  const toggle = useLogBarStore((s) => s.toggle)
  const activeTab = useLogBarStore((s) => s.activeTab)
  const setActiveTab = useLogBarStore((s) => s.setActiveTab)



  return (
    <div className="bg-card/95 border-t shadow-lg backdrop-blur-sm">
      {/* Tab header row */}
      <div className="flex items-center">
        <div className="flex flex-1" role="tablist">

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'errors'}
            aria-controls="errors-panel"
            className={cn(
              'flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-1.5 text-xs font-medium',
              activeTab === 'errors'
                ? 'border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
            onClick={() => {
              if (activeTab === 'errors') {
                toggle()
              } else {
                setActiveTab('errors')
                if (!expanded) toggle()
              }
            }}
          >
            <OctagonXIcon
              className={cn(
                'size-3.5',
                errors.length > 0 ? 'text-destructive' : ''
              )}
            />
            Errors
            {issues.length > 0 && (
              <span
                className={cn(
                  'text-[10px] tabular-nums',
                  errors.length > 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}
              >
                {issues.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label={expanded ? 'Collapse log panel' : 'Expand log panel'}
          aria-expanded={expanded}
          className="cursor-pointer px-3 py-1.5"
          onClick={toggle}
        >
          {expanded ? (
            <ChevronDownIcon className="text-muted-foreground size-4" />
          ) : (
            <ChevronUpIcon className="text-muted-foreground size-4" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="max-h-40 space-y-1 overflow-y-auto border-t px-4 py-2">
          {activeTab === 'errors' && (
            <div role="tabpanel" id="errors-panel" aria-labelledby="errors-tab">
              {issues.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-start gap-1.5 py-2 text-xs">
                  <CircleCheckIcon className="size-3.5 text-emerald-500" />
                  No validation issues
                </div>
              ) : (
                <>
                  {errors.map((issue, i) => (
                    <div
                      key={`e-${i}`}
                      className="flex items-start gap-2 text-sm"
                    >
                      <OctagonXIcon className="text-destructive mt-0.5 size-4 shrink-0" />
                      <span className="text-muted-foreground">
                        {issue.message}
                      </span>
                    </div>
                  ))}
                  {warnings.map((issue, i) => (
                    <div
                      key={`w-${i}`}
                      className="flex items-start gap-2 text-sm"
                    >
                      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <span className="text-muted-foreground">
                        {issue.message}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}


        </div>
      )}
    </div>
  )
}
