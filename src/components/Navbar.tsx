import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Home,
  LayoutDashboard,
  FolderOpen,
  Images,
  Tag,
  Zap,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Wallet,
  Cpu,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { creditApi } from '@/api'
import { assetUrl } from '@/lib/assets'

const navLinks = [
  { to: '/', label: '首页', icon: Home },
  { to: '/dashboard', label: '工作台', icon: LayoutDashboard, requireAuth: true },
  { to: '/gallery', label: '社区', icon: Images },
  { to: '/assets', label: '资产', icon: FolderOpen, requireAuth: true },
  { to: '/pricing', label: '定价', icon: Tag },
  { to: '/models', label: '模型', icon: Cpu },
]

export default function Navbar() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthenticated) {
      setCreditBalance(null)
      return
    }
    let cancelled = false
    creditApi.getBalance()
      .then((data) => {
        if (!cancelled) setCreditBalance(data.balance)
      })
      .catch(() => {
        if (!cancelled) setCreditBalance(null)
      })
    return () => { cancelled = true }
  }, [isAuthenticated])

  return (
    <>
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-accent text-bg-primary text-center py-1.5 text-xs font-semibold">
        🎬 演示模式 — 所有数据均为模拟，仅供商业展示
      </div>

      <nav
        className="fixed top-7 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(10,10,15,0.95)' : 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between h-16 px-6 max-w-[1400px] mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Film className="w-6 h-6 text-accent-cyan" />
            <span className="font-display font-bold text-xl text-accent-cyan">
              漫剧AI
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              DEMO
            </span>
          </Link>

          {/* Center Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to
              const href = (link as any).requireAuth && !isAuthenticated
                ? `/login?redirect=${encodeURIComponent(link.to)}`
                : link.to
              return (
                <Link
                  key={link.to}
                  to={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-accent-cyan bg-accent-cyan/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Credit Balance */}
            {isAuthenticated && creditBalance !== null && (
              <Link
                to="/wallet"
                className="hidden sm:flex items-center gap-1.5 credit-pill hover:bg-[rgba(0,229,255,0.2)] transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{creditBalance.toLocaleString()}</span>
                <span className="text-text-muted text-[10px]">积分</span>
              </Link>
            )}

            {/* Create Button - Desktop */}
            <Link
              to="/dashboard"
              className="hidden md:flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
            >
              <Zap className="w-4 h-4" />
              开始创作
            </Link>

            {/* Auth / User Avatar */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 rounded-full hover:bg-white/5 transition-colors p-1"
                >
                  <img
                    src={user?.avatar || assetUrl('avatar-default.jpg')}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover border border-border-default"
                  />
                  <span className="hidden sm:block text-sm text-text-secondary max-w-[100px] truncate">
                    {user?.name || user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-radius-lg bg-bg-secondary border border-border-default shadow-2xl z-50 overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          个人设置
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                        >
                          <Wallet className="w-4 h-4" />
                          我的钱包
                        </Link>
                        <div className="border-t border-border-default" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            logout()
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:text-error/80 hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                登录
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-text-secondary" />
              ) : (
                <Menu className="w-5 h-5 text-text-secondary" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed inset-y-0 right-0 w-72 bg-bg-secondary border-l border-border-default z-50 pt-24 px-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to
                const href = (link as any).requireAuth && !isAuthenticated
                  ? `/login?redirect=${encodeURIComponent(link.to)}`
                  : link.to
                return (
                  <Link
                    key={link.to}
                    to={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-accent-cyan bg-accent-cyan/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t border-border-default my-2" />
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-sm"
              >
                <Zap className="w-4 h-4" />
                开始创作
              </Link>
              {isAuthenticated && creditBalance !== null && (
                <Link
                  to="/wallet"
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-lg border border-border-default text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Zap className="w-4 h-4 text-accent-cyan" />
                  {creditBalance.toLocaleString()} 积分
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
