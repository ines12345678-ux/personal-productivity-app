'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Reminder = {
  id: string
  text: string
  done: boolean
  createdAt: string
}

type RemindersContextType = {
  reminders: Reminder[]
  loading: boolean
  addReminder: (text: string) => Promise<void>
  toggleReminder: (id: string) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
}

const RemindersContext = createContext<RemindersContextType | null>(null)

export function RemindersProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        setReminders([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setReminders(
          data.map((r) => ({
            id: r.id,
            text: r.text,
            done: r.done,
            createdAt: r.created_at,
          }))
        )
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => {
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const addReminder = async (text: string) => {
    const value = text.trim()
    if (!value) return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        text: value,
        done: false,
        user_id: userId,
      })
      .select()
      .single()

    if (error || !data) return

    setReminders((prev) => [
      {
        id: data.id,
        text: data.text,
        done: data.done,
        createdAt: data.created_at,
      },
      ...prev,
    ])
  }

  const toggleReminder = async (id: string) => {
    const current = reminders.find((r) => r.id === id)
    if (!current) return

    const nextDone = !current.done

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: nextDone } : r))
    )

    const { error } = await supabase
      .from('reminders')
      .update({ done: nextDone })
      .eq('id', id)

    if (error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, done: current.done } : r))
      )
    }
  }

  const deleteReminder = async (id: string) => {
    const previous = reminders
    setReminders((prev) => prev.filter((r) => r.id !== id))

    const { error } = await supabase.from('reminders').delete().eq('id', id)

    if (error) {
      setReminders(previous)
    }
  }

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        loading,
        addReminder,
        toggleReminder,
        deleteReminder,
      }}
    >
      {children}
    </RemindersContext.Provider>
  )
}

export function useRemindersContext() {
  const ctx = useContext(RemindersContext)
  if (!ctx) {
    throw new Error('useRemindersContext debe usarse dentro de <RemindersProvider>')
  }
  return ctx
}