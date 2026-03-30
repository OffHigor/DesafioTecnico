import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/formatters'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { getApiErrorMessage, transferFunds } from '@/services/banking-api'
import { useAccountStore } from '@/stores/account-store'
import type { AccountSummary, Transaction, TransferPayload } from '@/types/banking'

// Formulario de transferencia com validacao e atualizacao otimista da conta.
const transferSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(3, 'Informe ao menos 3 caracteres')
    .max(60, 'Nome do destinatario muito longo'),
  amount: z
    .number()
    .refine((value) => Number.isFinite(value), 'Informe um valor valido')
    .gt(0, 'O valor deve ser maior que zero')
    .max(1_000_000, 'O valor ultrapassa o limite de transferencia'),
  description: z
    .string()
    .trim()
    .max(80, 'Use no maximo 80 caracteres')
    .optional()
    .or(z.literal('')),
})

type TransferFormValues = z.infer<typeof transferSchema>

type TransferMutationContext = {
  previousAccount?: AccountSummary
}

type TransferFeedback = {
  type: 'success' | 'error'
  message: string
}

export function TransferForm() {
  const saldoDisponivel = useAccountStore((state) => state.saldo)
  const setAccount = useAccountStore((state) => state.setAccount)

  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<TransferFeedback | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipient: '',
      amount: 0,
      description: '',
    },
  })

  const transferMutation = useMutation<
    Awaited<ReturnType<typeof transferFunds>>,
    Error,
    TransferPayload,
    TransferMutationContext
  >({
    mutationFn: transferFunds,
    onMutate: async (payload) => {
      setFeedback(null)
      await queryClient.cancelQueries({ queryKey: queryKeys.account })

      const previousAccount = queryClient.getQueryData<AccountSummary>(
        queryKeys.account
      )

      if (previousAccount) {
        // Atualiza a UI imediatamente enquanto a requisicao real ainda esta em andamento.
        const optimisticTransaction: Transaction = {
          id: `optimistic-${Date.now()}`,
          kind: 'debit',
          title: 'Transferencia enviada',
          description: payload.description || `Transferencia para ${payload.recipient}`,
          amount: payload.amount,
          createdAt: new Date().toISOString(),
        }

        const optimisticAccount: AccountSummary = {
          saldo: Number((previousAccount.saldo - payload.amount).toFixed(2)),
          transactions: [optimisticTransaction, ...previousAccount.transactions],
        }

        queryClient.setQueryData(queryKeys.account, optimisticAccount)
        setAccount(optimisticAccount)
      }

      return { previousAccount }
    },
    onError: (error, _payload, context) => {
      if (context?.previousAccount) {
        queryClient.setQueryData(queryKeys.account, context.previousAccount)
        setAccount(context.previousAccount)
      }

      setFeedback({
        type: 'error',
        message: getApiErrorMessage(
          error,
          'Nao foi possivel enviar a transferencia.'
        ),
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.account, response.account)
      setAccount(response.account)
      setFeedback({
        type: 'success',
        message: 'Transferencia realizada com sucesso.',
      })
      reset({ recipient: '', amount: 0, description: '' })
    },
  })

  const onSubmit = (values: TransferFormValues) => {
    const roundedAmount = Number(values.amount.toFixed(2))

    if (roundedAmount > saldoDisponivel) {
      setError('amount', {
        message: 'Saldo insuficiente para esta transferencia',
      })
      return
    }

    transferMutation.mutate({
      recipient: values.recipient.trim(),
      amount: roundedAmount,
      description: values.description?.trim() || undefined,
    })
  }

  return (
    <Card className="border-border/60 bg-background/80 shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Nova transferencia</CardTitle>
        <CardDescription>Seu saldo atualiza logo apos a confirmacao.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recipient">
              Destinatario
            </label>
            <Input
              id="recipient"
              placeholder="Ex: Maria Souza"
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? 'recipient-error' : undefined}
              {...register('recipient')}
            />
            {errors.recipient ? (
              <p id="recipient-error" role="alert" className="text-xs text-rose-600">
                {errors.recipient.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="amount">
              Valor
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              {...register('amount', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Disponivel agora: {formatCurrency(saldoDisponivel)}
            </p>
            {errors.amount ? (
              <p id="amount-error" role="alert" className="text-xs text-rose-600">
                {errors.amount.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Descricao (opcional)
            </label>
            <Input
              id="description"
              placeholder="Motivo da transferencia"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
              {...register('description')}
            />
            {errors.description ? (
              <p
                id="description-error"
                role="alert"
                className="text-xs text-rose-600"
              >
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {feedback ? (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
              className={cn(
                'rounded-md border p-2 text-xs',
                feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              )}
            >
              {feedback.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={transferMutation.isPending}
            aria-busy={transferMutation.isPending}
          >
            {transferMutation.isPending ? 'Enviando transferencia...' : 'Confirmar transferencia'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
