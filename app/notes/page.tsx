// app/notes/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  NotebookPen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  List,
  Strikethrough,
} from 'lucide-react'
import { useNotesContext, Note } from '../context/notes-context'
import { useCategoriesContext } from '../context/categories-context'
import { CreateCategoryDialog } from '../create-category-dialog'

const NO_AREA_KEY = '__none__'
const CREATE_NEW = '__create_new__'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useNotesContext()
  const { areas, getAreaName, getAreaColorDot } = useCategoriesContext()

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [showAreaDialog, setShowAreaDialog] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null

  // CLAVE: el HTML del editor se coloca UNA sola vez al cambiar de nota,
  // nunca en cada tecla. Así el navegador gestiona el cursor con
  // normalidad mientras escribes, en vez de que React lo resetee.
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = selectedNote?.content ?? ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id])

  const grouped = useMemo(() => {
    const groups: Record<string, Note[]> = {}
    for (const note of notes) {
      const key = note.areaId ?? NO_AREA_KEY
      groups[key] = [...(groups[key] ?? []), note]
    }
    return groups
  }, [notes])

  const groupOrder = [...areas.map((a) => a.id), NO_AREA_KEY].filter((key) => grouped[key]?.length)

  const groupLabel = (key: string) => (key === NO_AREA_KEY ? 'Sin categoría' : getAreaName(key))

  const toggleGroup = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleAddNote = async () => {
    const areaId = selectedNote?.areaId ?? areas[0]?.id ?? null
    const id = await addNote(areaId)
    if (id) setSelectedNoteId(id)
  }

  const handleDelete = (id: string) => {
    deleteNote(id)
    setSelectedNoteId((current) => (current === id ? null : current))
  }

  const handleAreaSelectChange = (value: string) => {
    if (!selectedNote) return
    if (value === CREATE_NEW) {
      setShowAreaDialog(true)
      return
    }
    updateNote(selectedNote.id, { areaId: value || null })
  }

  // Guarda con un pequeño retraso tras dejar de escribir, en vez de
  // en cada tecla — evita disparar una escritura a Supabase por letra.
  const handleContentInput = () => {
    if (!selectedNote || !contentRef.current) return
    const html = contentRef.current.innerHTML

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      updateNote(selectedNote.id, { content: html })
    }, 400)
  }

  const applyBulletList = () => {
    contentRef.current?.focus()
    document.execCommand('insertUnorderedList')
    handleContentInput()
  }

  const applyStrikethrough = () => {
    contentRef.current?.focus()
    document.execCommand('strikeThrough')
    handleContentInput()
  }

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <NotebookPen className="w-6 h-6" />
            Notes
          </h1>
          <p className="text-sm text-muted-foreground">A quiet home for your thinking</p>
        </div>

        <button
          onClick={handleAddNote}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-64 shrink-0 border border-border rounded-xl overflow-y-auto bg-card">
          {notes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No hay notas todavía.
            </p>
          )}

          {groupOrder.map((key) => {
            const isCollapsed = collapsed[key]
            return (
              <div key={key} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
                >
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {key !== NO_AREA_KEY && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAreaColorDot(key)}`} />
                  )}
                  {groupLabel(key)}
                  <span className="ml-auto text-muted-foreground/60">{grouped[key].length}</span>
                </button>

                {!isCollapsed && (
                  <ul>
                    {grouped[key].map((note) => (
                      <li key={note.id}>
                        <button
                          onClick={() => setSelectedNoteId(note.id)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted/50 transition border-l-2
                            ${selectedNoteId === note.id ? 'bg-muted/50 border-muted-foreground/50' : 'border-transparent'}`}
                        >
                          <p className="text-sm font-medium text-foreground truncate">
                            {note.title || 'Sin título'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {stripHtml(note.content) || 'Nota vacía'}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex-1 border border-border rounded-xl p-6 flex flex-col gap-3 min-h-0 bg-card">
          {selectedNote ? (
            <>
              <div className="flex items-center gap-3">
                <input
                  value={selectedNote.title}
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  placeholder="Título de la nota"
                  className="text-lg font-semibold flex-1 outline-none bg-transparent text-foreground"
                />

                <select
                  value={selectedNote.areaId ?? ''}
                  onChange={(e) => handleAreaSelectChange(e.target.value)}
                  className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
                >
                  <option value="">Sin categoría</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                  <option value={CREATE_NEW}>+ Nueva área…</option>
                </select>

                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Eliminar nota"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 border-b border-border pb-2">
                <button
                  type="button"
                  onClick={applyBulletList}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Lista con viñetas"
                  title="Lista con viñetas"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={applyStrikethrough}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Tachar texto"
                  title="Tachar texto"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
              </div>

              {/* Sin dangerouslySetInnerHTML aquí — el contenido se
                  coloca de forma imperativa en el useEffect de arriba,
                  no en cada render. */}
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentInput}
                data-placeholder="Escribe aquí..."
                className="flex-1 outline-none text-sm leading-relaxed bg-transparent text-foreground overflow-y-auto
                  empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                  [&_li]:leading-relaxed"
              />

              <p className="text-xs text-muted-foreground/60">
                Editado {new Date(selectedNote.updatedAt).toLocaleString('es-ES')}
              </p>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
              Selecciona o crea una nota para empezar
            </div>
          )}
        </div>
      </div>

      {showAreaDialog && (
        <CreateCategoryDialog
          open
          kind="area"
          onClose={() => setShowAreaDialog(false)}
          onCreated={(id) => {
            if (selectedNote) updateNote(selectedNote.id, { areaId: id })
            setShowAreaDialog(false)
          }}
        />
      )}
    </div>
  )
}