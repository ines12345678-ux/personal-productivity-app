import { ListChecks, Plus, Search } from 'lucide-react'

export function TasksEmptyState({
  filtered,
  onCreate,
  onClearFilters,
}: {
  filtered: boolean
  onCreate: () => void
  onClearFilters?: () => void
}) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <Search className="size-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          No matching tasks
        </h3>
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          Try adjusting your search or filters to find what you are looking for.
        </p>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <ListChecks className="size-8" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl font-semibold tracking-tight">
          Your task list is clear
        </h3>
        <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          This is where everything you need to do comes together. Capture your
          first task and start building momentum.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" aria-hidden="true" />
        Create your first task
      </button>
    </div>
  )
}
