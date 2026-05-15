import { Alert, AlertDescription } from '@/components/ui/alert'
import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { appRoutes } from '@/lib/routes'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

interface LoginSearchParams {
  callbackUrl?: string
}

function LoginPage() {
  const searchParams = useSearch({ _strice: false }) as LoginSearchParams
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: searchParams.callbackUrl || '/',
    })

    if (error) {
      setError(error.message || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Acceso a tu cuenta de DatosBizi
          </p>
        </div>

        {error && (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          ¿No tienes cuenta?{' '}
          <a href={appRoutes.register()} className="text-red-600 hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  )
}
