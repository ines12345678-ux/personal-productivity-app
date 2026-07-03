// app/context/tasks-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Subtask = { id: string; title: string; done: boolean }

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Task = {
  id: string
  title: string
  areaId: string | null
  projectId: string | null
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  subtasks: Subtask[]
  archived: boolean
  archivedAt: string | null
}

type TasksContextType = {
  tasks: Task[] // tareas activas
  historyTasks: Task[] // tareas archivadas
  loading: boolean
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  selectedTask: Task | null

  updateTask: (id: string, partial: Partial<Task>) => Promise<void>
  addTask: (title: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  addSubtask: (taskId: string, title: string) => Promise<void>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>

  reorderWithinStatus: (status: TaskStatus, orderedIds: string[]) => void
  moveTaskToStatus: (taskId: string, status: TaskStatus) => void

  archiveDoneTasks: () => Promise<void>
  restoreTaskFromHistory: (taskId: string) => Promise<void>
}

const TasksContext = createContext<TasksContextType | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [tasks, setTasks] = useState<Task[]>([])
  const [historyTasks, setHistoryTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  useEffect(() => {
    async function loadTasks() {
      setLoading(true)

      const { data: taskRows } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true })

      const { data: subtaskRows } = await supabase.from('subtasks').select('*')

      const mapped: Task[] = (taskRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        areaId: row.area_id,
        projectId: row.project_id,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        archived: row.archived ?? false,
        archivedAt: row.archived_at ?? null,
        subtasks: (subtaskRows ?? [])
          .filter((s) => s.task_id === row.id)
          .map((s) => ({
            id: s.id,
            title: s.title,
            done: s.done,
          })),
      }))

      setTasks(mapped.filter((t) => !t.archived))
      setHistoryTasks(mapped.filter((t) => t.archived))
      setLoading(false)
    }

    loadTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, loadTasks)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateTask = async (id: string, partial: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)))
    setHistoryTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)))

    const dbPartial: Record<string, unknown> = {}

    if (partial.title !== undefined) dbPartial.title = partial.title
    if (partial.areaId !== undefined) dbPartial.area_id = partial.areaId
    if (partial.projectId !== undefined) dbPartial.project_id = partial.projectId
    if (partial.status !== undefined) dbPartial.status = partial.status
    if (partial.priority !== undefined) dbPartial.priority = partial.priority
    if (partial.dueDate !== undefined) dbPartial.due_date = partial.dueDate
    if (partial.archived !== undefined) dbPartial.archived = partial.archived
    if (partial.archivedAt !== undefined) dbPartial.archived_at = partial.archivedAt

    if (Object.keys(dbPartial).length === 0) return

    await supabase.from('tasks').update(dbPartial).eq('id', id)
  }

  const addTask = async (title: string) => {
    if (!title.trim()) return

    const { data: userData } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        user_id: userData.user?.id,
        status: 'todo',
        priority: 'medium',
        archived: false,
        archived_at: null,
      })
      .select()
      .single()

    if (data) {
      setTasks((prev) => [
        {
          id: data.id,
          title: data.title,
          areaId: data.area_id,
          projectId: data.project_id,
          status: data.status,
          priority: data.priority,
          dueDate: data.due_date,
          archived: data.archived ?? false,
          archivedAt: data.archived_at ?? null,
          subtasks: [],
        },
        ...prev,
      ])
    }
  }

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setHistoryTasks((prev) => prev.filter((t) => t.id !== id))
    setSelectedTaskId((current) => (current === id ? null : current))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const addSubtask = async (taskId: string, title: string) => {
    if (!title.trim()) return

    const { data } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title: title.trim(), done: false })
      .select()
      .single()

    if (!data) return

    const appendSubtask = (list: Task[]) =>
      list.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...t.subtasks, { id: data.id, title: data.title, done: data.done }],
            }
          : t
      )

    setTasks((prev) => appendSubtask(prev))
    setHistoryTasks((prev) => appendSubtask(prev))
  }

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task =
      tasks.find((t) => t.id === taskId) ?? historyTasks.find((t) => t.id === taskId)

    const subtask = task?.subtasks.find((s) => s.id === subtaskId)
    if (!subtask) return

    const nextDone = !subtask.done

    const updateList = (list: Task[]) =>
      list.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: nextDone } : s
              ),
            }
          : t
      )

    setTasks((prev) => updateList(prev))
    setHistoryTasks((prev) => updateList(prev))

    await supabase.from('subtasks').update({ done: nextDone }).eq('id', subtaskId)
  }

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const updateList = (list: Task[]) =>
      list.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
            }
          : t
      )

    setTasks((prev) => updateList(prev))
    setHistoryTasks((prev) => updateList(prev))

    await supabase.from('subtasks').delete().eq('id', subtaskId)
  }

  const reorderWithinStatus = (status: TaskStatus, orderedIds: string[]) => {
    setTasks((prev) => {
      const sameStatus = prev.filter((t) => t.status === status && !t.archived)
      const others = prev.filter((t) => t.status !== status && !t.archived)

      if (sameStatus.length === 0) return prev

      const reordered = orderedIds
        .map((id) => sameStatus.find((t) => t.id === id))
        .filter((t): t is Task => !!t)

      const missing = sameStatus.filter((t) => !orderedIds.includes(t.id))

      return [...others, ...reordered, ...missing]
    })
  }

  const moveTaskToStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status })
  }

  const archiveDoneTasks = async () => {
    const doneTasks = tasks.filter((t) => t.status === 'done' && !t.archived)
    if (doneTasks.length === 0) return

    const ids = doneTasks.map((t) => t.id)
    const now = new Date().toISOString()

    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
    setHistoryTasks((prev) => [
      ...doneTasks.map((t) => ({
        ...t,
        archived: true,
        archivedAt: now,
      })),
      ...prev,
    ])

    if (selectedTaskId && ids.includes(selectedTaskId)) {
      setSelectedTaskId(null)
    }

    await supabase
      .from('tasks')
      .update({
        archived: true,
        archived_at: now,
      })
      .in('id', ids)
  }

  // 👇 NUEVO: restaurar una tarea archivada y devolverla a To Do
  const restoreTaskFromHistory = async (taskId: string) => {
    const taskToRestore = historyTasks.find((t) => t.id === taskId)
    if (!taskToRestore) return

    const restoredTask: Task = {
      ...taskToRestore,
      archived: false,
      archivedAt: null,
      status: 'todo',
    }

    // UI inmediata
    setHistoryTasks((prev) => prev.filter((t) => t.id !== taskId))
    setTasks((prev) => [restoredTask, ...prev])

    await supabase
      .from('tasks')
      .update({
        archived: false,
        archived_at: null,
        status: 'todo',
      })
      .eq('id', taskId)
  }

  return (
    <TasksContext.Provider
      value={{
        tasks,
        historyTasks,
        loading,
        selectedTaskId,
        setSelectedTaskId,
        selectedTask,
        updateTask,
        addTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        reorderWithinStatus,
        moveTaskToStatus,
        archiveDoneTasks,
        restoreTaskFromHistory,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) {
    throw new Error('useTasksContext debe usarse dentro de <TasksProvider>')
  }
  return ctx
}