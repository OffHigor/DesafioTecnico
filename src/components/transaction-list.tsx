import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import type { Transaction } from '@/types/banking'

// Lista visual das movimentacoes para facilitar leitura rapida do extrato.
interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <Card className="border-border/60 bg-background/80 shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Transacoes recentes</CardTitle>
        <CardDescription>Ultimas movimentacoes da conta.</CardDescription>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            Nenhuma transacao ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((transaction) => {
              const isCredit = transaction.kind === 'credit'
              const amountTone = isCredit ? 'text-emerald-600' : 'text-rose-600'
              const amountPrefix = isCredit ? '+' : '-'

              return (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-8 items-center justify-center rounded-full ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </span>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {transaction.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-semibold ${amountTone}`}>
                      {amountPrefix}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
