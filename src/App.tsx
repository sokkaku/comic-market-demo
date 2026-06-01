import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Storyboard from './pages/Storyboard'
import Assets from './pages/Assets'
import Pricing from './pages/Pricing'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Gallery from './pages/Gallery'
import Login from './pages/Login'
import Models from './pages/Models'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } />
          <Route path="/storyboard" element={
            <RequireAuth>
              <Storyboard />
            </RequireAuth>
          } />
          <Route path="/assets" element={
            <RequireAuth>
              <Assets />
            </RequireAuth>
          } />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/wallet" element={
            <RequireAuth>
              <Wallet />
            </RequireAuth>
          } />
          <Route path="/profile" element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          } />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/login" element={<Login />} />
          <Route path="/models" element={<Models />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
