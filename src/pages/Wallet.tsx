import { useState, useEffect } from 'react'
import { Zap, ArrowUpRight, ArrowDownLeft, CreditCard, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { creditApi } from '@/api'
import type { Wallet as WalletType, CreditPackage, CreditTransaction } from '@/api'

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletType | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadWalletData() {
      try {
        const [balanceRes, txRes, pkgRes] = await Promise.all([
          creditApi.getBalance(),
          creditApi.getTransactions({ page: 1, limit: 20 }),
          creditApi.getPackages(),
        ])

        if (cancelled) return

        setWallet(balanceRes)
        setTransactions(txRes.transactions || [])
        setPackages(pkgRes.packages || [])
      } catch (err) {
        if (!cancelled) {
          toast.error('加载钱包数据失败: ' + (err instanceof Error ? err.message : '未知错误'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadWalletData()
    return () => { cancelled = true }
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'RECHARGE': return '积分充值'
      case 'SPEND': return '视频生成'
      case 'REFUND': return '退款'
      case 'BONUS': return '奖励'
      case 'SUBSCRIPTION': return '订阅'
      case 'ADJUST': return '调整'
      default: return type
    }
  }

  const getTxTypeDirection = (type: string) => {
    return ['RECHARGE', 'REFUND', 'BONUS'].includes(type) ? 'in' : 'out'
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-1">我的钱包</h1>
          <p className="text-text-secondary text-sm">查看积分余额和交易记录</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-hero border border-border-default rounded-radius-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-accent-cyan" />
                <span className="text-text-secondary text-sm">可用积分</span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                </div>
              ) : (
                <div className="font-mono text-4xl font-bold text-text-primary mb-4">
                  {(wallet?.balance ?? 0).toLocaleString()}
                </div>
              )}
              <Link
                to="/pricing"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
              >
                <CreditCard className="w-4 h-4" />
                充值积分
              </Link>
            </div>

            {/* Quick Packages */}
            <h3 className="font-display font-semibold text-text-primary mb-3">快速充值</h3>
            <div className="space-y-2">
              {isLoading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="w-full h-14 rounded-radius-md border border-border-default bg-bg-secondary animate-pulse" />
                ))
              ) : packages.length > 0 ? (
                packages.map((pkg, idx) => (
                  <button
                    key={pkg.id}
                    className={`w-full flex items-center justify-between p-3 rounded-radius-md border transition-all ${
                      idx === 1
                        ? 'border-accent-cyan/30 bg-accent-cyan/5'
                        : 'border-border-default hover:border-border-active bg-bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${idx === 1 ? 'text-accent-cyan' : 'text-text-muted'}`} />
                      <span className="font-mono text-sm text-text-primary">{pkg.credits.toLocaleString()} 积分</span>
                    </div>
                    <span className="font-mono font-bold text-accent-cyan">¥{pkg.priceCny}</span>
                  </button>
                ))
              ) : (
                <p className="text-text-muted text-sm">暂无充值套餐</p>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <h3 className="font-display font-semibold text-text-primary mb-3">交易记录</h3>
            <div className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
              {isLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-tertiary animate-pulse" />
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-bg-tertiary rounded animate-pulse" />
                        <div className="w-16 h-2 bg-bg-tertiary rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="w-12 h-3 bg-bg-tertiary rounded animate-pulse" />
                  </div>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((tx, i) => {
                  const direction = getTxTypeDirection(tx.type)
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between px-5 py-4 ${
                        i < transactions.length - 1 ? 'border-b border-border-default' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          direction === 'in' ? 'bg-success/10' : 'bg-error/10'
                        }`}>
                          {direction === 'in' ? (
                            <ArrowDownLeft className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-error" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-text-primary font-medium">{tx.description || getTxTypeLabel(tx.type)}</p>
                          <p className="text-text-muted text-xs">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`font-mono text-sm font-medium ${
                        direction === 'in' ? 'text-success' : 'text-text-primary'
                      }`}>
                        {direction === 'in' ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-text-muted text-sm">暂无交易记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
