import { Landmark } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

// Componente focado em exibir apenas o saldo principal da conta.
interface SaldoCardProps {
  saldo: number
}

export function SaldoCard({ saldo }: SaldoCardProps) {
  return (
    <Card className="border-border/60 bg-background/80 shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardDescription>Saldo disponivel</CardDescription>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Landmark className="size-4" />
          Conta principal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {formatCurrency(saldo)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Valor disponivel para novas transferencias.
        </p>
      </CardContent>
    </Card>
  )
}
