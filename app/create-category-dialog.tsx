// app/create-category-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useCategoriesContext } from './context/categories-context'

type CategoryDialogProps =
  | {
      open: boolean
      kind: 'area'
      onClose: () => void
      onCreated: (id: string) => void
    }
  | {
      open: boolean
      kind: 'project'
      defaultAreaId: string
      onClose: () => void
      onCreated: (id: string) => void
    }

export function CreateCategoryDialog(props: CategoryDialogProps) {
  const { areas, addArea, addProject } = useCategoriesContext()
  const [name, setName] = useState('')
  const [areaId, setAreaId] = useState(props.kind === 'project' ? props.defaultAreaId : '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resetea el formulario cada vez que se abre. Si no hay un área por
  // defecto (la tarea no tenía ninguna asignada), cae en la primera área
  // disponible para que el <select> y el estado interno no queden
  // desincronizados (si no, el <select> "parece" tener algo elegido pero
  // el estado sigue vacío y el submit se bloquea en silencio).
  useEffect(() => {
    if (props.open) {
      setName('')
      setIsSubmitting(false)
      if (props.kind === 'project') {
        setAreaId(props.defaultAreaId || areas[0]?.id || '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open])

  useEffect(() => {
    if (!props.open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [props.open, props.onClose])

  if (!props.open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (props.kind === 'area') {
        const id = await addArea(name.trim())
        if (id) props.onCreated(id)
      } else {
        if (!areaId) return
        const id = await addProject(name.trim(), areaId)
        if (id) props.onCreated(id)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/10"
      onClick={props.onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[360px] bg-card border border-border rounded-xl shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {props.kind === 'area' ? 'Nueva área' : 'Nuevo proyecto'}
          </h3>
          <button onClick={props.onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nombre</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={props.kind === 'area' ? 'p. ej. Personal' : 'p. ej. Rediseño web'}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            />
          </div>

          {props.kind === 'project' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Área</label>
              {areas.length === 0 ? (
                <p className="text-xs text-muted-foreground/70 border border-dashed border-border rounded-md px-3 py-2">
                  Primero necesitas crear un área.
                </p>
              ) : (
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={props.onClose}
              className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (props.kind === 'project' && areas.length === 0)}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
            >
              {isSubmitting ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}