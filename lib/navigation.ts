import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  type LucideIcon,
  NotebookPen,
  Plane,
  Settings,
  KanbanSquare,
  Sprout,
  Wallet,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        description: 'Your day at a glance across every part of life.',
      },
    ],
  },
  {
    label: 'Work',
    items: [
            {
        title: 'Planner',
        href: '/planner',
        icon: CalendarDays,
        description: 'Design your week with calm, intentional planning.',
      },
      {
        title: 'Tasks',
        href: '/tasks',
        icon: CheckCircle2,
        description: 'Capture, organize, and complete what matters.',
      },

      {
        title: 'Notes',
        href: '/notes',
        icon: NotebookPen,
        description: 'A quiet space for ideas, docs, and knowledge.',
      },
    ],
  },
  {
    label: 'Life',
    items: [
      {
        title: 'Habits',
        href: '/habits',
        icon: Sprout,
        description: 'Build routines and watch small wins compound.',
      },
      {
        title: 'Finances',
        href: '/finances',
        icon: Wallet,
        description: 'Understand your money with effortless clarity.',
      },
      {
        title: 'Travel',
        href: '/travel',
        icon: Plane,
        description: 'Plan trips and keep every itinerary in one place.',
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        title: 'Statistics',
        href: '/statistics',
        icon: BarChart3,
        description: 'Trends and reflections drawn from your workspace.',
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Tune Aura to match the way you think and work.',
      },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap(
  (section) => section.items,
)
