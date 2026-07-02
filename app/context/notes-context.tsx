// app/context/notes-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SEED_AREA_UNIVERSITY } from './categories-context'

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
  addNote: (areaId: string | null) => string
  updateNote: (id: string, partial: Partial<Pick<Note, 'title' | 'content' | 'areaId'>>) => void
  deleteNote: (id: string) => void
}

const NotesContext = createContext<NotesContextType | null>(null)

const initialNotes: Note[] = [
  {
    id: 'n1',
    title: 'Ideas para el TFG',
    content: 'Estructura propuesta:\n1. Introducción\n2. Estado del arte\n3. Desarrollo',
    areaId: SEED_AREA_UNIVERSITY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)

  const addNote = (areaId: string | null) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    setNotes((prev) => [
      { id, title: 'Nueva nota', content: '', areaId, createdAt: now, updatedAt: now },
      ...prev,
    ])
    return id
  }

  const updateNote = (id: string, partial: Partial<Pick<Note, 'title' | 'content' | 'areaId'>>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, ...partial, updatedAt: new Date().toISOString() } : note
      )
    )
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotesContext() {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotesContext debe usarse dentro de <NotesProvider>')
  return ctx
}