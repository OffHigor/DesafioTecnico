import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage, loginRequest } from '@/services/banking-api'
import { demoCredentials } from '@/services/http'
import { useAuthStore } from '@/stores/auth-store'

// Regras de validacao do formulario de login.
const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail valido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginLocationState = {
  from?: string
}

// Tela publica de autenticacao; redireciona para o dashboard apos sucesso.
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)

  const redirectTo =
    (location.state as LoginLocationState | undefined)?.from || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: demoCredentials.email,
      password: demoCredentials.password,
    },
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      // Persiste sessao no store e retorna o usuario para a rota que ele tentou acessar.
      setSession(session)
      navigate(redirectTo, { replace: true })
    },
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_20%,_#bae6fd_0%,_#f8fafc_45%,_#eef2ff_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-56 w-56 rounded-full bg-blue-200/50 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/60 bg-background/90 shadow-xl backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">Onda Finance</CardTitle>
          <CardDescription>Entre para acessar seu painel bancario.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="email-error" role="alert" className="text-xs text-rose-600">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-rose-600"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {loginMutation.isError ? (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700"
              >
                {getApiErrorMessage(loginMutation.error, 'Nao foi possivel entrar.')}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              aria-busy={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Credenciais demo: {demoCredentials.email} / {demoCredentials.password}
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
