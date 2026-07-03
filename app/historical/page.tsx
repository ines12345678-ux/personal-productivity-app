// app/history/page.tsx
'use client'

import { useMemo } from 'react'
import { Archive, RotateCcw } from 'lucide-react'
import { useTasksContext } from '../context/tasks-context'
import { useCategoriesContext } from '../context/categories-context'

export default function HistoryPage() {
  const { historyTasks, restoreTaskFromHistory } = useTasksContext()
  const { areas, getAreaName, getProjectName, getAreaColorDot } = useCategoriesContext()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof historyTasks>()

    for (const task of historyTasks) {
      const key = task.areaId ?? '__no_area__'
      const current = map.get(key) ?? []
      current.push(task)
      map.set(key, current)
    }

    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === '__no_area__') return 1
      if (b[0] === '__no_area__') return -1

      const aIndex = areas.findIndex((area) => area.id === a[0])
      const bIndex = areas.findIndex((area) => area.id === b[0])

      return aIndex - bIndex
    })
  }, [historyTasks, areas])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
          <Archive className="w-6 h-6" />
          History
        </h1>
        <p className="text-sm text-muted-foreground">
          Tareas archivadas desde la columna Done
        </p>
      </div>

      {historyTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay tareas en el historial.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([areaId, tasks]) => (
            <section key={areaId} className="space-y-3">
              <div className="flex items-center gap-2">
                {areaId !== '__no_area__' && (
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${getAreaColorDot(areaId)}`}
                  />
                )}
                <h2 className="text-lg font-semibold text-foreground">
                  {areaId === '__no_area__' ? 'Sin categoría' : getAreaName(areaId)}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {tasks.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.projectId ? getProjectName(task.projectId) : 'Sin proyecto'}
                        </p>
                      </div>

                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {task.priority}
                      </span>
                    </div>

                    {task.subtasks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Subtareas
                        </p>
                        <ul className="space-y-1">
                          {task.subtasks.map((subtask) => (
                            <li
                              key={subtask.id}
                              className="text-xs text-muted-foreground flex items-center gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
                              <span className={subtask.done ? 'line-through' : ''}>
                                {subtask.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 text-[11px] text-muted-foreground/80 border-t border-border">
                      Archivada:{' '}
                      {task.archivedAt
                        ? new Date(task.archivedAt).toLocaleString('es-ES')
                        : '—'}
                    </div>

                    <button
                      onClick={() => restoreTaskFromHistory(task.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore to To Do
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}