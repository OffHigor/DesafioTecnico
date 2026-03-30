import { create } from 'zustand'

import type { AccountSummary, Transaction } from '@/types/banking'

// Store global da conta exibida no dashboard.
interface AccountState {
  saldo: number
  transactions: Transaction[]
  setAccount: (account: AccountSummary) => void
  resetAccount: () => void
}

// Estado inicial usado no logout e no primeiro carregamento da app.
const emptyAccount: AccountSummary = {
  saldo: 0,
  transactions: [],
}

export const useAccountStore = create<AccountState>((set) => ({
  saldo: emptyAccount.saldo,
  transactions: emptyAccount.transactions,
  setAccount: (account) =>
    set({
      saldo: account.saldo,
      transactions: account.transactions,
    }),
  resetAccount: () =>
    set({
      saldo: emptyAccount.saldo,
      transactions: emptyAccount.transactions,
    }),
}))
