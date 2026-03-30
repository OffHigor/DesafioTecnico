// Tipos centrais do dominio bancario usados em toda a aplicacao.
export interface UserSession {
  userId: string
  name: string
  email: string
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface TransferPayload {
  recipient: string
  amount: number
  description?: string
}

export interface DepositPayload {
  recipient: string
  amount: number
  description?: string
}

export type TransactionKind = 'credit' | 'debit'

export interface Transaction {
  id: string
  kind: TransactionKind
  title: string
  description: string
  amount: number
  createdAt: string
}

export interface AccountSummary {
  saldo: number
  transactions: Transaction[]
}

export interface LoginResponse {
  session: UserSession
}

export interface TransferResponse {
  account: AccountSummary
  transaction: Transaction
}

export interface DepositResponse {
  account: AccountSummary
  transaction: Transaction
}

export interface ErrorResponse {
  message: string
}
