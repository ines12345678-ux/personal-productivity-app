// app/context/tasks-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Subtask = { id: string; title: string; done: boolean }
export type Task = {
  id: string
  title: string
  areaId: string | null
  projectId: string | null
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  subtasks: Subtask[]
}

type TasksContextType = {
  tasks: Task[]
  loading: boolean
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  selectedTask: Task | null
  updateTask: (id: string, partial: Partial<Task>) => void
  addTask: (title: string) => void
  deleteTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  reorderWithinStatus: (status: Task['status'], orderedIds: string[]) => void
  moveTaskToStatus: (taskId: string, status: Task['status']) => void
}

const TasksContext = createContext<TasksContextType | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  useEffect(() => {
    async function loadTasks() {
      const { data: taskRows } = await supabase.from('tasks').select('*').order('created_at')
      const { data: subtaskRows } = await supabase.from('subtasks').select('*')

      const mapped: Task[] = (taskRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        areaId: row.area_id,
        projectId: row.project_id,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        subtasks: (subtaskRows ?? [])
          .filter((s) => s.task_id === row.id)
          .map((s) => ({ id: s.id, title: s.title, done: s.done })),
      }))

      setTasks(mapped)
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

    const dbPartial: Record<string, unknown> = {}
    if (partial.title !== undefined) dbPartial.title = partial.title
    if (partial.areaId !== undefined) dbPartial.area_id = partial.areaId
    if (partial.projectId !== undefined) dbPartial.project_id = partial.projectId
    if (partial.status !== undefined) dbPartial.status = partial.status
    if (partial.priority !== undefined) dbPartial.priority = partial.priority
    if (partial.dueDate !== undefined) dbPartial.due_date = partial.dueDate

    await supabase.from('tasks').update(dbPartial).eq('id', id)
  }

  const addTask = async (title: string) => {
    if (!title.trim()) return
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('tasks')
      .insert({ title: title.trim(), user_id: userData.user?.id, status: 'todo', priority: 'medium' })
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
          subtasks: [],
        },
        ...prev,
      ])
    }
  }

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setSelectedTaskId((current) => (current === id ? null : current))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const addSubtask = async (taskId: string, title: string) => {
    const { data } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, done: false })
      .select()
      .single()

    if (data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...t.subtasks, { id: data.id, title: data.title, done: data.done }] }
            : t
        )
      )
    }
  }

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    const subtask = task?.subtasks.find((s) => s.id === subtaskId)
    if (!subtask) return

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
          : t
      )
    )
    await supabase.from('subtasks').update({ done: !subtask.done }).eq('id', subtaskId)
  }

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
      )
    )
    await supabase.from('subtasks').delete().eq('id', subtaskId)
  }

  const reorderWithinStatus = (status: Task['status'], orderedIds: string[]) => {
    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== status)
      const reordered = orderedIds
        .map((id) => prev.find((t) => t.id === id))
        .filter((t): t is Task => !!t)
      return [...others, ...reordered]
    })
    // Nota: el orden visual es solo local por ahora (no hay columna "position"
    // en la tabla tasks). Si quieres que el orden también persista entre
    // dispositivos, añadimos una columna `position integer` más adelante.
  }

  const moveTaskToStatus = (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status })
  }

  return (
    <TasksContext.Provider
      value={{
        tasks,
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
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasksContext() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasksContext debe usarse dentro de <TasksProvider>')
  return ctx
}