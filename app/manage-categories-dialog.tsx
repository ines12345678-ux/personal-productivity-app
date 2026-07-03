// app/manage-categories-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Trash2, FolderOpen } from 'lucide-react'
import { useCategoriesContext } from './context/categories-context'

export function ManageCategoriesDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { areas, projects, projectsForArea, deleteArea, deleteProject, getAreaColorDot } =
    useCategoriesContext()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Cierra la confirmación pendiente si se cierra el diálogo entero.
  useEffect(() => {
    if (!open) setConfirmingId(null)
  }, [open])

  if (!open) return null

  const orphanProjects = projects.filter((p) => !areas.some((a) => a.id === p.areaId))

  const handleDeleteProject = async (projectId: string) => {
    setDeletingId(projectId)
    try {
      await deleteProject(projectId)
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  // deleteArea del contexto solo borra la fila del área; para que no queden
  // proyectos huérfanos apuntando a un área que ya no existe, borramos aquí
  // primero sus proyectos y luego el área.
  const handleDeleteArea = async (areaId: string) => {
    setDeletingId(areaId)
    try {
      const children = projectsForArea(areaId)
      for (const project of children) {
        await deleteProject(project.id)
      }
      await deleteArea(areaId)
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] max-h-[80vh] flex flex-col bg-card border border-border rounded-xl shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Gestionar categorías</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
          {areas.length === 0 && orphanProjects.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-6">
              Todavía no has creado ninguna área.
            </p>
          )}

          {areas.map((area) => {
            const areaProjects = projectsForArea(area.id)
            const isConfirming = confirmingId === area.id
            const isDeleting = deletingId === area.id

            return (
              <div key={area.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getAreaColorDot(area.id)}`} />
                    <span className="text-sm font-medium text-foreground truncate">{area.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {areaProjects.length} proyecto{areaProjects.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {isConfirming ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded-md bg-destructive text-destructive-foreground disabled:opacity-60"
                      >
                        {isDeleting ? 'Borrando…' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-muted"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(area.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={`Eliminar área ${area.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isConfirming && areaProjects.length > 0 && (
                  <p className="text-[11px] text-destructive/80">
                    Esto también borrará sus {areaProjects.length} proyecto{areaProjects.length === 1 ? '' : 's'}.
                  </p>
                )}

                {areaProjects.length > 0 && (
                  <ul className="space-y-1 pl-4">
                    {areaProjects.map((project) => {
                      const isProjectConfirming = confirmingId === project.id
                      const isProjectDeleting = deletingId === project.id
                      return (
                        <li key={project.id} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            <FolderOpen className="w-3 h-3 shrink-0" />
                            {project.name}
                          </span>

                          {isProjectConfirming ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={isProjectDeleting}
                                className="text-[11px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground disabled:opacity-60"
                              >
                                {isProjectDeleting ? 'Borrando…' : 'Confirmar'}
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="text-[11px] px-1.5 py-0.5 rounded text-muted-foreground hover:bg-muted"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingId(project.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              aria-label={`Eliminar proyecto ${project.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}

          {/* Proyectos cuyo área ya no existe (datos previos a este cambio, o
              restos de un borrado que falló a mitad). Se muestran aparte para
              poder limpiarlos también. */}
          {orphanProjects.length > 0 && (
            <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Proyectos sin área</p>
              <ul className="space-y-1">
                {orphanProjects.map((project) => {
                  const isProjectConfirming = confirmingId === project.id
                  const isProjectDeleting = deletingId === project.id
                  return (
                    <li key={project.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <FolderOpen className="w-3 h-3 shrink-0" />
                        {project.name}
                      </span>

                      {isProjectConfirming ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={isProjectDeleting}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground disabled:opacity-60"
                          >
                            {isProjectDeleting ? 'Borrando…' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="text-[11px] px-1.5 py-0.5 rounded text-muted-foreground hover:bg-muted"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(project.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label={`Eliminar proyecto ${project.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
