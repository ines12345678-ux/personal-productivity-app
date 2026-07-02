// app/context/planner-context.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type TimeBlock = {
  id: string
  date: string // YYYY-MM-DD
  hour: number // 0-23
  text: string
}

type PlannerContextType = {
  timeBlocks: TimeBlock[]
  dayNotes: Record<string, string>
  getTimeBlocksForDate: (date: string) => TimeBlock[]
  setHourText: (date: string, hour: number, text: string) => void
  getDayNote: (date: string) => string
  setDayNote: (date: string, text: string) => void
}

const PlannerContext = createContext<PlannerContextType | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({})

  const getTimeBlocksForDate = (date: string) =>
    timeBlocks.filter((b) => b.date === date).sort((a, b) => a.hour - b.hour)

  // Una franja por hora: si escribes texto lo crea/actualiza,
  // si la dejas vacía la elimina. Así no acumulamos bloques vacíos.
  const setHourText = (date: string, hour: number, text: string) => {
    setTimeBlocks((prev) => {
      const existing = prev.find((b) => b.date === date && b.hour === hour)
      if (!text.trim()) {
        return existing ? prev.filter((b) => b.id !== existing.id) : prev
      }
      if (existing) {
        return prev.map((b) => (b.id === existing.id ? { ...b, text } : b))
      }
      return [...prev, { id: crypto.randomUUID(), date, hour, text }]
    })
  }

  const getDayNote = (date: string) => dayNotes[date] ?? ''

  const setDayNote = (date: string, text: string) => {
    setDayNotes((prev) => ({ ...prev, [date]: text }))
  }

  return (
    <PlannerContext.Provider
      value={{ timeBlocks, dayNotes, getTimeBlocksForDate, setHourText, getDayNote, setDayNote }}
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