import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter,
  Loader2,
  AlertCircle,
  X,
  Play,
  Image,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tag,
  Plus,
  Search,
  Film,
  Sparkles,
  PenLine,
  Clapperboard,
  Box,
  Download,
  Share2,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { communityApi, modelApi } from '@/api'
import { useAuth } from '@/context/AuthContext'
import { downloadFile } from '@/lib/download'
import { Skeleton } from '@/components/ui/skeleton'
import type { CommunityWork, AIModel } from '@/api'

const workTypeFilters = [
  { label: '全部类型', value: '', icon: Film },
  { label: '视频', value: 'video', icon: Clapperboard },
  { label: '图片', value: 'image', icon: Image },
  { label: '素材', value: 'asset', icon: Box },
  { label: '漫画', value: 'comic', icon: PenLine },
  { label: '动画', value: 'animation', icon: Sparkles },
]

const workTypeLabel: Record<string, string> = {
  video: '视频',
  image: '图片',
  asset: '素材',
  comic: '漫画',
  animation: '动画',
}

const workTypeColor: Record<string, string> = {
  video: 'bg-accent-purple/15 text-accent-purple',
  image: 'bg-accent-cyan/15 text-accent-cyan',
  asset: 'bg-accent-green/15 text-accent-green',
  comic: 'bg-accent-pink/15 text-accent-pink',
  animation: 'bg-accent-orange/15 text-accent-orange',
}

const POPULAR_TAGS = ['古风', '科幻', '战斗', '浪漫', '日常', '悬疑', '搞笑', '治愈', '热血', '奇幻']

export default function Gallery() {
  const { user } = useAuth()
  const [works, setWorks] = useState<CommunityWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [workTypeFilter, setWorkTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [models, setModels] = useState<AIModel[]>([])

  const [selectedWork, setSelectedWork] = useState<CommunityWork | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 })

  // Tag editing state
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  const isOwner = (work: CommunityWork) => user?.id === work.userId

  // Fetch models for filter
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const list = await modelApi.list()
        setModels(list)
      } catch {
        // silently fail
      }
    }
    fetchModels()
  }, [])

  // Fetch works
  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {
        page: String(page),
        limit: '12',
      }
      if (workTypeFilter) params.workType = workTypeFilter
      if (tagFilter) params.tag = tagFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const result = await communityApi.listWorks(params)
      setWorks(result.works || [])
      setMeta(result.meta || { page: 1, limit: 12, total: 0, totalPages: 1 })
    } catch (err: any) {
      setError(err?.message || '加载作品失败')
      toast.error('加载作品失败', { description: err?.message })
    } finally {
      setLoading(false)
    }
  }, [workTypeFilter, tagFilter, searchQuery, page])

  useEffect(() => {
    fetchWorks()
  }, [fetchWorks])

  // Fetch work detail
  const handleViewDetail = useCallback(async (work: CommunityWork) => {
    try {
      setDetailLoading(true)
      const detail = await communityApi.getWork(work.id)
      setSelectedWork(detail)
    } catch (err: any) {
      toast.error('获取详情失败', { description: err?.message })
      setSelectedWork(work)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // Add tag
  const handleAddTag = useCallback(async (workId: string, tag: string) => {
    if (!tag.trim()) return
    const work = works.find((w) => w.id === workId)
    if (!work || !isOwner(work)) return
    const newTags = [...new Set([...work.tags, tag.trim()])]
    if (newTags.length === work.tags.length) return

    setSavingTags(true)
    try {
      const updated = await communityApi.updateWork(workId, { tags: newTags })
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, tags: updated.tags || newTags } : w)))
      if (selectedWork?.id === workId) {
        setSelectedWork((prev) => (prev ? { ...prev, tags: updated.tags || newTags } : prev))
      }
      toast.success(`标签 "${tag.trim()}" 已添加`)
      setTagInput('')
    } catch (err: any) {
      toast.error('添加标签失败', { description: err?.message })
    } finally {
      setSavingTags(false)
    }
  }, [works, selectedWork, user])

  // Remove tag
  const handleRemoveTag = useCallback(async (workId: string, tag: string) => {
    const work = works.find((w) => w.id === workId)
    if (!work || !isOwner(work)) return
    const newTags = work.tags.filter((t) => t !== tag)

    setSavingTags(true)
    try {
      const updated = await communityApi.updateWork(workId, { tags: newTags })
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, tags: updated.tags || newTags } : w)))
      if (selectedWork?.id === workId) {
        setSelectedWork((prev) => (prev ? { ...prev, tags: updated.tags || newTags } : prev))
      }
      toast.success(`标签 "${tag}" 已移除`)
    } catch (err: any) {
      toast.error('移除标签失败', { description: err?.message })
    } finally {
      setSavingTags(false)
    }
  }, [works, selectedWork, user])

  // Unshare
  const handleUnshare = useCallback(async (workId: string) => {
    try {
      await communityApi.unshare(workId)
      setWorks((prev) => prev.filter((w) => w.id !== workId))
      setSelectedWork(null)
      toast.success('已从社区移除')
    } catch (err: any) {
      toast.error('移除失败', { description: err?.message })
    }
  }, [])

  // Format time
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin}分钟前`
    if (diffHour < 24) return `${diffHour}小时前`
    if (diffDay < 30) return `${diffDay}天前`
    return d.toLocaleDateString()
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-1">社区作品</h1>
            <p className="text-text-secondary text-sm">浏览和发现优秀的 AI 创作作品</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          {/* Row 1: Work Type + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Filter className="w-4 h-4 text-text-muted shrink-0" />
              {workTypeFilters.map((wt) => (
                <button
                  key={wt.value}
                  onClick={() => {
                    setWorkTypeFilter(wt.value)
                    setPage(1)
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    workTypeFilter === wt.value
                      ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                      : 'bg-bg-secondary text-text-secondary border border-border-default hover:border-border-active'
                  }`}
                >
                  <wt.icon className="w-3 h-3" />
                  {wt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="搜索标签或提示词..."
                className="w-full pl-8 pr-8 py-1.5 rounded-full bg-bg-secondary border border-border-default text-text-primary text-xs placeholder-text-muted outline-none focus:border-accent-cyan transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Popular Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3 h-3 text-text-muted" />
            {tagFilter && (
              <button
                onClick={() => setTagFilter('')}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
              >
                {tagFilter}
                <X className="w-2.5 h-2.5" />
              </button>
            )}
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setTagFilter(tag)
                  setPage(1)
                }}
                className={`px-2 py-0.5 rounded-full text-[11px] transition-colors ${
                  tagFilter === tag
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                    : 'bg-bg-tertiary text-text-muted border border-border-default hover:border-border-active hover:text-text-secondary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-12 text-center">
            <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">加载失败</h3>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <button
              onClick={fetchWorks}
              className="px-4 py-2 rounded-md bg-bg-tertiary text-text-primary text-sm hover:bg-white/5 transition-colors"
            >
              重试
            </button>
          </div>
        ) : works.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-bg-secondary border border-dashed border-border-default rounded-radius-lg p-12 text-center"
          >
            <Image className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">暂无作品</h3>
            <p className="text-text-secondary text-sm">
              {!workTypeFilter && !tagFilter && !searchQuery
                ? '还没有人分享作品，去生成一个吧！'
                : '该筛选条件下没有作品'}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {works.map((work) => (
                  <motion.div
                    key={work.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden hover:border-border-active transition-all cursor-pointer"
                    onClick={() => handleViewDetail(work)}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-48 overflow-hidden bg-bg-tertiary">
                      {work.thumbnailUrl ? (
                        <img
                          src={work.thumbnailUrl}
                          alt={work.title || '作品预览'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-10 h-10 text-text-muted" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />

                      {/* Work type badge */}
                      {work.workType && (
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${workTypeColor[work.workType] || 'bg-bg-tertiary text-text-muted'}`}>
                            {workTypeLabel[work.workType] || work.workType}
                          </span>
                        </div>
                      )}

                      {/* Download button (hover) */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFile(work.mediaUrl, work.title)
                          }}
                          className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-accent-cyan transition-colors"
                          title="下载"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-accent-cyan flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-bg-primary" />
                        </div>
                      </div>

                      {/* Bottom info: user */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2">
                          {work.userAvatar ? (
                            <img src={work.userAvatar} alt="" className="w-4 h-4 rounded-full" />
                          ) : (
                            <User className="w-3 h-3 text-text-muted" />
                          )}
                          <span className="text-text-secondary text-xs">{work.userName || '匿名用户'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-4 py-3">
                      {/* Tags */}
                      {work.tags && work.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {work.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                          {work.tags.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                              +{work.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTime(work.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-md bg-bg-secondary border border-border-default text-text-secondary hover:border-border-active disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-text-secondary font-mono px-3">
                  {page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="p-2 rounded-md bg-bg-secondary border border-border-default text-text-secondary hover:border-border-active disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setSelectedWork(null)
              setEditingTags(false)
              setTagInput('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-secondary border border-border-default rounded-radius-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-text-primary">作品详情</h3>
                  {selectedWork.workType && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${workTypeColor[selectedWork.workType] || 'bg-bg-tertiary text-text-muted'}`}>
                      {workTypeLabel[selectedWork.workType] || selectedWork.workType}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isOwner(selectedWork) && (
                    <button
                      onClick={() => handleUnshare(selectedWork.id)}
                      className="p-2 rounded-md hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                      title="取消分享"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedWork(null)
                      setEditingTags(false)
                      setTagInput('')
                    }}
                    className="p-2 rounded-md hover:bg-white/5 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Media */}
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border border-border-default">
                    {selectedWork.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                      <video
                        src={selectedWork.mediaUrl}
                        controls
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <img
                        src={selectedWork.mediaUrl || selectedWork.thumbnailUrl}
                        alt={selectedWork.title || '作品'}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Author */}
                <div className="flex items-center gap-2">
                  {selectedWork.userAvatar ? (
                    <img src={selectedWork.userAvatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center">
                      <User className="w-3 h-3 text-text-muted" />
                    </div>
                  )}
                  <span className="text-sm text-text-secondary">{selectedWork.userName || '匿名用户'}</span>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-text-muted text-xs">{formatTime(selectedWork.createdAt)}</span>
                </div>

                {/* Tags Section */}
                <div className="bg-bg-tertiary/30 rounded-radius-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      标签
                    </span>
                    {isOwner(selectedWork) && (
                      <button
                        onClick={() => setEditingTags(!editingTags)}
                        className="text-[11px] text-accent-cyan hover:underline"
                      >
                        {editingTags ? '完成' : '编辑'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWork.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border-default"
                      >
                        {tag}
                        {editingTags && isOwner(selectedWork) && (
                          <button
                            onClick={() => handleRemoveTag(selectedWork.id, tag)}
                            className="ml-0.5 hover:text-error"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    {(!selectedWork.tags || selectedWork.tags.length === 0) && !editingTags && (
                      <span className="text-text-muted text-xs">暂无标签</span>
                    )}
                  </div>
                  {editingTags && isOwner(selectedWork) && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag(selectedWork.id, tagInput)
                          }
                        }}
                        placeholder="添加标签..."
                        className="flex-1 px-2 py-1 rounded bg-bg-primary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
                      />
                      <button
                        onClick={() => handleAddTag(selectedWork.id, tagInput)}
                        disabled={!tagInput.trim() || savingTags}
                        className="px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan text-xs hover:bg-accent-cyan/20 transition-colors disabled:opacity-50"
                      >
                        {savingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile(selectedWork.mediaUrl, selectedWork.title)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-bg-tertiary text-text-secondary text-sm hover:bg-white/5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                </div>

                {/* Info */}
                {selectedWork.description && (
                  <p className="text-text-secondary text-sm">{selectedWork.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
