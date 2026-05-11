import { createAuthClient } from 'better-auth/react'
import { Link, useRouter } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'

export default function BetterAuthHeader() {
  const { data: session, isPending } = createAuthClient().useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const { authClient } = await import('better-auth/react')
    const client = createAuthClient()
    await client.signOut()
    router.navigate({ to: '/' })
    setDropdownOpen(false)
  }

  if (isPending) {
    return (
      <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    )
  }

  if (session?.user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {session.user.image ? (
            <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center rounded-full">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
            <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{session.user.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{session.user.email}</p>
            </div>
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setDropdownOpen(false)}
            >
              Mi perfil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to="/login"
      className="h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center"
    >
      Sign in
    </Link>
  )
}
