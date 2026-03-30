import { AxiosError } from 'axios'

import { http } from '@/services/http'
import type {
  AccountSummary,
  DepositPayload,
  DepositResponse,
  ErrorResponse,
  LoginPayload,
  LoginResponse,
  TransferPayload,
  TransferResponse,
  UserSession,
} from '@/types/banking'

// Camada de servico: centraliza chamadas HTTP e normaliza erros para a UI.
function assertSuccess<T>(
  status: number,
  data: T | ErrorResponse,
  fallbackMessage: string
) {
  if (status >= 200 && status < 300) {
    return data as T
  }

  const message = (data as ErrorResponse).message || fallbackMessage
  throw new Error(message)
}

export async function loginRequest(payload: LoginPayload): Promise<UserSession> {
  const response = await http.post<LoginResponse | ErrorResponse>(
    '/auth/login',
    payload
  )
  const data = assertSuccess<LoginResponse>(
    response.status,
    response.data,
    'Nao foi possivel entrar.'
  )

  return data.session
}

export async function fetchAccountSummary(): Promise<AccountSummary> {
  const response = await http.get<AccountSummary | ErrorResponse>('/account')
  return assertSuccess<AccountSummary>(
    response.status,
    response.data,
    'Nao foi possivel carregar o resumo da conta.'
  )
}

export async function transferFunds(
  payload: TransferPayload
): Promise<TransferResponse> {
  const response = await http.post<TransferResponse | ErrorResponse>(
    '/transfers',
    payload
  )

  return assertSuccess<TransferResponse>(
    response.status,
    response.data,
    'Nao foi possivel concluir a transferencia.'
  )
}

export async function depositFunds(
  payload: DepositPayload
): Promise<DepositResponse> {
  const response = await http.post<DepositResponse | ErrorResponse>(
    '/deposits',
    payload
  )

  return assertSuccess<DepositResponse>(
    response.status,
    response.data,
    'Nao foi possivel concluir o deposito.'
  )
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Nao foi possivel concluir a requisicao.'
): string {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ErrorResponse | undefined

    if (responseData?.message) {
      return responseData.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
