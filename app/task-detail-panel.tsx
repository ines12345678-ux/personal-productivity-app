// app/task-detail-panel.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTasksContext, Task } from './context/tasks-context'
import { useCategoriesContext } from './context/categories-context'

const CREATE_NEW = '__create_new__'

function progress(task: Task) {
  return task.subtasks.length === 0
    ? 0
    : Math.round(
        (task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100
      )
}

export function TaskDetailPanel() {
  const {
    selectedTask,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasksContext()

  const { areas, projectsForArea, addArea, addProject } = useCategoriesContext()

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  if (!selectedTask) return null

  const availableProjects = projectsForArea(selectedTask.areaId)

  const handleAreaChange = (value: string) => {
    if (value === CREATE_NEW) {
      const name = window.prompt('Nombre de la nueva área:')
      if (!name || !name.trim()) return
      const newId = addArea(name.trim())
      updateTask(selectedTask.id, { areaId: newId, projectId: null })
      return
    }
    const stillValid = projectsForArea(value).some((p) => p.id === selectedTask.projectId)
    updateTask(selectedTask.id, {
      areaId: value,
      projectId: stillValid ? selectedTask.projectId : null,
    })
  }

  const handleProjectChange = (value: string) => {
    if (value === CREATE_NEW) {
      const name = window.prompt('Nombre del nuevo proyecto:')
      if (!name || !name.trim()) return
      const newId = addProject(name.trim(), selectedTask.areaId)
      updateTask(selectedTask.id, { projectId: newId })
      return
    }
    updateTask(selectedTask.id, { projectId: value || null })
  }

  return (
    <div className="fixed right-6 top-6 bottom-6 w-[400px] bg-card border-l-4 border-primary shadow-xl rounded-xl p-6 space-y-4 overflow-y-auto z-50">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
        <button onClick={() => setSelectedTaskId(null)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        className="w-full border border-border rounded p-2 bg-background text-foreground"
        value={selectedTask.title}
        onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          className="w-full border border-border rounded p-2 text-sm bg-background text-foreground"
          value={selectedTask.areaId}
          onChange={(e) => handleAreaChange(e.target.value)}
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
          <option value={CREATE_NEW}>+ Nueva área…</option>
        </select>

        <select
          className="w-full border border-border rounded p-2 text-sm bg-background text-foreground"
          value={selectedTask.projectId ?? ''}
          onChange={(e) => handleProjectChange(e.target.value)}
        >
          <option value="">Sin proyecto</option>
          {availableProjects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
          <option value={CREATE_NEW}>+ Nuevo proyecto…</option>
        </select>
      </div>

      <select
        className="w-full border border-border rounded p-2 bg-background text-foreground"
        value={selectedTask.status}
        onChange={(e) => updateTask(selectedTask.id, { status: e.target.value as Task['status'] })}
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        className="w-full border border-border rounded p-2 bg-background text-foreground"
        value={selectedTask.priority}
        onChange={(e) => updateTask(selectedTask.id, { priority: e.target.value as Task['priority'] })}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <input
        type="date"
        className="w-full border border-border rounded p-2 bg-background text-foreground"
        value={selectedTask.dueDate ?? ''}
        onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value || null })}
      />

      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Subtareas</span>
          {selectedTask.subtasks.length > 0 && (
            <span className="text-xs text-muted-foreground">{progress(selectedTask)}%</span>
          )}
        </div>

        {selectedTask.subtasks.length > 0 && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-chart-3 transition-all"
              style={{ width: `${progress(selectedTask)}%` }}
            />
          </div>
        )}

        <ul className="space-y-1">
          {selectedTask.subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={subtask.done}
                onChange={() => toggleSubtask(selectedTask.id, subtask.id)}
              />
              <span className={`flex-1 text-sm ${subtask.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {subtask.title}
              </span>
              <button onClick={() => deleteSubtask(selectedTask.id, subtask.id)} className="text-muted-foreground hover:text-destructive text-xs">
                ✕
              </button>
            </li>
          ))}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!newSubtaskTitle.trim()) return
            addSubtask(selectedTask.id, newSubtaskTitle.trim())
            setNewSubtaskTitle('')
          }}
          className="flex gap-2 pt-1"
        >
          <input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Añadir subtarea..."
            className="flex-1 border border-border rounded p-2 text-sm bg-background text-foreground"
          />
          <button type="submit" className="px-3 py-2 rounded-md bg-muted text-sm text-foreground">
            Añadir
          </button>
        </form>
      </div>

      <button
        onClick={() => deleteTask(selectedTask.id)}
        className="text-sm text-destructive hover:opacity-80 pt-2"
      >
        Eliminar tarea
      </button>
    </div>
  )
}