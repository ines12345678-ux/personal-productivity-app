'use client'

import { ChevronsLeft, Command, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navSections } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type SidebarProps = {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Alberola</span>
            <span className="text-xs text-muted-foreground">
              Personal Planner
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-6">
          {navSections.map((section) => (
            <li key={section.label}>
              {!collapsed && (
                <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.title : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                          collapsed && 'justify-center px-0',
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-[18px] shrink-0 transition-colors',
                            active
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-sidebar-foreground',
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronsLeft
            className={cn(
              'size-[18px] shrink-0 transition-transform duration-300',
              collapsed && 'rotate-180',
            )}
            aria-hidden="true"
          />
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-sidebar-accent/50 px-3 py-2 text-xs text-muted-foreground">
            <span>Quick search</span>
            <kbd className="inline-flex items-center gap-0.5 rounded-md border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px]">
              <Command className="size-3" aria-hidden="true" />K
            </kbd>
          </div>
        )}
      </div>
    </aside>
  )
}
