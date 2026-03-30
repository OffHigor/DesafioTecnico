# Onda Finance - Desafio Tecnico

Frontend de um painel bancario simples, construido para demonstrar qualidade de codigo, UX clara e boas praticas com React + TypeScript.

## Visao rapida

- Login com rota protegida
- Dashboard com saldo e transacoes
- Deposito e transferencia com validacao
- Atualizacao otimista da UI
- Testes com Vitest e Testing Library

## Stack

- React 19 + TypeScript
- Vite 8
- React Router
- React Query
- Zustand
- React Hook Form + Zod
- Tailwind CSS 4 + shadcn/ui
- Axios com adapter mock
- Vitest + Testing Library

## Como rodar

Requisitos:

- Node.js 20+
- npm 10+

Instalacao e execucao:

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # desenvolvimento
npm run test       # testes
npm run lint       # lint
npm run build      # build de producao
npm run preview    # preview do build
```

## Credenciais demo

- Email: demo@onda.finance
- Senha: 123456

## Estrutura principal

```text
src/
  components/
    ui/
    saldo-card.tsx
    deposit-form.tsx
    transfer-form.tsx
    transaction-list.tsx
  pages/
    login-page.tsx
    dashboard-page.tsx
  routes/
  services/
  stores/
  types/
```

## Comportamento atual

- Sessao de login persiste em sessionStorage.
- Saldo e transacoes nao persistem no navegador.
- Ao recarregar a pagina, a conta volta para o estado inicial mockado.

## API mock

Base: /api

- POST /auth/login
- GET /account
- POST /transfers
- POST /deposits

## Seguranca 

- Minificar bundle no build e considerar ofuscacao apenas como camada extra.
- Nunca expor segredos no frontend (VITE_ nao e local para segredo).
- Evitar XSS com renderizacao segura (React) e validacao de entrada (Zod).
- Em ambiente real, usar JWT em cookie HttpOnly + Secure + SameSite.
- Implementar logout por inatividade para reduzir risco de sessao aberta.

