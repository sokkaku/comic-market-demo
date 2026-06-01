import { User, Key, Bell, Shield, Link2, Loader2, Copy, Gift, Users, Coins, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { userApi, referralApi } from '@/api'
import type { Account, ReferralStats, ReferralReward } from '@/api'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [connections, setConnections] = useState<Account[]>([])
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key?: string; createdAt: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      const data = await userApi.getProfile()
      setName(data.name || '')
      setEmail(data.email || '')
      setBio(data.bio || '')
    } catch {
      toast.error('加载用户信息失败')
    }
  }, [])

  const loadConnections = useCallback(async () => {
    try {
      const data = await userApi.getConnections()
      setConnections(data || [])
    } catch {
      setConnections([])
    }
  }, [])

  const loadApiKeys = useCallback(async () => {
    try {
      const data = await userApi.getApiKeys()
      setApiKeys(Array.isArray(data) ? data : [])
    } catch {
      setApiKeys([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      await Promise.all([loadProfile(), loadConnections(), loadApiKeys()])
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [loadProfile, loadConnections, loadApiKeys])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await userApi.updateProfile({ name: name || undefined, bio: bio || undefined })
      toast.success('保存成功')
      await refreshUser()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'))
  }

  const tabs = [
    { id: 'general', label: '基本信息', icon: User },
    { id: 'api', label: 'API 密钥', icon: Key },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'connections', label: '账号绑定', icon: Link2 },
    { id: 'referral', label: '邀请返利', icon: Gift },
  ]

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-1">个人设置</h1>
          <p className="text-text-secondary text-sm">管理你的账户信息和偏好设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-6">
              {isLoading && activeTab === 'general' && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
                </div>
              )}

              {!isLoading && activeTab === 'general' && (
                <div>
                  <h3 className="font-display font-semibold text-text-primary mb-4">基本信息</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={user?.avatar || '/avatar-default.jpg'}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border-active"
                    />
                    <div>
                      <p className="text-text-primary font-medium">{user?.name || '未设置昵称'}</p>
                      <p className="text-text-muted text-sm">{user?.email || '未设置邮箱'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">昵称</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="输入昵称"
                        className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">邮箱</label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
                      />
                      <p className="text-text-muted text-xs mt-1">邮箱暂不支持修改</p>
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">个人简介</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="介绍一下你自己"
                        rows={3}
                        className="w-full bg-bg-tertiary border border-border-default rounded-radius-sm px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-5 py-2 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div>
                  <h3 className="font-display font-semibold text-text-primary mb-4">API 密钥</h3>
                  {apiKeys.length > 0 ? (
                    <div className="space-y-3">
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="bg-bg-tertiary border border-border-default rounded-radius-sm p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-text-primary font-medium">{key.name}</p>
                              <p className="text-text-muted text-xs">创建于 {new Date(key.createdAt).toLocaleDateString('zh-CN')}</p>
                            </div>
                            {key.key && (
                              <button
                                onClick={() => handleCopy(key.key!)}
                                className="flex items-center gap-1 text-accent-cyan text-xs hover:underline"
                              >
                                <Copy className="w-3 h-3" />
                                复制
                              </button>
                            )}
                          </div>
                          {key.key && (
                            <code className="block mt-2 font-mono text-sm text-text-primary break-all">{key.key}</code>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm">暂无 API 密钥</p>
                  )}
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h3 className="font-display font-semibold text-text-primary mb-4">通知设置</h3>
                  <div className="space-y-3">
                    {['生成完成通知', '积分变动提醒', '新功能上线通知', '每周使用报告'].map((item) => (
                      <div key={item} className="flex items-center justify-between py-2">
                        <span className="text-text-secondary text-sm">{item}</span>
                        <button className="w-10 h-6 rounded-full bg-accent-cyan relative transition-colors">
                          <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="font-display font-semibold text-text-primary mb-4">安全设置</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-text-primary text-sm">修改密码</p>
                        <p className="text-text-muted text-xs">定期更换密码以保护账户安全</p>
                      </div>
                      <button className="text-accent-cyan text-sm hover:underline">修改</button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-text-primary text-sm">两步验证</p>
                        <p className="text-text-muted text-xs">增强账户安全性</p>
                      </div>
                      <button className="text-accent-cyan text-sm hover:underline">启用</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connections' && (
                <div>
                  <h3 className="font-display font-semibold text-text-primary mb-4">账号绑定</h3>
                  <div className="space-y-3">
                    {['Google', 'GitHub'].map((provider) => {
                      const connected = connections.some(
                        (c) => c.provider.toLowerCase() === provider.toLowerCase()
                      )
                      return (
                        <div key={provider} className="flex items-center justify-between py-3 border-b border-border-default">
                          <span className="text-text-primary text-sm">{provider}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            connected ? 'bg-success/10 text-success' : 'bg-bg-tertiary text-text-muted'
                          }`}>
                            {connected ? '已绑定' : '未绑定'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'referral' && <ReferralTab onCopy={handleCopy} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Referral Tab ─── */
function ReferralTab({ onCopy }: { onCopy: (text: string) => void }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [rewardMeta, setRewardMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const res = await referralApi.getStats()
      setStats(res.code)
    } catch {
      setStats(null)
    }
  }, [])

  const loadRewards = useCallback(async (page = 1) => {
    try {
      const res = await referralApi.getRewards({ page, limit: 10 })
      setRewards(res.rewards)
      setRewardMeta(res.meta)
    } catch {
      setRewards([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      await Promise.all([loadStats(), loadRewards(1)])
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [loadStats, loadRewards])

  const handleCreateCode = async () => {
    setIsCreating(true)
    try {
      await referralApi.createCode()
      toast.success('邀请码生成成功')
      await loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setIsCreating(false)
    }
  }

  const inviteUrl = stats?.code
    ? `${window.location.origin}/#/login?ref=${encodeURIComponent(stats.code)}`
    : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-display font-semibold text-text-primary mb-4">邀请返利</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-bg-tertiary border border-border-default rounded-radius-sm p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">成功邀请</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats?.totalInvites ?? 0}</p>
        </div>
        <div className="bg-bg-tertiary border border-border-default rounded-radius-sm p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Gift className="w-4 h-4" />
            <span className="text-xs">返利次数</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats?.totalRewards ?? 0}</p>
        </div>
        <div className="bg-bg-tertiary border border-border-default rounded-radius-sm p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-xs">累计返利积分</span>
          </div>
          <p className="text-2xl font-bold text-accent-cyan">{stats?.totalEarned ?? 0}</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-bg-tertiary border border-border-default rounded-radius-sm p-4 mb-6">
        {stats ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">我的邀请码</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                stats.isActive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {stats.isActive ? '生效中' : '已停用'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-lg text-text-primary bg-bg-primary px-3 py-2 rounded-radius-sm">
                {stats.code}
              </code>
              <button
                onClick={() => onCopy(stats.code)}
                className="flex items-center gap-1 px-3 py-2 rounded-radius-sm bg-accent-cyan/10 text-accent-cyan text-sm hover:bg-accent-cyan/20 transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
            {inviteUrl && (
              <div className="mt-3 pt-3 border-t border-border-default">
                <span className="text-xs text-text-muted">邀请链接</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 text-xs text-text-muted bg-bg-primary px-2 py-1.5 rounded-radius-sm truncate"
                  />
                  <button
                    onClick={() => onCopy(inviteUrl)}
                    className="text-accent-cyan text-xs hover:underline whitespace-nowrap"
                  >
                    复制链接
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-text-secondary text-sm mb-3">你还没有创建邀请码</p>
            <button
              onClick={handleCreateCode}
              disabled={isCreating}
              className="px-4 py-2 rounded-radius-sm bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
            >
              {isCreating ? '生成中...' : '生成邀请码'}
            </button>
          </div>
        )}
      </div>

      {/* Rewards History */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">返利记录</h4>
        {rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between py-2.5 px-3 bg-bg-tertiary rounded-radius-sm"
              >
                <div>
                  <p className="text-sm text-text-primary">
                    {reward.sourceType === 'generation' ? '生成消费返利' : '消费返利'}
                  </p>
                  <p className="text-text-muted text-xs">
                    {new Date(reward.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span className="text-accent-cyan font-semibold text-sm">+{reward.amount} 积分</span>
              </div>
            ))}

            {/* Pagination */}
            {rewardMeta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-text-muted text-xs">
                  共 {rewardMeta.total} 条
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadRewards(rewardMeta.page - 1)}
                    disabled={rewardMeta.page <= 1}
                    className="p-1.5 rounded-radius-sm bg-bg-tertiary border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-text-secondary text-sm">
                    {rewardMeta.page} / {rewardMeta.totalPages}
                  </span>
                  <button
                    onClick={() => loadRewards(rewardMeta.page + 1)}
                    disabled={rewardMeta.page >= rewardMeta.totalPages}
                    className="p-1.5 rounded-radius-sm bg-bg-tertiary border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gift className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm">暂无返利记录</p>
            <p className="text-text-muted text-xs mt-1">邀请好友注册，好友消费时你将获得返利</p>
          </div>
        )}
      </div>
    </div>
  )
}
