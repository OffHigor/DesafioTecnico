import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { SaldoCard } from '@/components/saldo-card'
import { DepositForm } from '@/components/deposit-form'
import { TransferForm } from '@/components/transfer-form'
import { TransactionList } from '@/components/transaction-list'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { queryKeys } from '@/lib/query-keys'
import { fetchAccountSummary, getApiErrorMessage } from '@/services/banking-api'
import { useAccountStore } from '@/stores/account-store'

// Pagina principal da area logada: consolida saldo, lista e acoes da conta.
export function DashboardPage() {
  const saldo = useAccountStore((state) => state.saldo)
  const transactions = useAccountStore((state) => state.transactions)
  const setAccount = useAccountStore((state) => state.setAccount)

  // React Query busca o resumo da conta e o store espelha esse estado para a UI.
  const accountQuery = useQuery({
    queryKey: queryKeys.account,
    queryFn: fetchAccountSummary,
  })

  useEffect(() => {
    if (accountQuery.data) {
      setAccount(accountQuery.data)
    }
  }, [accountQuery.data, setAccount])

  if (accountQuery.isPending && transactions.length === 0) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-80 animate-pulse rounded-xl bg-muted/70" />
      </div>
    )
  }

  if (accountQuery.isError && transactions.length === 0) {
    return (
      <Card className="mx-auto max-w-lg border-border/70 bg-background/90 shadow-sm">
        <CardHeader>
          <CardTitle>Nao foi possivel carregar sua conta</CardTitle>
          <CardDescription>
            {getApiErrorMessage(
              accountQuery.error,
              'Erro inesperado ao carregar o dashboard.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => accountQuery.refetch()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="dashboard-title">
      <div>
        <h2
          id="dashboard-title"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Visao geral da conta
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe saldo e ultimas movimentacoes em um unico lugar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <SaldoCard saldo={saldo} />
          <TransactionList transactions={transactions} />
        </div>

        <div className="space-y-6">
          <DepositForm />
          <TransferForm />
        </div>
      </div>
    </section>
  )
}
