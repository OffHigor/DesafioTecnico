import axios, { type AxiosAdapter, type AxiosResponse } from 'axios'

import type {
  AccountSummary,
  DepositPayload,
  DepositResponse,
  ErrorResponse,
  LoginPayload,
  LoginResponse,
  TransferPayload,
  TransferResponse,
  Transaction,
  UserSession,
} from '@/types/banking'

// Esta camada simula um backend real via Axios Adapter somente em memoria.

const DEMO_CREDENTIALS = {
  email: 'demo@onda.finance',
  password: '123456',
}

const INITIAL_ACCOUNT: AccountSummary = {
  saldo: 5420.55,
  transactions: [
    {
      id: 'tx-1001',
      kind: 'credit',
      title: 'Salario',
      description: 'Salario mensal',
      amount: 7200,
      createdAt: '2026-03-25T10:15:00.000Z',
    },
    {
      id: 'tx-1002',
      kind: 'debit',
      title: 'Aluguel',
      description: 'Aluguel do apartamento',
      amount: 1800,
      createdAt: '2026-03-26T08:30:00.000Z',
    },
    {
      id: 'tx-1003',
      kind: 'debit',
      title: 'Internet',
      description: 'Conta de internet',
      amount: 129.45,
      createdAt: '2026-03-27T13:00:00.000Z',
    },
    {
      id: 'tx-1004',
      kind: 'debit',
      title: 'Mercado',
      description: 'Compras da semana',
      amount: 284.2,
      createdAt: '2026-03-28T19:45:00.000Z',
    },
  ],
}

let accountState: AccountSummary = structuredClone(INITIAL_ACCOUNT)

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

function parseBody<T>(data: unknown): T {
  if (typeof data === 'string') {
    if (data.length === 0) {
      return {} as T
    }

    return JSON.parse(data) as T
  }

  return (data ?? {}) as T
}

function buildResponse<T>(
  status: number,
  data: T,
  config: Parameters<AxiosAdapter>[0]
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'ERROR',
    headers: {},
    config,
  }
}

function getAccountSnapshot(): AccountSummary {
  return structuredClone(accountState)
}

function buildTransferTransaction(payload: TransferPayload): Transaction {
  return {
    id: `tx-${Date.now()}`,
    kind: 'debit',
    title: 'Transferencia enviada',
    description:
      payload.description?.trim() || `Transferencia para ${payload.recipient.trim()}`,
    amount: payload.amount,
    createdAt: new Date().toISOString(),
  }
}

function buildDepositTransaction(payload: DepositPayload): Transaction {
  return {
    id: `tx-${Date.now()}`,
    kind: 'credit',
    title: `Deposito para ${payload.recipient}`,
    description: payload.description?.trim() || 'Deposito via aplicativo',
    amount: payload.amount,
    createdAt: new Date().toISOString(),
  }
}

// Rotas mockadas para login, leitura de conta, transferencia e deposito.
const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(250)

  const method = config.method?.toLowerCase() ?? 'get'
  const url = config.url ?? ''

  if (method === 'post' && url === '/auth/login') {
    const payload = parseBody<LoginPayload>(config.data)
    const isValidLogin =
      payload.email?.toLowerCase() === DEMO_CREDENTIALS.email &&
      payload.password === DEMO_CREDENTIALS.password

    if (!isValidLogin) {
      return buildResponse<ErrorResponse>(
        401,
        { message: 'Credenciais invalidas' },
        config
      )
    }

    const session: UserSession = {
      userId: 'u-001',
      name: 'Ana Oliveira',
      email: DEMO_CREDENTIALS.email,
      token: `mock-token-${Date.now()}`,
    }

    return buildResponse<LoginResponse>(200, { session }, config)
  }

  if (method === 'get' && url === '/account') {
    return buildResponse<AccountSummary>(200, getAccountSnapshot(), config)
  }

  if (method === 'post' && url === '/transfers') {
    const payload = parseBody<TransferPayload>(config.data)
    const recipient = payload.recipient?.trim()
    const amount = Number(payload.amount)

    if (!recipient || recipient.length < 3) {
      return buildResponse<ErrorResponse>(
        400,
        { message: 'Destinatario deve ter ao menos 3 caracteres' },
        config
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return buildResponse<ErrorResponse>(
        400,
        { message: 'Valor deve ser maior que zero' },
        config
      )
    }

    if (amount > accountState.saldo) {
      return buildResponse<ErrorResponse>(400, { message: 'Saldo insuficiente' }, config)
    }

    const normalizedTransfer: TransferPayload = {
      recipient,
      amount,
      description: payload.description?.trim() || undefined,
    }

    const transaction = buildTransferTransaction(normalizedTransfer)

    accountState = {
      saldo: Number((accountState.saldo - amount).toFixed(2)),
      transactions: [transaction, ...accountState.transactions],
    }

    const transferResponse: TransferResponse = {
      account: getAccountSnapshot(),
      transaction,
    }

    return buildResponse<TransferResponse>(201, transferResponse, config)
  }

  if (method === 'post' && url === '/deposits') {
    const payload = parseBody<DepositPayload>(config.data)
    const recipient = payload.recipient?.trim()
    const amount = Number(payload.amount)

    if (!recipient || recipient.length < 3) {
      return buildResponse<ErrorResponse>(
        400,
        { message: 'Destinatario deve ter ao menos 3 caracteres' },
        config
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return buildResponse<ErrorResponse>(
        400,
        { message: 'Valor deve ser maior que zero' },
        config
      )
    }

    if (amount > 1_000_000) {
      return buildResponse<ErrorResponse>(
        400,
        { message: 'Valor excede o limite permitido' },
        config
      )
    }

    const normalizedDeposit: DepositPayload = {
      recipient,
      amount,
      description: payload.description?.trim() || undefined,
    }

    const transaction = buildDepositTransaction(normalizedDeposit)

    accountState = {
      saldo: Number((accountState.saldo + amount).toFixed(2)),
      transactions: [transaction, ...accountState.transactions],
    }

    const depositResponse: DepositResponse = {
      account: getAccountSnapshot(),
      transaction,
    }

    return buildResponse<DepositResponse>(201, depositResponse, config)
  }

  return buildResponse<ErrorResponse>(404, { message: 'Rota nao encontrada' }, config)
}

export const http = axios.create({
  baseURL: '/api',
  adapter: mockAdapter,
})

export const demoCredentials = Object.freeze(DEMO_CREDENTIALS)

export function resetMockApiState() {
  accountState = structuredClone(INITIAL_ACCOUNT)
}
