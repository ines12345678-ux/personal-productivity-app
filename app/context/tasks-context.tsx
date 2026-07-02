// app/context/tasks-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import {
  SEED_AREA_UNIVERSITY,
  SEED_AREA_WORK,
  SEED_AREA_GENERAL,
  SEED_PROJECT_TFG,
  SEED_PROJECT_AUTOMATION,
} from './categories-context'

export type Subtask = { id: string; title: string; done: boolean }
export type Task = {
  id: string
  title: string
  areaId: string
  projectId: string | null
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  subtasks: Subtask[]
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Write TFG introduction',
    areaId: SEED_AREA_UNIVERSITY,
    projectId: SEED_PROJECT_TFG,
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-07-10',
    subtasks: [
      { id: 's1', title: 'Outline sections', done: true },
      { id: 's2', title: 'Write abstract', done: false },
    ],
  },
  {
    id: '2',
    title: 'Fix PCB test script',
    areaId: SEED_AREA_WORK,
    projectId: SEED_PROJECT_AUTOMATION,
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-07-05',
    subtasks: [],
  },
]

type TasksContextType = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  const updateTask = (id: string, partial: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...partial } : task))
    )
  }

  const addTask = (title: string) => {
    if (!title.trim()) return
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      areaId: SEED_AREA_GENERAL,
      projectId: null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      subtasks: [],
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setSelectedTaskId((current) => (current === id ? null : current))
  }

  const addSubtask = (taskId: string, title: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    updateTask(taskId, {
      subtasks: [...task.subtasks, { id: crypto.randomUUID(), title, done: false }],
    })
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    updateTask(taskId, {
      subtasks: task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      ),
    })
  }

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    updateTask(taskId, { subtasks: task.subtasks.filter((s) => s.id !== subtaskId) })
  }

  const reorderWithinStatus = (status: Task['status'], orderedIds: string[]) => {
    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== status)
      const reordered = orderedIds
        .map((id) => prev.find((t) => t.id === id))
        .filter((t): t is Task => !!t)
      return [...others, ...reordered]
    })
  }

  const moveTaskToStatus = (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status })
  }

  return (
    <TasksContext.Provider
      value={{
        tasks,
        setTasks,
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