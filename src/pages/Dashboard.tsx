import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clapperboard, FolderOpen, Cpu, Zap, Plus, Settings, Trash2, Edit3, ExternalLink, Film } from 'lucide-react'
import { toast } from 'sonner'
import { creditApi, projectApi, generationApi } from '@/api'
import type { Project } from '@/api'

/** 将未知错误统一转成可展示的错误文案，避免在 UI 层反复判断错误类型。 */
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [creditBalance, setCreditBalance] = useState<number>(0)
  const [projectCount, setProjectCount] = useState<number>(0)
  const [videoCount, setVideoCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // ── Project list state ──
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const [balanceRes, projectsRes, jobsRes] = await Promise.all([
          creditApi.getBalance().catch(() => ({ balance: 0 })),
          projectApi.list().catch(() => ({ projects: [], meta: { total: 0 } })),
          generationApi.listJobs().catch(() => ({ jobs: [], meta: { total: 0 } })),
        ])

        if (cancelled) return

        setCreditBalance(balanceRes.balance)
        setProjectCount(projectsRes.meta?.total ?? projectsRes.projects?.length ?? 0)
        setVideoCount(jobsRes.meta?.total ?? jobsRes.jobs?.length ?? 0)
        setProjects(projectsRes.projects ?? [])
      } catch {
        if (!cancelled) {
          toast.error('加载统计数据失败')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setProjectsLoading(false)
        }
      }
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    try {
      const project = await projectApi.create({ name: newProjectName.trim() })
      setProjects((prev) => [project, ...prev])
      setProjectCount((c) => c + 1)
      setNewProjectName('')
      setIsCreating(false)
      toast.success('项目创建成功')
    } catch (err: unknown) {
      toast.error('创建失败: ' + getErrorMessage(err))
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('确定删除这个项目？此操作不可撤销。')) return
    try {
      await projectApi.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      setProjectCount((c) => Math.max(0, c - 1))
      toast.success('项目已删除')
    } catch (err: unknown) {
      toast.error('删除失败: ' + getErrorMessage(err))
    }
  }

  const stats = [
    { label: '剩余积分', value: creditBalance.toLocaleString(), icon: Zap, color: 'text-accent-cyan' },
    { label: '已有项目', value: String(projectCount), icon: Clapperboard, color: 'text-accent-purple' },
    { label: '已生成视频', value: String(videoCount), icon: Cpu, color: 'text-accent-pink' },
  ]

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: '进行中',
      COMPLETED: '已完成',
      ARCHIVED: '已归档',
      DRAFT: '草稿',
    }
    return map[status] || status
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-success/15 text-success',
      COMPLETED: 'bg-accent-cyan/15 text-accent-cyan',
      ARCHIVED: 'bg-text-muted/15 text-text-muted',
      DRAFT: 'bg-warning/15 text-warning',
    }
    return map[status] || 'bg-bg-tertiary text-text-secondary'
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-1">创作工作台</h1>
            <p className="text-text-secondary text-sm">管理你的项目，快速开始创作</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-bg-secondary border border-border-default rounded-radius-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-text-secondary text-sm">{stat.label}</span>
              </div>
              <span className={`font-mono text-2xl font-bold text-text-primary ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? '—' : stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Project List ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-text-primary">项目列表</h2>
            <span className="text-text-muted text-sm">{projects.length} 个项目</span>
          </div>

          {/* Create Project Inline Form */}
          {isCreating && (
            <form onSubmit={handleCreateProject} className="bg-bg-secondary border border-border-default rounded-radius-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-accent-cyan shrink-0" />
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-muted outline-none"
                />
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-medium disabled:opacity-40"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewProjectName('') }}
                  className="px-3 py-1.5 rounded-lg text-text-secondary text-sm hover:text-text-primary"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {projectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-bg-secondary border border-border-default rounded-radius-lg p-5 animate-pulse">
                  <div className="h-5 bg-bg-tertiary rounded w-1/2 mb-3" />
                  <div className="h-3 bg-bg-tertiary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-bg-tertiary rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-10 text-center">
              <Film className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm mb-4">还没有项目，开始创建你的第一个漫剧吧</p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow"
              >
                <Plus className="w-4 h-4" />
                新建项目
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/storyboard?projectId=${project.id}`)}
                    className="bg-bg-secondary border border-border-default rounded-radius-lg p-5 cursor-pointer transition-all hover:border-border-active"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Film className="w-5 h-5 text-accent-cyan shrink-0" />
                        <h3 className="font-display font-semibold text-text-primary text-sm truncate">{project.name}</h3>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-text-secondary text-xs mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted text-xs">
                        {project.scenes?.length ?? 0} 个场景
                      </span>
                      <span className="text-text-muted text-xs">
                        {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-default">
                      <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-medium">
                        <ExternalLink className="w-3.5 h-3.5" />
                        编辑分镜
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/storyboard?projectId=${project.id}`) }}
                        className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                        className="p-2 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { to: '/assets', label: '管理资产', desc: '上传和管理素材', icon: FolderOpen, color: 'bg-accent-purple/10 text-accent-purple' },
            { to: '/gallery', label: '社区作品', desc: '浏览社区优秀作品', icon: Cpu, color: 'bg-accent-pink/10 text-accent-pink' },
            { to: '/wallet', label: '积分充值', desc: '购买积分套餐', icon: Zap, color: 'bg-accent-cyan/10 text-accent-cyan' },
            { to: '/profile', label: '账户设置', desc: '管理个人信息', icon: Settings, color: 'bg-info/10 text-info' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="bg-bg-secondary border border-border-default rounded-radius-lg p-5 hover:border-border-active transition-colors group"
            >
              <div className={`w-10 h-10 rounded-radius-md ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-text-primary mb-1">{action.label}</h3>
              <p className="text-text-muted text-xs">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
