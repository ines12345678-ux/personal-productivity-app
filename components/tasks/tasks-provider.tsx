'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  type Subtask,
  type Task,
  type TaskPriority,
  type TaskStatus,
  seedTasks,
} from '@/lib/tasks-data'

export type NewTaskInput = {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  areaId: string
  projectId?: string | null
  dueDate?: string | null
  tags?: string[]
}

type TasksContextValue = {
  tasks: Task[]
  addTask: (input: NewTaskInput) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskDone: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  getTask: (id: string) => Task | undefined
}

const TasksContext = createContext<TasksContextValue | null>(null)

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)

  const addTask = useCallback((input: NewTaskInput) => {
    const id = uid('task')
    const task: Task = {
      id,
      title: input.title.trim(),
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'none',
      areaId: input.areaId,
      projectId: input.projectId ?? null,
      dueDate: input.dueDate ?? null,
      tags: input.tags ?? [],
      subtasks: [],
      notes: '',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setTasks((prev) => [task, ...prev])
    return id
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleTaskDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t,
      ),
    )
  }, [])

  const addSubtask = useCallback((taskId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const subtask: Subtask = { id: uid('sub'), title: trimmed, done: false }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t,
      ),
    )
  }, [])

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s,
              ),
            }
          : t,
      ),
    )
  }, [])

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t,
      ),
    )
  }, [])

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  )

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      getTask,
    }),
    [
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      getTask,
    ],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return ctx
}
