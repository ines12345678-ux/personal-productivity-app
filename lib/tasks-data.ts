import type { LucideIcon } from 'lucide-react'
import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react'

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export type Subtask = {
  id: string
  title: string
  done: boolean
}

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  areaId: string
  projectId: string | null
  dueDate: string | null // ISO date (yyyy-mm-dd)
  tags: string[]
  subtasks: Subtask[]
  notes: string
  createdAt: string
}

export type Area = {
  id: string
  name: string
  emoji: string
}

export type Project = {
  id: string
  areaId: string
  name: string
}

export const areas: Area[] = [
  { id: 'university', name: 'University', emoji: '🎓' },
  { id: 'work', name: 'Work', emoji: '💼' },
  { id: 'personal', name: 'Personal', emoji: '🏠' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'finances', name: 'Finances', emoji: '💰' },
]

export const projects: Project[] = [
  { id: 'fdp', areaId: 'university', name: 'Final Degree Project' },
  { id: 'electronics', areaId: 'university', name: 'Electronics' },
  { id: 'digital-systems', areaId: 'university', name: 'Digital Systems' },
  { id: 'automation', areaId: 'work', name: 'Automation' },
  { id: 'client-a', areaId: 'work', name: 'Client A' },
  { id: 'home', areaId: 'personal', name: 'Home' },
  { id: 'health', areaId: 'personal', name: 'Health' },
  { id: 'japan', areaId: 'travel', name: 'Japan' },
  { id: 'new-york', areaId: 'travel', name: 'New York' },
  { id: 'budget', areaId: 'finances', name: 'Budget' },
]

export const statusConfig: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; className: string; dot: string }
> = {
  backlog: {
    label: 'Backlog',
    icon: CircleDashed,
    className: 'text-muted-foreground',
    dot: 'bg-muted-foreground/50',
  },
  todo: {
    label: 'To do',
    icon: Circle,
    className: 'text-muted-foreground',
    dot: 'bg-sky-500',
  },
  in_progress: {
    label: 'In progress',
    icon: CircleDot,
    className: 'text-amber-600 dark:text-amber-500',
    dot: 'bg-amber-500',
  },
  done: {
    label: 'Done',
    icon: CircleCheck,
    className: 'text-emerald-600 dark:text-emerald-500',
    dot: 'bg-emerald-500',
  },
}

export const statusOrder: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'done',
]

export const priorityConfig: Record<
  TaskPriority,
  { label: string; icon: LucideIcon; className: string; rank: number }
> = {
  urgent: {
    label: 'Urgent',
    icon: Signal,
    className: 'text-red-600 dark:text-red-500',
    rank: 4,
  },
  high: {
    label: 'High',
    icon: SignalHigh,
    className: 'text-orange-600 dark:text-orange-500',
    rank: 3,
  },
  medium: {
    label: 'Medium',
    icon: SignalMedium,
    className: 'text-yellow-600 dark:text-yellow-500',
    rank: 2,
  },
  low: {
    label: 'Low',
    icon: SignalLow,
    className: 'text-sky-600 dark:text-sky-500',
    rank: 1,
  },
  none: {
    label: 'No priority',
    icon: Signal,
    className: 'text-muted-foreground',
    rank: 0,
  },
}

export const priorityOrder: TaskPriority[] = [
  'urgent',
  'high',
  'medium',
  'low',
  'none',
]

export function getArea(areaId: string): Area | undefined {
  return areas.find((a) => a.id === areaId)
}

export function getProject(projectId: string | null): Project | undefined {
  if (!projectId) return undefined
  return projects.find((p) => p.id === projectId)
}

export function projectsForArea(areaId: string): Project[] {
  return projects.filter((p) => p.areaId === areaId)
}

export function taskProgress(task: Task): number {
  if (task.subtasks.length === 0) return task.status === 'done' ? 100 : 0
  const completed = task.subtasks.filter((s) => s.done).length
  return Math.round((completed / task.subtasks.length) * 100)
}

const today = new Date()
function isoOffset(days: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Write literature review chapter',
    description:
      'Draft the first version of the literature review for the final degree project, focusing on recent papers about edge computing.',
    status: 'in_progress',
    priority: 'high',
    areaId: 'university',
    projectId: 'fdp',
    dueDate: isoOffset(2),
    tags: ['writing', 'research'],
    subtasks: [
      { id: 's1', title: 'Collect 20 key papers', done: true },
      { id: 's2', title: 'Summarize each paper', done: true },
      { id: 's3', title: 'Write the synthesis', done: false },
      { id: 's4', title: 'Proofread with supervisor', done: false },
    ],
    notes: 'Supervisor prefers IEEE citation style.',
    createdAt: isoOffset(-6),
  },
  {
    id: 'task-2',
    title: 'Prepare electronics lab report',
    description:
      'Complete the report for the op-amp experiment including measurements and error analysis.',
    status: 'todo',
    priority: 'medium',
    areaId: 'university',
    projectId: 'electronics',
    dueDate: isoOffset(5),
    tags: ['lab'],
    subtasks: [
      { id: 's1', title: 'Plot frequency response', done: false },
      { id: 's2', title: 'Compute gain error', done: false },
    ],
    notes: '',
    createdAt: isoOffset(-3),
  },
  {
    id: 'task-3',
    title: 'Ship automation pipeline v2',
    description:
      'Finalize the new automation pipeline and deploy it to the staging environment for review.',
    status: 'in_progress',
    priority: 'urgent',
    areaId: 'work',
    projectId: 'automation',
    dueDate: isoOffset(1),
    tags: ['deploy', 'infra'],
    subtasks: [
      { id: 's1', title: 'Refactor scheduler', done: true },
      { id: 's2', title: 'Add retry logic', done: true },
      { id: 's3', title: 'Write integration tests', done: false },
      { id: 's4', title: 'Deploy to staging', done: false },
      { id: 's5', title: 'Notify the team', done: false },
    ],
    notes: 'Coordinate deploy window with DevOps.',
    createdAt: isoOffset(-10),
  },
  {
    id: 'task-4',
    title: 'Send proposal to Client A',
    description:
      'Draft and send the updated project proposal with revised pricing and timeline.',
    status: 'todo',
    priority: 'high',
    areaId: 'work',
    projectId: 'client-a',
    dueDate: isoOffset(3),
    tags: ['sales'],
    subtasks: [
      { id: 's1', title: 'Update pricing table', done: true },
      { id: 's2', title: 'Review with manager', done: false },
    ],
    notes: '',
    createdAt: isoOffset(-2),
  },
  {
    id: 'task-5',
    title: 'Deep clean the apartment',
    description: 'Weekend reset — kitchen, bathroom, and closet organization.',
    status: 'backlog',
    priority: 'low',
    areaId: 'personal',
    projectId: 'home',
    dueDate: isoOffset(6),
    tags: ['chores'],
    subtasks: [],
    notes: '',
    createdAt: isoOffset(-1),
  },
  {
    id: 'task-6',
    title: 'Book annual health checkup',
    description: 'Schedule the yearly checkup and blood test.',
    status: 'todo',
    priority: 'medium',
    areaId: 'personal',
    projectId: 'health',
    dueDate: isoOffset(9),
    tags: ['health'],
    subtasks: [{ id: 's1', title: 'Call the clinic', done: false }],
    notes: '',
    createdAt: isoOffset(-4),
  },
  {
    id: 'task-7',
    title: 'Plan Japan itinerary',
    description:
      'Outline the two-week Japan trip: cities, transport, and must-see spots.',
    status: 'in_progress',
    priority: 'medium',
    areaId: 'travel',
    projectId: 'japan',
    dueDate: isoOffset(14),
    tags: ['itinerary'],
    subtasks: [
      { id: 's1', title: 'Choose cities', done: true },
      { id: 's2', title: 'Book JR pass', done: false },
      { id: 's3', title: 'Reserve ryokan', done: false },
    ],
    notes: 'Cherry blossom season peaks early April.',
    createdAt: isoOffset(-8),
  },
  {
    id: 'task-8',
    title: 'Review monthly budget',
    description:
      'Go through last month spending and adjust the budget categories.',
    status: 'done',
    priority: 'low',
    areaId: 'finances',
    projectId: 'budget',
    dueDate: isoOffset(-1),
    tags: ['money'],
    subtasks: [
      { id: 's1', title: 'Categorize expenses', done: true },
      { id: 's2', title: 'Set next month limits', done: true },
    ],
    notes: '',
    createdAt: isoOffset(-12),
  },
]
