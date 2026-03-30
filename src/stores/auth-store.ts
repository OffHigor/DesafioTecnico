import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { UserSession } from '@/types/banking'

// Store de autenticacao com persistencia em sessionStorage (nao usa localStorage).
interface AuthState {
  session: UserSession | null
  setSession: (session: UserSession) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'onda-finance-auth-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
)
