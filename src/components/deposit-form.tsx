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
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { depositFunds, getApiErrorMessage } from '@/services/banking-api'
import { useAccountStore } from '@/stores/account-store'
import type { AccountSummary, DepositPayload, Transaction } from '@/types/banking'

// Formulario de deposito com validacao e atualizacao do saldo.
const depositSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(3, 'Informe ao menos 3 caracteres')
    .max(60, 'Nome do destinatario muito longo'),
  amount: z
    .number()
    .refine((value) => Number.isFinite(value), 'Informe um valor valido')
    .gt(0, 'O valor deve ser maior que zero')
    .max(1_000_000, 'O valor ultrapassa o limite permitido'),
  description: z
    .string()
    .trim()
    .max(80, 'Use no maximo 80 caracteres')
    .optional()
    .or(z.literal('')),
})

type DepositFormValues = z.infer<typeof depositSchema>

type DepositMutationContext = {
  previousAccount?: AccountSummary
}

type DepositFeedback = {
  type: 'success' | 'error'
  message: string
}

export function DepositForm() {
  const setAccount = useAccountStore((state) => state.setAccount)

  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<DepositFeedback | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      recipient: '',
      amount: 0,
      description: '',
    },
  })

  const depositMutation = useMutation<
    Awaited<ReturnType<typeof depositFunds>>,
    Error,
    DepositPayload,
    DepositMutationContext
  >({
    mutationFn: depositFunds,
    onMutate: async (payload) => {
      setFeedback(null)
      await queryClient.cancelQueries({ queryKey: queryKeys.account })

      const previousAccount = queryClient.getQueryData<AccountSummary>(
        queryKeys.account
      )

      if (previousAccount) {
        // Mantem a interface responsiva enquanto o mock backend processa o deposito.
        const optimisticTransaction: Transaction = {
          id: `optimistic-deposit-${Date.now()}`,
          kind: 'credit',
          title: `Deposito para ${payload.recipient}`,
          description: payload.description || 'Deposito via aplicativo',
          amount: payload.amount,
          createdAt: new Date().toISOString(),
        }

        const optimisticAccount: AccountSummary = {
          saldo: Number((previousAccount.saldo + payload.amount).toFixed(2)),
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
        message: getApiErrorMessage(error, 'Nao foi possivel realizar o deposito.'),
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.account, response.account)
      setAccount(response.account)
      setFeedback({
        type: 'success',
        message: 'Deposito realizado com sucesso.',
      })
      reset({ recipient: '', amount: 0, description: '' })
    },
  })

  const onSubmit = (values: DepositFormValues) => {
    const roundedAmount = Number(values.amount.toFixed(2))

    depositMutation.mutate({
      recipient: values.recipient.trim(),
      amount: roundedAmount,
      description: values.description?.trim() || undefined,
    })
  }

  return (
    <Card className="border-border/60 bg-background/80 shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Novo deposito</CardTitle>
        <CardDescription>Adicione saldo na conta instantaneamente.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="deposit-recipient"
            >
              Destinatario
            </label>
            <Input
              id="deposit-recipient"
              placeholder="Ex: Maria Souza"
              aria-invalid={Boolean(errors.recipient)}
              aria-describedby={errors.recipient ? 'deposit-recipient-error' : undefined}
              {...register('recipient')}
            />
            {errors.recipient ? (
              <p
                id="deposit-recipient-error"
                role="alert"
                className="text-xs text-rose-600"
              >
                {errors.recipient.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="deposit-amount">
              Valor do deposito
            </label>
            <Input
              id="deposit-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'deposit-amount-error' : undefined}
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount ? (
              <p
                id="deposit-amount-error"
                role="alert"
                className="text-xs text-rose-600"
              >
                {errors.amount.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="deposit-description"
            >
              Descricao (opcional)
            </label>
            <Input
              id="deposit-description"
              placeholder="Ex: Aporte mensal"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'deposit-description-error' : undefined}
              {...register('description')}
            />
            {errors.description ? (
              <p
                id="deposit-description-error"
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
            disabled={depositMutation.isPending}
            aria-busy={depositMutation.isPending}
          >
            {depositMutation.isPending ? 'Processando deposito...' : 'Confirmar deposito'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
