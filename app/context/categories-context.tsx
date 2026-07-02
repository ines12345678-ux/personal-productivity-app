// app/context/categories-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type Area = { id: string; name: string }
export type Project = { id: string; name: string; areaId: string }

// ids fijos para los datos semilla, así tasks-context puede referenciarlos
export const SEED_AREA_UNIVERSITY = 'area-university'
export const SEED_AREA_WORK = 'area-work'
export const SEED_AREA_GENERAL = 'area-general'
export const SEED_PROJECT_TFG = 'project-tfg'
export const SEED_PROJECT_AUTOMATION = 'project-automation'

const initialAreas: Area[] = [
  { id: SEED_AREA_UNIVERSITY, name: 'University' },
  { id: SEED_AREA_WORK, name: 'Work' },
  { id: SEED_AREA_GENERAL, name: 'General' },
]

const initialProjects: Project[] = [
  { id: SEED_PROJECT_TFG, name: 'TFG', areaId: SEED_AREA_UNIVERSITY },
  { id: SEED_PROJECT_AUTOMATION, name: 'Automation', areaId: SEED_AREA_WORK },
]

type CategoriesContextType = {
  areas: Area[]
  projects: Project[]
  addArea: (name: string) => string
  renameArea: (id: string, name: string) => void
  deleteArea: (id: string) => void
  addProject: (name: string, areaId: string) => string
  renameProject: (id: string, name: string) => void
  deleteProject: (id: string) => void
  projectsForArea: (areaId: string) => Project[]
  getAreaName: (id: string | null) => string
  getProjectName: (id: string | null) => string
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const addArea = (name: string) => {
    const id = crypto.randomUUID()
    setAreas((prev) => [...prev, { id, name }])
    return id
  }

  const renameArea = (id: string, name: string) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  // Al borrar un área, borra también sus proyectos (no puede quedar un
  // proyecto "huérfano" apuntando a un área que ya no existe).
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

  return (
    <CategoriesContext.Provider
      value={{
        areas,
        projects,
        addArea,
        renameArea,
        deleteArea,
        addProject,
        renameProject,
        deleteProject,
        projectsForArea,
        getAreaName,
        getProjectName,
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