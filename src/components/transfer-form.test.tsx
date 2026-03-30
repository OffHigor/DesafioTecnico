import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TransferForm } from '@/components/transfer-form'
import * as bankingApi from '@/services/banking-api'
import { useAccountStore } from '@/stores/account-store'
import type { TransferResponse } from '@/types/banking'

// Render helper para manter cada teste isolado com seu proprio QueryClient.
function renderTransferForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TransferForm />
    </QueryClientProvider>
  )
}

describe('TransferForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAccountStore.setState((state) => ({
      ...state,
      saldo: 100,
      transactions: [],
    }))
  })

  it('shows local error when amount exceeds available saldo', async () => {
    const transferSpy = vi.spyOn(bankingApi, 'transferFunds')
    const user = userEvent.setup()

    renderTransferForm()

    await user.type(screen.getByLabelText('Destinatario'), 'Maria Souza')
    await user.clear(screen.getByLabelText('Valor'))
    await user.type(screen.getByLabelText('Valor'), '150')
    await user.click(screen.getByRole('button', { name: 'Confirmar transferencia' }))

    expect(
      await screen.findByText('Saldo insuficiente para esta transferencia')
    ).toBeInTheDocument()
    expect(transferSpy).not.toHaveBeenCalled()
  })

  it('submits transfer and shows success feedback', async () => {
    const response: TransferResponse = {
      account: {
        saldo: 50,
        transactions: [
          {
            id: 'tx-test-1',
            kind: 'debit',
            title: 'Transferencia enviada',
            description: 'Transferencia para Joao Silva',
            amount: 50,
            createdAt: '2026-03-29T14:10:00.000Z',
          },
        ],
      },
      transaction: {
        id: 'tx-test-1',
        kind: 'debit',
        title: 'Transferencia enviada',
        description: 'Transferencia para Joao Silva',
        amount: 50,
        createdAt: '2026-03-29T14:10:00.000Z',
      },
    }

    const transferSpy = vi
      .spyOn(bankingApi, 'transferFunds')
      .mockResolvedValue(response)

    const user = userEvent.setup()

    renderTransferForm()

    await user.type(screen.getByLabelText('Destinatario'), 'Joao Silva')
    await user.clear(screen.getByLabelText('Valor'))
    await user.type(screen.getByLabelText('Valor'), '50')
    await user.click(screen.getByRole('button', { name: 'Confirmar transferencia' }))

    const transferPayload = transferSpy.mock.calls[0]?.[0]

    expect(transferPayload).toEqual({
      recipient: 'Joao Silva',
      amount: 50,
      description: undefined,
    })

    expect(
      await screen.findByText('Transferencia realizada com sucesso.')
    ).toBeInTheDocument()
  })
})
