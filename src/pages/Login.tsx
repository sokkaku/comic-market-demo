import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Film, Chrome } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const refParam = searchParams.get('ref') || undefined

  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('请填写邮箱和密码')
      return
    }
    if (mode === 'register' && !name.trim()) {
      toast.error('请填写昵称')
      return
    }
    setIsLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('登录成功')
      } else {
        await register(email, password, name, refParam)
        toast.success('注册成功')
      }
      navigate(redirect)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : mode === 'login' ? '登录失败' : '注册失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Demo mode: auto-login without redirecting to real backend
    setIsLoading(true)
    setTimeout(() => {
      toast.success('Google 登录成功（演示模式）')
      navigate(redirect)
      setIsLoading(false)
    }, 800)
  }

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-hero px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Film className="w-8 h-8 text-accent-cyan" />
            <span className="font-display font-bold text-2xl text-accent-cyan">漫剧AI</span>
          </Link>
          <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 mb-2">
            演示模式
          </div>
          <h1 className="font-display text-xl font-bold text-text-primary mb-1">
            {mode === 'login' ? '欢迎回来' : '创建账户'}
          </h1>
          <p className="text-text-secondary text-sm">
            {mode === 'login' ? '登录你的账户继续创作' : '注册即送 100 积分，开启 AI 创作之旅'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-secondary/80 backdrop-blur-lg border border-border-default rounded-radius-lg p-6">
          {/* OAuth Buttons */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-radius-md bg-bg-tertiary border border-border-default text-text-primary text-sm font-medium hover:border-border-active transition-colors mb-4 disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            使用 Google {mode === 'login' ? '登录' : '注册'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-default" />
            <span className="text-text-muted text-xs">或者</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="mb-3">
                <label className="block text-sm text-text-secondary mb-1.5">昵称</label>
                <input
                  type="text"
                  placeholder="输入昵称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
                />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-sm text-text-secondary mb-1.5">邮箱地址</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5">密码</label>
              <input
                type="password"
                placeholder={mode === 'login' ? '输入密码' : '设置密码（至少 6 位）'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? mode === 'login'
                  ? '登录中...'
                  : '注册中...'
                : mode === 'login'
                  ? '登录'
                  : '注册'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-5">
          {mode === 'login' ? (
            <>
              还没有账号？{' '}
              <button onClick={toggleMode} className="text-accent-cyan hover:underline">
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button onClick={toggleMode} className="text-accent-cyan hover:underline">
                立即登录
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}
