'use client'

import { Bell, Command, Menu, Plus, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { navItems } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type TopbarProps = {
  onOpenSearch: () => void
  onOpenMobileNav: () => void
}

export function Topbar({ onOpenSearch, onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname()
  const current =
    navItems.find((item) =>
      item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
    ) ?? navItems[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile nav trigger */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Page title */}
      <div className="flex min-w-0 flex-col">
        <h1 className="truncate text-base font-semibold tracking-tight">
          {current.title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {current.description}
        </p>
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            'group flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground',
            'w-9 justify-center sm:w-64 sm:justify-start',
          )}
          aria-label="Open global search"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden flex-1 text-left sm:inline">
            Search anything…
          </span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
            <Command className="size-3" aria-hidden="true" />K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />
        </button>

        {/* Quick add */}
        <button
          type="button"
          className="hidden size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:flex"
          aria-label="Create new"
        >
          <Plus className="size-[18px]" aria-hidden="true" />
        </button>

        {/* Avatar */}
        <button
          type="button"
          className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-accent text-sm font-medium text-accent-foreground transition-shadow hover:ring-2 hover:ring-ring/30"
          aria-label="Account menu"
        >
          ML
        </button>
      </div>
    </header>
  )
}
