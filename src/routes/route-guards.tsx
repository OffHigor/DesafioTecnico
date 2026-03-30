import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth-store'

// Impede acesso a rotas privadas quando nao existe sessao autenticada.
export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

// Impede que usuario logado volte para a tela de login.
export function PublicRoute() {
  const session = useAuthStore((state) => state.session)

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
