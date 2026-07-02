// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-[320px] space-y-3 bg-card border border-border rounded-xl p-6">
        <h1 className="text-lg font-semibold text-foreground">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
          required
        />

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button type="submit" className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm">
          {mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  )
}