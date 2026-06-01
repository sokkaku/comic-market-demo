import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Sparkles,
  Loader2,
  Zap,
  X,
  QrCode,
  CreditCard,
  Globe,
  Wallet,
  ArrowRight,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { creditApi, paymentApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import type { CreditPackage, PaymentOrder } from '@/api'

const TIER_FEATURES: Record<string, string[]> = {
  free: ['基础分镜', '2个视频模型', '720p 输出', '社区支持'],
  creator: ['高级分镜编辑', '全部视频模型', '1080p 输出', '优先生成队列', 'API 访问'],
  studio: ['全部创作者功能', '4K 超清输出', '自定义模型训练', '专属客服', 'SLA 保障'],
}

type PaymentProvider = 'alipay' | 'wechat' | 'stripe' | 'paypal'

interface ProviderInfo {
  id: PaymentProvider
  name: string
  icon: typeof QrCode
  supportedCurrencies: string[]
  description: string
}

const PROVIDERS: ProviderInfo[] = [
  { id: 'alipay', name: '支付宝', icon: QrCode, supportedCurrencies: ['CNY'], description: '扫码或跳转支付' },
  { id: 'wechat', name: '微信支付', icon: QrCode, supportedCurrencies: ['CNY'], description: '扫码支付' },
  { id: 'stripe', name: 'Stripe', icon: CreditCard, supportedCurrencies: ['CNY', 'USD'], description: '信用卡/借记卡' },
  { id: 'paypal', name: 'PayPal', icon: Globe, supportedCurrencies: ['USD'], description: 'PayPal 账户' },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Purchase flow state
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [step, setStep] = useState<'select' | 'pay' | 'processing' | 'success' | 'failed'>('select')
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [paymentParams, setPaymentParams] = useState<Record<string, unknown> | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    creditApi
      .getPackages()
      .then((res) => {
        if (!cancelled) setPackages(res.packages || [])
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error('加载套餐失败: ' + (err instanceof Error ? err.message : '未知错误'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function startPolling(orderId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const data = await paymentApi.getOrder(orderId)
        if (data.status === 'PAID' || data.status === 'COMPLETED') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPolling(false)
          setStep('success')
          toast.success('支付成功！积分已到账')
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPolling(false)
          setStep('failed')
        }
      } catch {
        // ignore poll errors
      }
    }, 3000)
  }

  async function handleCreateOrder() {
    if (!selectedPkg || !selectedProvider) return
    if (!isAuthenticated) {
      toast.info('请先登录')
      navigate(`/login?redirect=${encodeURIComponent('/pricing')}`)
      return
    }

    setIsCreatingOrder(true)
    try {
      const currency = selectedProvider === 'paypal' ? 'USD' : 'CNY'
      const res = await paymentApi.createOrder({
        type: 'credit_purchase',
        packageId: selectedPkg.id,
        currency,
        provider: selectedProvider,
      })
      setOrder(res)
      setPaymentParams((res as any).paymentParams || {})
      setStep('pay')
      startPolling(res.id)
    } catch (err: any) {
      toast.error('创建订单失败: ' + (err?.message || '未知错误'))
      // Check if it's a config error
      const msg = err?.message || ''
      if (msg.includes('NOT_CONFIGURED') || msg.includes('not properly configured')) {
        toast.error('该支付方式尚未配置，请联系管理员')
      }
    } finally {
      setIsCreatingOrder(false)
    }
  }

  function handleCancel() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setPolling(false)
    setSelectedPkg(null)
    setSelectedProvider(null)
    setOrder(null)
    setPaymentParams(null)
    setStep('select')
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'))
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
      </div>
    )
  }

  const tiers =
    packages.length > 0
      ? packages.map((pkg, i) => ({
          pkg,
          name: pkg.name,
          price: `¥${pkg.priceCny}`,
          usdPrice: `$${pkg.priceUsd}`,
          credits: `${pkg.credits.toLocaleString()} 积分`,
          description: pkg.description || `${pkg.credits.toLocaleString()} 积分`,
          features: TIER_FEATURES[pkg.id] || TIER_FEATURES.creator || ['基础功能'],
          popular: i === 1,
        }))
      : []

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-3">定价方案</h1>
          <p className="text-text-secondary max-w-lg mx-auto">灵活的积分方案，按需充值，无隐藏费用</p>
        </div>

        {/* ── Package Cards ── */}
        {tiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto mb-12">
            {tiers.map((tier) => (
              <div
                key={tier.pkg.id}
                className={`relative bg-bg-secondary rounded-radius-lg p-6 ${
                  tier.popular
                    ? 'border-2 border-accent-cyan/50'
                    : 'border border-border-default'
                } ${tier.popular ? '-mt-2 mb-2' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-bg-primary text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    最受欢迎
                  </div>
                )}
                <h3 className="font-display text-lg font-semibold text-text-primary mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-mono text-4xl font-bold text-text-primary">{tier.price}</span>
                  <span className="text-text-muted text-sm">/次</span>
                </div>
                <p className="text-text-muted text-xs mb-1">{tier.usdPrice} USD</p>
                <p className="text-accent-cyan font-mono text-sm mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {tier.credits}
                </p>
                <p className="text-text-muted text-xs mb-4">{tier.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent-cyan shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    setSelectedPkg(tier.pkg)
                    setStep('select')
                  }}
                  className={`block w-full text-center py-2.5 rounded-radius-sm font-display font-semibold text-sm transition-all ${
                    tier.popular
                      ? 'bg-gradient-accent text-bg-primary hover:shadow-glow'
                      : 'border border-border-default text-text-primary hover:border-border-active'
                  }`}
                >
                  立即购买
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-12">
            <p className="text-text-muted text-sm">暂无定价方案</p>
          </div>
        )}

        {/* Payment Methods teaser */}
        <div className="text-center">
          <p className="text-text-muted text-xs mb-3">支持的支付方式</p>
          <div className="flex items-center justify-center gap-4">
            {['支付宝', '微信支付', 'Stripe', 'PayPal'].map((method) => (
              <span
                key={method}
                className="text-text-muted text-xs px-3 py-1.5 rounded-full bg-bg-tertiary border border-border-default hover:border-border-active hover:text-text-secondary transition-colors cursor-default"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Purchase Modal ── */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative bg-bg-secondary border border-border-default rounded-radius-lg w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <h3 className="font-display font-semibold text-text-primary">
                {step === 'select' && '选择支付方式'}
                {step === 'pay' && '完成支付'}
                {step === 'processing' && '支付处理中'}
                {step === 'success' && '支付成功'}
                {step === 'failed' && '支付失败'}
              </h3>
              <button onClick={handleCancel} className="p-1 rounded hover:bg-white/5 text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="px-5 py-3 bg-bg-tertiary/50 border-b border-border-default">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">{selectedPkg.name}</span>
                <span className="font-mono font-bold text-text-primary">¥{selectedPkg.priceCny}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-text-muted text-xs">{selectedPkg.credits.toLocaleString()} 积分</span>
                <span className="text-text-muted text-xs">{selectedProvider ? PROVIDERS.find((p) => p.id === selectedProvider)?.name : ''}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4">
              {/* Step: Select Provider */}
              {step === 'select' && (
                <div className="space-y-2">
                  {PROVIDERS.map((provider) => {
                    const isSelected = selectedProvider === provider.id
                    return (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-radius-md border transition-all text-left ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/5'
                            : 'border-border-default hover:border-border-active bg-bg-primary'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-radius-md flex items-center justify-center ${
                            isSelected ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-bg-tertiary text-text-muted'
                          }`}
                        >
                          <provider.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{provider.name}</p>
                          <p className="text-xs text-text-muted">{provider.description}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-accent-cyan' : 'border-text-muted'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-accent-cyan" />}
                        </div>
                      </button>
                    )
                  })}

                  <button
                    onClick={handleCreateOrder}
                    disabled={!selectedProvider || isCreatingOrder}
                    className="w-full mt-4 py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        创建订单中...
                      </>
                    ) : (
                      <>
                        确认购买
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-center text-warning text-xs mt-2">请先登录后再购买</p>
                  )}
                </div>
              )}

              {/* Step: Pay */}
              {step === 'pay' && paymentParams && order && (
                <div className="space-y-4">
                  {/* Payment info based on provider */}
                  {selectedProvider === 'alipay' && paymentParams.paymentUrl && (
                    <div className="text-center space-y-3">
                      <QrCode className="w-12 h-12 text-accent-cyan mx-auto" />
                      <p className="text-text-secondary text-sm">点击下方链接完成支付宝支付</p>
                      <a
                        href={paymentParams.paymentUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-radius-sm bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        前往支付宝支付
                      </a>
                      <div className="flex items-center gap-2 bg-bg-primary rounded-radius-md p-2">
                        <code className="flex-1 text-[11px] text-text-muted truncate">{paymentParams.paymentUrl as string}</code>
                        <button
                          onClick={() => handleCopy(paymentParams.paymentUrl as string)}
                          className="p-1 hover:bg-white/5 rounded"
                        >
                          <Copy className="w-3 h-3 text-text-muted" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedProvider === 'wechat' && paymentParams.codeUrl && (
                    <div className="text-center space-y-3">
                      <QrCode className="w-12 h-12 text-success mx-auto" />
                      <p className="text-text-secondary text-sm">请使用微信扫描二维码支付</p>
                      <div className="bg-white p-3 rounded-radius-md mx-auto w-fit">
                        {/* QR Code placeholder - in production use a QR library */}
                        <div className="w-40 h-40 bg-bg-primary rounded flex items-center justify-center">
                          <span className="text-text-muted text-xs text-center px-2">
                            二维码:
                            <br />
                            {(paymentParams.codeUrl as string).slice(0, 30)}...
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-bg-primary rounded-radius-md p-2">
                        <code className="flex-1 text-[11px] text-text-muted truncate">{paymentParams.codeUrl as string}</code>
                        <button
                          onClick={() => handleCopy(paymentParams.codeUrl as string)}
                          className="p-1 hover:bg-white/5 rounded"
                        >
                          <Copy className="w-3 h-3 text-text-muted" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedProvider === 'stripe' && paymentParams.clientSecret && (
                    <div className="text-center space-y-3">
                      <CreditCard className="w-12 h-12 text-accent-purple mx-auto" />
                      <p className="text-text-secondary text-sm">使用 Stripe 完成信用卡支付</p>
                      <p className="text-text-muted text-xs">请在弹出的 Stripe 窗口中完成支付</p>
                      <a
                        href={`https://checkout.stripe.com/pay/${paymentParams.clientSecret}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-radius-sm bg-accent-purple/10 text-accent-purple text-sm font-medium hover:bg-accent-purple/20 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        前往 Stripe 支付
                      </a>
                    </div>
                  )}

                  {selectedProvider === 'paypal' && paymentParams.orderId && (
                    <div className="text-center space-y-3">
                      <Globe className="w-12 h-12 text-info mx-auto" />
                      <p className="text-text-secondary text-sm">使用 PayPal 完成支付</p>
                      <p className="text-text-muted text-xs">PayPal Order ID: {paymentParams.orderId as string}</p>
                      <button
                        onClick={() => {
                          // In production, integrate PayPal SDK
                          toast.info('PayPal 支付需要集成 SDK，请联系管理员')
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-radius-sm bg-info/10 text-info text-sm font-medium hover:bg-info/20 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        打开 PayPal
                      </button>
                    </div>
                  )}

                  {/* Fallback for unknown params */}
                  {!(paymentParams.paymentUrl || paymentParams.codeUrl || paymentParams.clientSecret || paymentParams.orderId) && (
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-12 h-12 text-warning mx-auto" />
                      <p className="text-text-secondary text-sm">支付参数已生成</p>
                      <pre className="bg-bg-primary rounded-radius-md p-3 text-[11px] text-text-muted overflow-auto max-h-40">
                        {JSON.stringify(paymentParams, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Polling status */}
                  <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    {polling ? '等待支付完成...' : '正在检查状态...'}
                  </div>

                  <button
                    onClick={handleCancel}
                    className="w-full py-2 rounded-radius-sm border border-border-default text-text-secondary text-sm hover:border-border-active transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* Step: Processing */}
              {step === 'processing' && (
                <div className="text-center py-8 space-y-4">
                  <Loader2 className="w-10 h-10 text-accent-cyan animate-spin mx-auto" />
                  <p className="text-text-secondary text-sm">正在处理订单...</p>
                </div>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
                  <div>
                    <p className="text-text-primary font-medium mb-1">支付成功！</p>
                    <p className="text-text-secondary text-sm">
                      {selectedPkg.credits.toLocaleString()} 积分已到账
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleCancel()
                        navigate('/wallet')
                      }}
                      className="flex-1 py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
                    >
                      查看钱包
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 rounded-radius-sm border border-border-default text-text-secondary text-sm hover:border-border-active transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Failed */}
              {step === 'failed' && (
                <div className="text-center py-6 space-y-4">
                  <AlertCircle className="w-14 h-14 text-error mx-auto" />
                  <div>
                    <p className="text-text-primary font-medium mb-1">支付失败</p>
                    <p className="text-text-secondary text-sm">订单处理失败，请重试或联系客服</p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="w-full py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
