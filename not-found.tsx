// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">La página que buscas no existe.</p>
      </div>
    </div>
  )
}