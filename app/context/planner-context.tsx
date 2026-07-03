// app/context/planner-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type PlannerEvent = { id: string; date: string; time: string; title: string }

type PlannerContextType = {
  events: PlannerEvent[]
  loading: boolean
  getEventsForDate: (date: string) => PlannerEvent[]
  addEvent: (date: string, time: string, title: string) => void
  updateEvent: (id: string, partial: Partial<Pick<PlannerEvent, 'time' | 'title'>>) => void
  deleteEvent: (id: string) => void
  getDayNote: (date: string) => string
  setDayNote: (date: string, text: string) => void
}

const PlannerContext = createContext<PlannerContextType | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: eventRows } = await supabase.from('planner_events').select('*')
      const { data: noteRows } = await supabase.from('day_notes').select('*')

      setEvents(
        (eventRows ?? []).map((r) => ({ id: r.id, date: r.date, time: r.time?.slice(0, 5) ?? r.time, title: r.title }))
      )
      setDayNotes(
        (noteRows ?? []).reduce<Record<string, string>>((acc, r) => {
          acc[r.date] = r.content
          return acc
        }, {})
      )
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('planner-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_notes' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getEventsForDate = (date: string) =>
    events.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time))

  const addEvent = async (date: string, time: string, title: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('planner_events')
      .insert({ date, time, title, user_id: userData.user?.id })
      .select()
      .single()

    if (data) {
      setEvents((prev) => [...prev, { id: data.id, date: data.date, time: data.time.slice(0, 5), title: data.title }])
    }
  }

  const updateEvent = async (id: string, partial: Partial<Pick<PlannerEvent, 'time' | 'title'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)))
    await supabase.from('planner_events').update(partial).eq('id', id)
  }

  const deleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    await supabase.from('planner_events').delete().eq('id', id)
  }

  const getDayNote = (date: string) => dayNotes[date] ?? ''

  const setDayNote = async (date: string, text: string) => {
    setDayNotes((prev) => ({ ...prev, [date]: text }))
    const { data: userData } = await supabase.auth.getUser()
    // upsert: si ya existe una nota para ese día, la actualiza; si no, la crea
    await supabase
      .from('day_notes')
      .upsert({ date, content: text, user_id: userData.user?.id }, { onConflict: 'user_id,date' })
  }

  return (
    <PlannerContext.Provider
      value={{ events, loading, getEventsForDate, addEvent, updateEvent, deleteEvent, getDayNote, setDayNote }}
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