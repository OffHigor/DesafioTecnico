import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Wallet } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/query-keys'
import { useAccountStore } from '@/stores/account-store'
import { useAuthStore } from '@/stores/auth-store'

// Layout comum da area autenticada (header, logout e conteudo de paginas filhas).
export function AppLayout() {
  const session = useAuthStore((state) => state.session)
  const clearSession = useAuthStore((state) => state.clearSession)
  const resetAccount = useAccountStore((state) => state.resetAccount)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Limpa sessao, estado local da conta e cache remoto ao sair.
  function handleLogout() {
    clearSession()
    resetAccount()
    queryClient.removeQueries({ queryKey: queryKeys.account })
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,_#dbeafe_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Onda Finance
              </p>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">
                Painel bancario
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {session?.name ?? 'Cliente'}
              </p>
              <p className="text-xs text-muted-foreground">{session?.email}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
              aria-label="Sair da conta"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
