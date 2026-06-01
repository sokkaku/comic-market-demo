import type { ReactNode } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  // Demo mode: always allow access
  return <>{children}</>
}
