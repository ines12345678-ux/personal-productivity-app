import { ArrowUpRight, type LucideIcon } from 'lucide-react'

type Highlight = {
  icon: LucideIcon
  title: string
  description: string
}

type PagePlaceholderProps = {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  highlights: Highlight[]
}

export function PagePlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
  highlights,
}: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 md:px-12 md:py-16">
        <div className="relative flex max-w-2xl flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {eyebrow}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <h2 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h2>
          </div>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((highlight) => {
          const HighlightIcon = highlight.icon
          return (
            <article
              key={highlight.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-ring/30"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <HighlightIcon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold tracking-tight">
                {highlight.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {highlight.description}
              </p>
            </article>
          )
        })}
      </section>

      {/* Coming soon canvas */}
      <section className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">
          This workspace is taking shape
        </h3>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          The foundation is ready. Interactive tools, data, and delightful
          details will live here as {title} comes to life.
        </p>
      </section>
    </div>
  )
}
