// app/page.tsx
'use client'

import { AlertTriangle, CheckCircle2, Clock3, LayoutDashboard } from 'lucide-react'
import { useTasksContext, Task } from './context/tasks-context'
import { useCategoriesContext } from './context/categories-context'
import { TaskDetailPanel } from './task-detail-panel'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg className="w-32 h-32 -rotate-90">
        <circle cx="64" cy="64" r={radius} strokeWidth="10" className="stroke-muted fill-none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-primary fill-none transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-foreground">{percent}%</span>
        <span className="text-[11px] text-muted-foreground">completado</span>
      </div>
    </div>
  )
}

const priorityBar: Record<Task['priority'], string> = {
  low: 'bg-muted-foreground/40',
  medium: 'bg-chart-4',
  high: 'bg-destructive',
}

export default function OverviewPage() {
  const { tasks, setSelectedTaskId } = useTasksContext()
  const { getAreaName, getProjectName, getAreaColorDot } = useCategoriesContext()

  const today = todayISO()
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const pending = total - done
  const completion = total === 0 ? 0 : Math.round((done / total) * 100)

  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  )
  const dueToday = tasks.filter((t) => t.dueDate === today && t.status !== 'done')

  const upcoming = tasks
    .filter((t) => t.dueDate && t.dueDate >= today && t.status !== 'done')
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 5)

  const byPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  }
  const maxPriority = Math.max(1, ...Object.values(byPriority))

  const byArea = tasks.reduce<Record<string, number>>((acc, t) => {
    const key = t.areaId ?? ''
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const maxArea = Math.max(1, ...Object.values(byArea))

  const formatDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* HERO */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-card border border-border rounded-2xl p-6">
        <ProgressRing percent={completion} />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tienes <span className="text-foreground font-medium">{pending}</span> tareas pendientes
            {overdue.length > 0 && (
              <> · <span className="text-destructive font-medium">{overdue.length} vencidas</span></>
            )}
            {dueToday.length > 0 && (
              <> · <span className="text-chart-4 font-medium">{dueToday.length} para hoy</span></>
            )}
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold text-foreground mt-1">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completadas
          </p>
          <p className="text-xl font-semibold text-foreground mt-1">{done}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" /> Pendientes
          </p>
          <p className="text-xl font-semibold text-foreground mt-1">{pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Vencidas
          </p>
          <p className={`text-xl font-semibold mt-1 ${overdue.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {overdue.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRIORIDAD */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Por prioridad</p>
          {(['high', 'medium', 'low'] as const).map((p) => (
            <div key={p} className="flex items-center gap-3">
              <span className="text-xs w-16 capitalize text-muted-foreground">{p}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${priorityBar[p]}`}
                  style={{ width: `${(byPriority[p] / maxPriority) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-4 text-right">{byPriority[p]}</span>
            </div>
          ))}
        </div>

        {/* ÁREA */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Por área</p>
          {Object.entries(byArea).map(([areaId, count]) => (
            <div key={areaId} className="flex items-center gap-3">
              <span className="text-xs w-20 truncate text-muted-foreground">{getAreaName(areaId)}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getAreaColorDot(areaId || null)}`}
                  style={{ width: `${(count / maxArea) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
            </div>
          ))}
          {Object.keys(byArea).length === 0 && (
            <p className="text-xs text-muted-foreground/60">Sin datos todavía</p>
          )}
        </div>
      </div>

      {/* VENCIDAS — solo si hay */}
      {overdue.length > 0 && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl divide-y divide-destructive/10">
          <div className="px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">Necesitan atención</p>
          </div>
          {overdue.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/5 text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                </p>
              </div>
              <span className="text-xs text-destructive font-medium">{formatDate(task.dueDate!)}</span>
            </button>
          ))}
        </div>
      )}

      {/* PRÓXIMAS TAREAS */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">Próximas tareas</p>
        </div>
        {upcoming.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-6">No hay tareas próximas</p>
        )}
        {upcoming.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTaskId(task.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 text-left"
          >
            <div className="flex items-center gap-3">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityBar[task.priority]}`} />
              <div>
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(task.dueDate!)}</span>
          </button>
        ))}
      </div>

      <TaskDetailPanel />
    </div>
  )
}
