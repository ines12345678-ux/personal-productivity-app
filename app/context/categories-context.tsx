// app/context/categories-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AreaColorId = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'destructive'

export const AREA_COLOR_PALETTE: { id: AreaColorId; label: string; dot: string }[] = [
  { id: 'chart-1', label: 'Azul', dot: 'bg-chart-1' },
  { id: 'chart-2', label: 'Turquesa', dot: 'bg-chart-2' },
  { id: 'chart-3', label: 'Verde', dot: 'bg-chart-3' },
  { id: 'chart-4', label: 'Ámbar', dot: 'bg-chart-4' },
  { id: 'chart-5', label: 'Naranja', dot: 'bg-chart-5' },
  { id: 'primary', label: 'Violeta', dot: 'bg-primary' },
  { id: 'destructive', label: 'Rojo', dot: 'bg-destructive' },
]

export type Area = { id: string; name: string; color: AreaColorId }
export type Project = { id: string; name: string; areaId: string }

type CategoriesContextType = {
  areas: Area[]
  projects: Project[]
  loading: boolean
  addArea: (name: string, color?: AreaColorId) => Promise<string>
  deleteArea: (id: string) => void
  addProject: (name: string, areaId: string) => Promise<string>
  deleteProject: (id: string) => void
  projectsForArea: (areaId: string) => Project[]
  getAreaName: (id: string | null) => string
  getProjectName: (id: string | null) => string
  getAreaColorDot: (id: string | null) => string
}

const CategoriesContext = createContext<CategoriesContextType | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: areaRows } = await supabase.from('areas').select('*').order('created_at')
      const { data: projectRows } = await supabase.from('projects').select('*').order('created_at')

      setAreas((areaRows ?? []).map((r) => ({ id: r.id, name: r.name, color: r.color as AreaColorId })))
      setProjects((projectRows ?? []).map((r) => ({ id: r.id, name: r.name, areaId: r.area_id })))
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addArea = async (name: string, color?: AreaColorId) => {
    const { data: userData } = await supabase.auth.getUser()
    const assignedColor = color ?? AREA_COLOR_PALETTE[areas.length % AREA_COLOR_PALETTE.length].id

    const { data } = await supabase
      .from('areas')
      .insert({ name, color: assignedColor, user_id: userData.user?.id })
      .select()
      .single()

    if (data) {
      setAreas((prev) => [...prev, { id: data.id, name: data.name, color: data.color }])
      return data.id as string
    }
    return ''
  }

  const deleteArea = async (id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
    setProjects((prev) => prev.filter((p) => p.areaId !== id))
    await supabase.from('areas').delete().eq('id', id)
  }

  const addProject = async (name: string, areaId: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('projects')
      .insert({ name, area_id: areaId, user_id: userData.user?.id })
      .select()
      .single()

    if (data) {
      setProjects((prev) => [...prev, { id: data.id, name: data.name, areaId: data.area_id }])
      return data.id as string
    }
    return ''
  }

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('projects').delete().eq('id', id)
  }

  const projectsForArea = (areaId: string) => projects.filter((p) => p.areaId === areaId)
  const getAreaName = (id: string | null) => areas.find((a) => a.id === id)?.name ?? '—'
  const getProjectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? '—'

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
        loading,
        addArea,
        deleteArea,
        addProject,
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