// app/context/planner-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type PlannerEvent = {
  id: string
  date: string // YYYY-MM-DD
  time: string // "HH:mm", 24h
  title: string
}

type PlannerContextType = {
  events: PlannerEvent[]
  dayNotes: Record<string, string>
  getEventsForDate: (date: string) => PlannerEvent[]
  addEvent: (date: string, time: string, title: string) => string
  updateEvent: (id: string, partial: Partial<Pick<PlannerEvent, 'time' | 'title'>>) => void
  deleteEvent: (id: string) => void
  getDayNote: (date: string) => string
  setDayNote: (date: string, text: string) => void
}

const PlannerContext = createContext<PlannerContextType | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({})

  const getEventsForDate = (date: string) =>
    events.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time))

  const addEvent = (date: string, time: string, title: string) => {
    const id = crypto.randomUUID()
    setEvents((prev) => [...prev, { id, date, time, title }])
    return id
  }

  const updateEvent = (id: string, partial: Partial<Pick<PlannerEvent, 'time' | 'title'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)))
  }

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const getDayNote = (date: string) => dayNotes[date] ?? ''

  const setDayNote = (date: string, text: string) => {
    setDayNotes((prev) => ({ ...prev, [date]: text }))
  }

  return (
    <PlannerContext.Provider
      value={{
        events,
        dayNotes,
        getEventsForDate,
        addEvent,
        updateEvent,
        deleteEvent,
        getDayNote,
        setDayNote,
      }}
    >
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlannerContext() {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlannerContext debe usarse dentro de <PlannerProvider>')
  return ctx
}