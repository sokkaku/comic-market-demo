import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@/api'
import { MOCK_USER } from '@/api/mockData'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string, ref?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo mode: always authenticated
  const [user, setUser] = useState<User>(MOCK_USER)
  const [isAuthenticated] = useState(true)
  const [isLoading] = useState(false)

  const login = useCallback(async (_email: string, _password: string) => {
    // Demo: no-op, already logged in
  }, [])

  const register = useCallback(async (_email: string, _password: string, _name?: string, _ref?: string) => {
    // Demo: no-op, already logged in
  }, [])

  const logout = useCallback(() => {
    // Demo: no-op, stay logged in
  }, [])

  const refreshUser = useCallback(async () => {
    setUser({ ...MOCK_USER })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
