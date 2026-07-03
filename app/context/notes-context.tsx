// app/context/notes-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Note = {
  id: string
  title: string
  content: string
  areaId: string | null
  createdAt: string
  updatedAt: string
}

type NotesContextType = {
  notes: Note[]
  loading: boolean
  addNote: (areaId: string | null) => Promise<string>
  updateNote: (id: string, partial: Partial<Pick<Note, 'title' | 'content' | 'areaId'>>) => void
  deleteNote: (id: string) => void
}

const NotesContext = createContext<NotesContextType | null>(null)

export function NotesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
      setNotes(
        (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          areaId: r.area_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }))
      )
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addNote = async (areaId: string | null) => {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('notes')
      .insert({ title: 'Nueva nota', content: '', area_id: areaId, user_id: userData.user?.id })
      .select()
      .single()

    if (data) {
      setNotes((prev) => [
        {
          id: data.id,
          title: data.title,
          content: data.content,
          areaId: data.area_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        ...prev,
      ])
      return data.id as string
    }
    return ''
  }

  const updateNote = async (id: string, partial: Partial<Pick<Note, 'title' | 'content' | 'areaId'>>) => {
    const now = new Date().toISOString()
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...partial, updatedAt: now } : n))
    )

    const dbPartial: Record<string, unknown> = { updated_at: now }
    if (partial.title !== undefined) dbPartial.title = partial.title
    if (partial.content !== undefined) dbPartial.content = partial.content
    if (partial.areaId !== undefined) dbPartial.area_id = partial.areaId

    await supabase.from('notes').update(dbPartial).eq('id', id)
  }

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  return (
    <NotesContext.Provider value={{ notes, loading, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotesContext() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotesContext debe usarse dentro de <NotesProvider>')
  return ctx
}