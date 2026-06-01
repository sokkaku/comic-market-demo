import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-primary">
      {!isLoginPage && <Navbar />}
      <main className={`flex-1 ${!isLoginPage ? 'pt-24' : ''}`}>
        <Outlet />
      </main>
      {!isLoginPage && <Footer />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#12121A',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F0F0F5',
          },
        }}
      />
    </div>
  )
}
