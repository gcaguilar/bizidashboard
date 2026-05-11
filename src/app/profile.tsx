import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: session, isPending } = authClient.useSession()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (isPending) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Debes iniciar sesión</h2>
          <a href="/login" className="text-red-600 hover:underline">Ir a login</a>
        </div>
      </div>
    )
  }

  const handleUpdate = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await authClient.updateUser({
      name: name || session.user.name,
    })
    if (error) {
      setMessage('Error al actualizar')
    } else {
      setMessage('Perfil actualizado')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12">
      <div className="max-w-md mx-auto p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Mi perfil</h2>

        {message && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm mb-4">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              type="text"
              value={session.user.email}
              disabled
              className="mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nombre</label>
            <input
              type="text"
              value={name || session.user.name || ''}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
