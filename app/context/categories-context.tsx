// app/context/categories-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type Area = { id: string; name: string; color: AreaColorId }
export type Project = { id: string; name: string; areaId: string }

export type AreaColorId = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'destructive'

// Paleta cerrada, usa los mismos tokens de tu tema (globals.css) — así
// funciona igual en modo claro y oscuro sin definir colores nuevos.
export const AREA_COLOR_PALETTE: { id: AreaColorId; label: string; dot: string }[] = [
  { id: 'chart-1', label: 'Azul', dot: 'bg-chart-1' },
  { id: 'chart-2', label: 'Turquesa', dot: 'bg-chart-2' },
  { id: 'chart-3', label: 'Verde', dot: 'bg-chart-3' },
  { id: 'chart-4', label: 'Ámbar', dot: 'bg-chart-4' },
  { id: 'chart-5', label: 'Naranja', dot: 'bg-chart-5' },
  { id: 'primary', label: 'Violeta', dot: 'bg-primary' },
  { id: 'destructive', label: 'Rojo', dot: 'bg-destructive' },
]

export const SEED_AREA_UNIVERSITY = 'area-university'
export const SEED_AREA_WORK = 'area-work'
export const SEED_AREA_GENERAL = 'area-general'
export const SEED_PROJECT_TFG = 'project-tfg'
export const SEED_PROJECT_AUTOMATION = 'project-automation'

const initialAreas: Area[] = [
  { id: SEED_AREA_UNIVERSITY, name: 'University', color: 'chart-1' },
  { id: SEED_AREA_WORK, name: 'Work', color: 'chart-2' },
  { id: SEED_AREA_GENERAL, name: 'General', color: 'chart-4' },
]

const initialProjects: Project[] = [
  { id: SEED_PROJECT_TFG, name: 'TFG', areaId: SEED_AREA_UNIVERSITY },
  { id: SEED_PROJECT_AUTOMATION, name: 'Automation', areaId: SEED_AREA_WORK },
]

type CategoriesContextType = {
  areas: Area[]
  projects: Project[]
  addArea: (name: string, color?: AreaColorId) => string
  renameArea: (id: string, name: string) => void
  setAreaColor: (id: string, color: AreaColorId) => void
  deleteArea: (id: string) => void
  addProject: (name: string, areaId: string) => string
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  projectsForArea: (areaId: string) => Project[]
  getAreaName: (id: string | null) => string
  getProjectName: (id: string | null) => string
  getAreaColorDot: (id: string | null) => string
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const addArea = (name: string, color?: AreaColorId) => {
    const id = crypto.randomUUID()
    // Si no se elige color, rota la paleta según cuántas áreas hay ya,
    // para que áreas nuevas no salgan siempre del mismo color por defecto.
    const assignedColor = color ?? AREA_COLOR_PALETTE[areas.length % AREA_COLOR_PALETTE.length].id
    setAreas((prev) => [...prev, { id, name, color: assignedColor }])
    return id
  }

  const renameArea = (id: string, name: string) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  const setAreaColor = (id: string, color: AreaColorId) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, color } : a)))
  }

  const deleteArea = (id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
    setProjects((prev) => prev.filter((p) => p.areaId !== id))
  }

  const addProject = (name: string, areaId: string) => {
    const id = crypto.randomUUID()
    setProjects((prev) => [...prev, { id, name, areaId }])
    return id
  }

  const renameProject = (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const projectsForArea = (areaId: string) => projects.filter((p) => p.areaId === areaId)

  const getAreaName = (id: string | null) => areas.find((a) => a.id === id)?.name ?? '—'
  const getProjectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? '—'

  // Único punto de la app que resuelve "areaId → clase de color".
  // Tasks, Planner y Notes llaman a esto, nunca inventan su propio color.
  const getAreaColorDot = (id: string | null) => {
    const area = areas.find((a) => a.id === id)
    const colorId = area?.color ?? 'chart-1'
    return AREA_COLOR_PALETTE.find((c) => c.id === colorId)?.dot ?? 'bg-chart-1'
  }

  return (
    <CategoriesContext.Provider
      value={{
        areas,
        projects,
        addArea,
        renameArea,
        setAreaColor,
        deleteArea,
        addProject,
        renameProject,
        deleteProject,
        projectsForArea,
        getAreaName,
        getProjectName,
        getAreaColorDot,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategoriesContext() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategoriesContext debe usarse dentro de <CategoriesProvider>')
  return ctx
}