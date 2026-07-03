// app/tasks/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Plus, Settings2 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasksContext, Task } from '../context/tasks-context'
import { useCategoriesContext } from '../context/categories-context'
import { TaskDetailPanel } from '../task-detail-panel'
import { ManageCategoriesDialog } from '../manage-categories-dialog'

const columns: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

const columnKeys = new Set<Task['status']>(['todo', 'in-progress', 'done'])

const priorityColor: Record<Task['priority'], string> = {
  low: 'text-muted-foreground',
  medium: 'text-chart-4',
  high: 'text-destructive',
}

function progress(task: Task) {
  return task.subtasks.length === 0
    ? 0
    : Math.round(
        (task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100
      )
}

function TaskCard({
  task,
  isSelected,
  onSelect,
}: {
  task: Task
  isSelected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const { getAreaName, getProjectName, getAreaColorDot } = useCategoriesContext()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`bg-card rounded-lg p-3 cursor-grab active:cursor-grabbing border shadow-sm hover:shadow transition
        ${isSelected ? 'border-muted-foreground/50 bg-muted/40' : 'border-transparent'}`}
    >
      <p className="font-medium text-sm text-card-foreground">{task.title}</p>

      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAreaColorDot(task.areaId)}`} />
        {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
      </p>

      {task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-chart-3" style={{ width: `${progress(task)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtareas
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className={priorityColor[task.priority]}>● {task.priority}</span>
        <span className="text-muted-foreground">{task.dueDate ?? '—'}</span>
      </div>
    </div>
  )
}

function Column({
  status,
  label,
  tasks,
  selectedTaskId,
  onSelect,
}: {
  status: Task['status']
  label: string
  tasks: Task[]
  selectedTaskId: string | null
  onSelect: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/40 rounded-xl p-3 space-y-3 min-h-[240px] transition-colors
        ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[120px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onSelect={() => onSelect(task.id)}
            />
          ))}

          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              Sin tareas
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function TasksPage() {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    reorderWithinStatus,
    moveTaskToStatus,
  } = useTasksContext()

  const [isCreating, setIsCreating] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isManagingCategories, setIsManagingCategories] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === 'todo'),
      'in-progress': tasks.filter((t) => t.status === 'in-progress'),
      done: tasks.filter((t) => t.status === 'done'),
    }),
    [tasks]
  )

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return closestCenter(args)
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === String(event.active.id))
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    const dragged = tasks.find((t) => t.id === activeId)
    if (!dragged) return

    const draggedStatus = dragged.status
    const overIsColumn = columnKeys.has(overId as Task['status'])

    // Si sueltas encima de una columna vacía o del contenedor
    if (overIsColumn) {
      const targetStatus = overId as Task['status']

      if (draggedStatus !== targetStatus) {
        moveTaskToStatus(dragged.id, targetStatus)
      }

      return
    }

    // Si sueltas encima de otra tarjeta
    const overTask = tasks.find((t) => t.id === overId)
    if (!overTask) return

    const targetStatus = overTask.status

    // 1) Reordenar dentro de la misma columna
    if (draggedStatus === targetStatus) {
      const columnTasks = tasksByStatus[targetStatus]
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
      const newIndex = columnTasks.findIndex((t) => t.id === overId)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(columnTasks, oldIndex, newIndex)
      reorderWithinStatus(targetStatus, reordered.map((t) => t.id))
      return
    }

    // 2) Mover entre columnas colocándolo en la posición del elemento sobre el que sueltas
    // Primero lo movemos de status
    moveTaskToStatus(dragged.id, targetStatus)

    // Luego reordenamos la columna destino para meterlo justo en la posición de overTask
    const destinationTasks = tasksByStatus[targetStatus]
    const withoutDragged = destinationTasks.filter((t) => t.id !== dragged.id)

    const insertIndex = withoutDragged.findIndex((t) => t.id === overTask.id)
    if (insertIndex === -1) return

    const reorderedDestination = [...withoutDragged]
    reorderedDestination.splice(insertIndex, 0, {
      ...dragged,
      status: targetStatus,
    })

    reorderWithinStatus(
      targetStatus,
      reorderedDestination.map((t) => t.id)
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <CheckCircle2 className="w-6 h-6" />
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Your unified task system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManagingCategories(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted/50 text-sm text-muted-foreground"
          >
            <Settings2 className="w-4 h-4" />
            Categorías
          </button>

          {isCreating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newTaskTitle.trim()) return
                addTask(newTaskTitle.trim())
                setNewTaskTitle('')
                setIsCreating(false)
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onBlur={() => !newTaskTitle && setIsCreating(false)}
                placeholder="Título de la tarea..."
                className="border border-border rounded-md px-3 py-2 text-sm bg-background"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
              >
                Crear
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <Column
              key={col.key}
              status={col.key}
              label={col.label}
              tasks={tasksByStatus[col.key]}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-card rounded-lg p-3 shadow-lg border border-border w-[280px]">
              <p className="font-medium text-sm">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailPanel />
      <ManageCategoriesDialog
        open={isManagingCategories}
        onClose={() => setIsManagingCategories(false)}
      />
    </div>
  )
}