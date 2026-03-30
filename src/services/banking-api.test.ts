import { beforeEach, describe, expect, it } from 'vitest'

import {
  depositFunds,
  fetchAccountSummary,
  loginRequest,
  transferFunds,
} from '@/services/banking-api'
import { resetMockApiState } from '@/services/http'

// Testes de integracao da camada de servico com o mock adapter.
describe('banking api flow', () => {
  beforeEach(() => {
    resetMockApiState()
  })

  it('logs in and updates saldo after a transfer', async () => {
    const session = await loginRequest({
      email: 'demo@onda.finance',
      password: '123456',
    })

    expect(session.token).toContain('mock-token-')

    const initialAccount = await fetchAccountSummary()

    const transferResult = await transferFunds({
      recipient: 'Maria Souza',
      amount: 200.25,
      description: 'Rent share',
    })

    expect(transferResult.account.saldo).toBe(
      Number((initialAccount.saldo - 200.25).toFixed(2))
    )

    expect(transferResult.account.transactions[0]).toMatchObject({
      kind: 'debit',
      amount: 200.25,
      title: 'Transferencia enviada',
    })
  })

  it('rejects transfer when amount exceeds available saldo', async () => {
    const account = await fetchAccountSummary()

    await expect(
      transferFunds({
        recipient: 'Joao Silva',
        amount: account.saldo + 1,
      })
    ).rejects.toThrow('Saldo insuficiente')
  })

  it('adds saldo after a deposit', async () => {
    const account = await fetchAccountSummary()

    const depositResult = await depositFunds({
      recipient: 'Maria Souza',
      amount: 300,
      description: 'Aporte mensal',
    })

    expect(depositResult.account.saldo).toBe(
      Number((account.saldo + 300).toFixed(2))
    )

    expect(depositResult.account.transactions[0]).toMatchObject({
      kind: 'credit',
      amount: 300,
      title: 'Deposito para Maria Souza',
    })
  })
})
