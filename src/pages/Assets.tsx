import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  Upload,
  Image,
  Video,
  FileText,
  Search,
  Trash2,
  Tag,
  X,
  Grid3X3,
  List,
  AlertCircle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Loader2,
  Wand2,
  Sparkles,
  Download,
  RefreshCw,
  Share2,
  Clapperboard,
  Box,
  PenLine,
  Film,
} from 'lucide-react'
import { toast } from 'sonner'
import { assetApi, imageGenerationApi, communityApi } from '@/api'
import { downloadFile } from '@/lib/download'
import { Skeleton } from '@/components/ui/skeleton'
import SceneAssetEditor, { type SceneEditorMode } from '@/components/SceneAssetEditor'
import type { Asset, ImageModelConfig, SceneAssetKind } from '@/api/types'

const assetTypes = [
  { label: '全部', value: '', icon: FolderOpen },
  { label: '角色', value: 'character', icon: Image },
  { label: '背景', value: 'background', icon: Image },
  { label: '道具', value: 'prop', icon: FileText },
  { label: '场景', value: 'scene', icon: Clapperboard },
  { label: '视频', value: 'video', icon: Video },
]

const sortOptions = [
  { label: '最新上传', value: 'createdAt:desc' },
  { label: '最早上传', value: 'createdAt:asc' },
  { label: '名称 A-Z', value: 'name:asc' },
  { label: '名称 Z-A', value: 'name:desc' },
  { label: '最大文件', value: 'size:desc' },
  { label: '最小文件', value: 'size:asc' },
]

const sceneKindOptions: Array<{
  label: string
  value: '' | SceneAssetKind
  description: string
  actionLabel: string
  icon: typeof Image
}> = [
  { label: '全部场景', value: '', description: '图片、3D、预览', actionLabel: '打开场景', icon: Clapperboard },
  { label: '图片场景', value: 'image', description: '静态参考图', actionLabel: '生成 3D 预览', icon: Image },
  { label: '3D 编辑场景', value: 'editable3d', description: '可调角色骨骼', actionLabel: '编辑 3D 场景', icon: Box },
  { label: '图片生成分镜 3D 预览', value: 'imageToStoryboard3d', description: '图转分镜预演', actionLabel: '打开 3D 预览', icon: Clapperboard },
]

const getErrorMessage = (error: unknown, fallback = '未知错误') => {
  return error instanceof Error ? error.message : fallback
}

/** 场景资产缺少子类型时按图片场景处理，避免旧数据在资产页里失去可操作入口。 */
const getSceneKind = (asset: Asset): SceneAssetKind => asset.sceneKind ?? 'image'

/** 场景卡片和列表共用同一份元信息，保证筛选标签、按钮文案和编辑模式一致。 */
const getSceneKindOption = (asset: Asset) => {
  const kind = getSceneKind(asset)
  return sceneKindOptions.find((option) => option.value === kind) ?? sceneKindOptions[1]
}

/** 图片类场景进入 3D 预览生成模式，真正的 3D 场景进入可编辑导演台模式。 */
const getSceneEditorMode = (asset: Asset): SceneEditorMode => {
  return getSceneKind(asset) === 'editable3d' ? 'edit3d' : 'storyboardPreview'
}

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt:desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [taggingAsset, setTaggingAsset] = useState<string | null>(null)

  // ── Generate asset state ──
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // ── Share asset state ──
  const [shareAsset, setShareAsset] = useState<Asset | null>(null)
  const [shareWorkType, setShareWorkType] = useState('asset')
  const [shareTags, setShareTags] = useState('')
  const [sharing, setSharing] = useState(false)
  const [editingSceneAsset, setEditingSceneAsset] = useState<Asset | null>(null)
  const [sceneEditorMode, setSceneEditorMode] = useState<SceneEditorMode>('edit3d')
  const [sceneKindFilter, setSceneKindFilter] = useState<'' | SceneAssetKind>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Parse sort
  const [sortField, sortOrder] = sortBy.split(':') as [string, 'asc' | 'desc']

  const visibleAssets = useMemo(() => {
    if (typeFilter !== 'scene' || !sceneKindFilter) return assets
    return assets.filter((asset) => asset.type === 'scene' && getSceneKind(asset) === sceneKindFilter)
  }, [assets, sceneKindFilter, typeFilter])

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {
        sortBy: sortField,
        sortOrder,
      }
      if (typeFilter) params.type = typeFilter
      if (search.trim()) params.search = search.trim()
      const result = await assetApi.list(params)
      setAssets(result.assets || [])
    } catch (err: unknown) {
      const message = getErrorMessage(err, '加载资产失败')
      setError(message)
      toast.error('加载资产失败', { description: message })
    } finally {
      setLoading(false)
    }
  }, [typeFilter, sortField, sortOrder, search])

  // Initial fetch and filter change
  useEffect(() => {
    void Promise.resolve().then(fetchAssets)
  }, [fetchAssets])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      // fetchAssets will trigger via useEffect when search changes
    }, 300)
  }

  // Upload
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name)
        // Guess type from mime
        let type = 'prop'
        if (file.type.startsWith('image/')) type = file.name.includes('bg') || file.name.includes('背景') ? 'background' : 'character'
        if (file.type.startsWith('video/')) type = 'video'
        formData.append('type', type)
        formData.append('tags', '')

        try {
          await assetApi.upload(formData)
          return { success: true, name: file.name }
        } catch (err: unknown) {
          return { success: false, name: file.name, error: getErrorMessage(err) }
        }
      })

      toast.loading(`正在上传 ${files.length} 个文件...`, { id: 'upload-batch' })
      const results = await Promise.all(uploadPromises)
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      if (failed === 0) {
        toast.success(`成功上传 ${succeeded} 个文件`, { id: 'upload-batch' })
      } else {
        toast.error(`上传完成: ${succeeded} 成功, ${failed} 失败`, { id: 'upload-batch' })
      }

      setUploading(false)
      if (e.target) e.target.value = ''
      await fetchAssets()
    },
    [fetchAssets]
  )

  // Delete single
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        toast.loading('删除中...', { id: `del-${id}` })
        await assetApi.delete(id)
        toast.success('已删除', { id: `del-${id}` })
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        await fetchAssets()
      } catch (err: unknown) {
        toast.error('删除失败', { id: `del-${id}`, description: getErrorMessage(err) })
      }
    },
    [fetchAssets]
  )

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    try {
      toast.loading(`正在删除 ${selectedIds.size} 项...`, { id: 'bulk-del' })
      await assetApi.bulkDelete(Array.from(selectedIds))
      toast.success('批量删除完成', { id: 'bulk-del' })
      setSelectedIds(new Set())
      await fetchAssets()
    } catch (err: unknown) {
      toast.error('批量删除失败', { id: 'bulk-del', description: getErrorMessage(err) })
    }
  }, [selectedIds, fetchAssets])

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === visibleAssets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleAssets.map((asset) => asset.id)))
    }
  }, [selectedIds.size, visibleAssets])

  /** 打开场景资产时根据子类型选择编辑器模式，图片场景会进入图生分镜 3D 预览流程。 */
  const handleOpenSceneAsset = useCallback((asset: Asset) => {
    setSceneEditorMode(getSceneEditorMode(asset))
    setEditingSceneAsset(asset)
  }, [])

  // Add tag
  const handleAddTag = useCallback(
    async (assetId: string, tag: string) => {
      if (!tag.trim()) return
      try {
        await assetApi.addTag(assetId, tag.trim())
        toast.success(`标签 "${tag.trim()}" 已添加`)
        setTagInput('')
        await fetchAssets()
      } catch (err: unknown) {
        toast.error('添加标签失败', { description: getErrorMessage(err) })
      }
    },
    [fetchAssets]
  )

  // Remove tag
  const handleRemoveTag = useCallback(
    async (assetId: string, tag: string) => {
      try {
        await assetApi.removeTag(assetId, tag)
        toast.success(`标签 "${tag}" 已移除`)
        await fetchAssets()
      } catch (err: unknown) {
        toast.error('移除标签失败', { description: getErrorMessage(err) })
      }
    },
    [fetchAssets]
  )

  // Share to community
  const handleShare = useCallback(async () => {
    if (!shareAsset) return
    setSharing(true)
    try {
      await communityApi.share({
        sourceType: 'asset',
        sourceId: shareAsset.id,
        title: shareAsset.name,
        workType: shareWorkType,
        mediaUrl: shareAsset.url,
        thumbnailUrl: shareAsset.thumbnail ?? undefined,
        tags: shareTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      })
      toast.success('已分享到社区')
      setShareAsset(null)
      setShareWorkType('asset')
      setShareTags('')
    } catch (err: unknown) {
      toast.error('分享失败', { description: getErrorMessage(err) })
    } finally {
      setSharing(false)
    }
  }, [shareAsset, shareWorkType, shareTags])

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Category counts (derived from current assets for display)
  const categoryCounts = assetTypes.map((cat) => ({
    ...cat,
    count: cat.value === '' ? assets.length : assets.filter((a) => a.type === cat.value).length,
  }))

  const sceneKindCounts = sceneKindOptions.map((option) => ({
    ...option,
    count: option.value === ''
      ? assets.filter((asset) => asset.type === 'scene').length
      : assets.filter((asset) => asset.type === 'scene' && getSceneKind(asset) === option.value).length,
  }))

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-1">资产管理</h1>
            <p className="text-text-secondary text-sm">管理角色、背景、道具等素材</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-accent-cyan/30 text-accent-cyan font-display font-semibold text-sm hover:bg-accent-cyan/5 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              AI 生成
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? '上传中...' : '上传素材'}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {categoryCounts.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setTypeFilter(cat.value)
                if (cat.value !== 'scene') setSceneKindFilter('')
              }}
              className={`bg-bg-secondary border rounded-radius-lg p-4 text-center hover:border-border-active transition-all ${
                typeFilter === cat.value
                  ? 'border-accent-cyan/50 bg-accent-cyan/5'
                  : 'border-border-default'
              }`}
            >
              <cat.icon className="w-5 h-5 text-accent-cyan mx-auto mb-1.5" />
              <h3 className="font-display font-semibold text-text-primary text-sm">{cat.label}</h3>
              <p className="text-text-muted text-xs mt-0.5">{cat.count} 个文件</p>
            </button>
          ))}
        </div>

        {typeFilter === 'scene' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {sceneKindCounts.map((option) => (
              <button
                key={option.value || 'all-scenes'}
                onClick={() => setSceneKindFilter(option.value)}
                className={`bg-bg-secondary border rounded-radius-lg p-4 text-left hover:border-border-active transition-all ${
                  sceneKindFilter === option.value
                    ? 'border-accent-cyan/50 bg-accent-cyan/5'
                    : 'border-border-default'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <option.icon className="w-5 h-5 text-accent-cyan" />
                  <span className="text-text-muted text-xs font-mono">{option.count}</span>
                </div>
                <h3 className="font-display font-semibold text-text-primary text-sm">{option.label}</h3>
                <p className="text-text-muted text-xs mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索资产..."
                className="w-full pl-9 pr-4 py-2 rounded-md bg-bg-secondary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-md bg-bg-secondary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan transition-colors appearance-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-bg-secondary border border-border-default rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-accent-cyan/5 border border-accent-cyan/20 rounded-radius-lg"
          >
            <span className="text-sm text-text-secondary">已选择 {selectedIds.size} 项</span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              批量删除
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-text-muted hover:text-text-secondary ml-auto"
            >
              取消选择
            </button>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-radius-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-radius-lg" />
              ))}
            </div>
          )
        ) : error ? (
          <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-12 text-center">
            <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">加载失败</h3>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <button
              onClick={fetchAssets}
              className="px-4 py-2 rounded-md bg-bg-tertiary text-text-primary text-sm hover:bg-white/5 transition-colors"
            >
              重试
            </button>
          </div>
        ) : visibleAssets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-bg-secondary border border-dashed border-border-default rounded-radius-lg p-12 text-center"
          >
            <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
              {search || typeFilter ? '未找到匹配的素材' : '暂无资产'}
            </h3>
            <p className="text-text-secondary text-sm">
              {search || typeFilter ? '尝试调整筛选条件' : '上传你的第一个素材开始使用'}
            </p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {visibleAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden hover:border-border-active transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square overflow-hidden bg-bg-tertiary">
                    {asset.thumbnail || asset.url ? (
                      <img
                        src={asset.thumbnail || asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {asset.type === 'scene' ? (
                          <Clapperboard className="w-8 h-8 text-text-muted" />
                        ) : asset.type === 'video' ? (
                          <Video className="w-8 h-8 text-text-muted" />
                        ) : (
                          <Image className="w-8 h-8 text-text-muted" />
                        )}
                      </div>
                    )}
                    {/* Selection overlay */}
                    <div
                      className="absolute top-2 left-2"
                      onClick={() => toggleSelect(asset.id)}
                    >
                      {selectedIds.has(asset.id) ? (
                        <CheckSquare className="w-5 h-5 text-accent-cyan" />
                      ) : (
                        <Square className="w-5 h-5 text-white/60 hover:text-white" />
                      )}
                    </div>
                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.type === 'scene' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenSceneAsset(asset)
                          }}
                          className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-accent-cyan transition-colors"
                          title={getSceneKindOption(asset).actionLabel}
                        >
                          <Clapperboard className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadFile(asset.url, asset.name)
                        }}
                        className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-accent-cyan transition-colors"
                        title="下载"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShareAsset(asset)
                          setShareWorkType(asset.type === 'video' ? 'video' : 'asset')
                          setShareTags(asset.tags?.join(', ') || '')
                        }}
                        className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-accent-green transition-colors"
                        title="分享到社区"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setTaggingAsset(taggingAsset === asset.id ? null : asset.id)}
                        className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-accent-cyan transition-colors"
                        title="标签"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 rounded-md bg-bg-primary/80 text-text-secondary hover:text-error transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Type badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary/80 text-text-secondary font-mono">
                        {asset.type === 'scene' ? getSceneKindOption(asset).label : asset.type}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h4 className="font-display font-medium text-text-primary text-sm truncate" title={asset.name}>
                      {asset.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-text-muted text-xs font-mono">{formatSize(asset.size)}</span>
                      <span className="text-text-muted text-xs">{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                    {asset.type === 'scene' && (
                      <button
                        onClick={() => handleOpenSceneAsset(asset)}
                        className="mt-2 w-full rounded-md border border-accent-cyan/25 bg-accent-cyan/5 px-2 py-1.5 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                      >
                        {getSceneKindOption(asset).actionLabel}
                      </button>
                    )}
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {asset.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-secondary"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(asset.id, tag)}
                            className="hover:text-error"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {/* Tag input */}
                    <AnimatePresence>
                      {taggingAsset === asset.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-1 mt-2">
                            <input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddTag(asset.id, tagInput)
                                }
                              }}
                              placeholder="添加标签..."
                              className="flex-1 px-2 py-1 rounded bg-bg-tertiary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddTag(asset.id, tagInput)}
                              className="px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan text-xs hover:bg-accent-cyan/20 transition-colors"
                            >
                              添加
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {/* List Header */}
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-text-muted font-medium">
              <button onClick={selectAll} className="shrink-0">
                {selectedIds.size === visibleAssets.length && visibleAssets.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-accent-cyan" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span className="flex-1">名称</span>
              <span className="w-24 text-center hidden sm:block">类型</span>
              <span className="w-24 text-center hidden md:block">大小</span>
              <span className="w-32 text-center hidden lg:block">上传时间</span>
              <span className="w-36 text-center">操作</span>
            </div>
            <AnimatePresence>
              {visibleAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border border-border-default rounded-radius-lg hover:border-border-active transition-colors group"
                >
                  <button onClick={() => toggleSelect(asset.id)} className="shrink-0">
                    {selectedIds.has(asset.id) ? (
                      <CheckSquare className="w-4 h-4 text-accent-cyan" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt=""
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center shrink-0">
                        {asset.type === 'scene' ? (
                          <Clapperboard className="w-4 h-4 text-text-muted" />
                        ) : asset.type === 'video' ? (
                          <Video className="w-4 h-4 text-text-muted" />
                        ) : (
                          <Image className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-text-primary text-sm truncate">{asset.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {asset.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0 rounded bg-bg-tertiary text-text-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="w-24 text-center text-xs text-text-secondary hidden sm:block capitalize">
                    {asset.type === 'scene' ? getSceneKindOption(asset).label : asset.type}
                  </span>
                  <span className="w-24 text-center text-xs text-text-muted font-mono hidden md:block">
                    {formatSize(asset.size)}
                  </span>
                  <span className="w-32 text-center text-xs text-text-muted hidden lg:block">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                  <div className="w-36 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.type === 'scene' && (
                      <button
                        onClick={() => handleOpenSceneAsset(asset)}
                        className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-colors"
                        title={getSceneKindOption(asset).actionLabel}
                      >
                        <Clapperboard className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadFile(asset.url, asset.name)}
                      className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-colors"
                      title="下载"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setShareAsset(asset)
                        setShareWorkType(asset.type === 'video' ? 'video' : 'asset')
                        setShareTags(asset.tags?.join(', ') || '')
                      }}
                      className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-accent-green transition-colors"
                      title="分享到社区"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTaggingAsset(taggingAsset === asset.id ? null : asset.id)}
                      className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-accent-cyan transition-colors"
                      title="标签"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Share Asset Modal ── */}
      <AnimatePresence>
        {shareAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShareAsset(null)
              setShareWorkType('asset')
              setShareTags('')
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-bg-secondary border border-border-default rounded-radius-lg w-full max-w-md"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-accent-green" />
                  <h3 className="font-display font-semibold text-text-primary">分享到社区</h3>
                </div>
                <button
                  onClick={() => {
                    setShareAsset(null)
                    setShareWorkType('asset')
                    setShareTags('')
                  }}
                  className="p-1 rounded hover:bg-white/5 text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-4">
                {/* Preview */}
                <div className="rounded-lg overflow-hidden border border-border-default bg-bg-tertiary">
                  {shareAsset.thumbnail || shareAsset.url ? (
                    <img
                      src={shareAsset.thumbnail || shareAsset.url}
                      alt={shareAsset.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center">
                      <Image className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                </div>
                <p className="text-text-primary text-sm font-medium">{shareAsset.name}</p>

                {/* Work Type */}
                <div>
                  <label className="block text-sm text-text-secondary mb-2">作品类型</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'video', label: '视频', icon: Clapperboard },
                      { value: 'image', label: '图片', icon: Image },
                      { value: 'asset', label: '素材', icon: Box },
                      { value: 'comic', label: '漫画', icon: PenLine },
                      { value: 'animation', label: '动画', icon: Film },
                    ].map((wt) => (
                      <button
                        key={wt.value}
                        onClick={() => setShareWorkType(wt.value)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          shareWorkType === wt.value
                            ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                            : 'bg-bg-tertiary text-text-secondary border border-border-default hover:border-border-active'
                        }`}
                      >
                        <wt.icon className="w-3 h-3" />
                        {wt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">标签（逗号分隔）</label>
                  <input
                    value={shareTags}
                    onChange={(e) => setShareTags(e.target.value)}
                    placeholder="古风, 战斗, 浪漫..."
                    className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm placeholder-text-muted outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShareAsset(null)
                      setShareWorkType('asset')
                      setShareTags('')
                    }}
                    className="flex-1 py-2.5 rounded-radius-sm border border-border-default text-text-secondary text-sm font-medium hover:border-border-active transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex-[2] py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sharing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        分享中...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        分享到社区
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingSceneAsset && (
        <SceneAssetEditor
          asset={editingSceneAsset}
          mode={sceneEditorMode}
          onClose={() => setEditingSceneAsset(null)}
          onSaved={() => fetchAssets()}
        />
      )}

      {/* ── Generate Asset Modal ── */}
      <GenerateAssetModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerated={() => {
          setShowGenerateModal(false)
          fetchAssets()
        }}
      />
    </div>
  )
}

/* ── Generate Asset Modal Component ── */
function GenerateAssetModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean
  onClose: () => void
  onGenerated: () => void
}) {
  const [models, setModels] = useState<ImageModelConfig[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [assetType, setAssetType] = useState<'CHARACTER' | 'BACKGROUND' | 'PROP'>('CHARACTER')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [seed, setSeed] = useState('')
  const [steps, setSteps] = useState(20)
  const [cfgScale, setCfgScale] = useState(7.5)
  const [style, setStyle] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const selectedModel = models.find((m) => m.id === selectedModelId)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      setModelsLoading(true)
      setModelsError(null)
      try {
        const list = await imageGenerationApi.listModels()
        if (cancelled) return
        setModels(list)
        if (list.length > 0) {
          const first = list[0]
          setSelectedModelId(first.id)
          setWidth(first.params.defaultWidth)
          setHeight(first.params.defaultHeight)
          if (first.params.supportsSteps && first.params.defaultSteps) {
            setSteps(first.params.defaultSteps)
          }
          if (first.params.supportsCfgScale && first.params.defaultCfgScale) {
            setCfgScale(first.params.defaultCfgScale)
          }
        }
      } catch (err: unknown) {
        if (!cancelled) setModelsError(getErrorMessage(err, '加载模型失败'))
      } finally {
        if (!cancelled) setModelsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open])

  const handleModelChange = (modelId: string) => {
    const m = models.find((x) => x.id === modelId)
    if (!m) return
    setSelectedModelId(modelId)
    setWidth(m.params.defaultWidth)
    setHeight(m.params.defaultHeight)
    if (m.params.supportsSteps && m.params.defaultSteps) {
      setSteps(m.params.defaultSteps)
    } else {
      setSteps(20)
    }
    if (m.params.supportsCfgScale && m.params.defaultCfgScale) {
      setCfgScale(m.params.defaultCfgScale)
    } else {
      setCfgScale(7.5)
    }
    setStyle('')
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词')
      return
    }
    if (!selectedModelId) {
      toast.error('请选择生图模型')
      return
    }
    setIsGenerating(true)
    try {
      await assetApi.generate({
        prompt: prompt.trim(),
        type: assetType,
        name: prompt.trim().slice(0, 50),
        width,
        height,
        seed: seed ? Number(seed) : undefined,
        model: selectedModelId,
        negativePrompt: negativePrompt.trim() || undefined,
        tags: ['generated', 'ai', assetType.toLowerCase()],
      })
      toast.success('素材生成成功！')
      setPreviewUrl(null)
      onGenerated()
    } catch (err: unknown) {
      toast.error('生成失败: ' + getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async () => {
    if (!prompt.trim()) {
      toast.error('请先输入提示词')
      return
    }
    if (!selectedModelId) {
      toast.error('请选择生图模型')
      return
    }
    setPreviewLoading(true)
    try {
      const result = await imageGenerationApi.generate({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        width,
        height,
        seed: seed ? Number(seed) : undefined,
        steps: selectedModel?.params.supportsSteps ? steps : undefined,
        cfgScale: selectedModel?.params.supportsCfgScale ? cfgScale : undefined,
        model: selectedModelId,
        style: style || undefined,
      })
      setPreviewUrl(result.url)
    } catch (err: unknown) {
      toast.error('预览失败: ' + getErrorMessage(err))
    } finally {
      setPreviewLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-bg-secondary border border-border-default rounded-radius-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-cyan" />
            <h3 className="font-display font-semibold text-text-primary">AI 生成素材</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {modelsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent-cyan" />
              <span className="ml-2 text-sm text-text-secondary">加载模型中...</span>
            </div>
          )}
          {modelsError && (
            <div className="bg-error/10 border border-error/20 rounded-radius-md p-4 text-center">
              <AlertCircle className="w-5 h-5 text-error mx-auto mb-2" />
              <p className="text-sm text-error">{modelsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-text-secondary hover:text-text-primary"
              >
                刷新重试
              </button>
            </div>
          )}

          {!modelsLoading && !modelsError && models.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-text-secondary">暂无可用的生图模型</p>
            </div>
          )}

          {!modelsLoading && !modelsError && models.length > 0 && (
            <>
              {/* Asset Type */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">素材类型</label>
                <div className="flex gap-2">
                  {[
                    { value: 'CHARACTER' as const, label: '角色', icon: Image },
                    { value: 'BACKGROUND' as const, label: '背景', icon: Image },
                    { value: 'PROP' as const, label: '道具', icon: FileText },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setAssetType(t.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-radius-md border text-sm font-medium transition-all ${
                        assetType === t.value
                          ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                          : 'border-border-default text-text-secondary hover:border-border-active'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">提示词</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想生成的素材，例如：一位穿着古装的少女，站在樱花树下..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm placeholder-text-muted outline-none focus:border-accent-cyan transition-colors resize-none"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  生图模型
                  {selectedModel && (
                    <span className="ml-2 text-xs text-text-muted">
                      {selectedModel.provider} · {selectedModel.costCredits} 积分
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleModelChange(m.id)}
                      className={`flex flex-col items-start p-2.5 rounded-radius-md border text-left transition-all ${
                        selectedModelId === m.id
                          ? 'border-accent-cyan bg-accent-cyan/5'
                          : 'border-border-default hover:border-border-active'
                      }`}
                    >
                      <span className={`text-sm font-medium ${selectedModelId === m.id ? 'text-accent-cyan' : 'text-text-primary'}`}>
                        {m.name}
                      </span>
                      <span className="text-xs text-text-muted line-clamp-1">{m.description || m.provider}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              {selectedModel && selectedModel.params.supportedSizes.length > 0 && (
                <div>
                  <label className="block text-sm text-text-secondary mb-2">图片尺寸</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.params.supportedSizes.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => { setWidth(s.width); setHeight(s.height) }}
                        className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                          width === s.width && height === s.height
                            ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                            : 'border-border-default text-text-secondary hover:border-border-active'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs mt-1">{width} × {height} px</p>
                </div>
              )}

              {/* Negative Prompt */}
              {selectedModel?.params.supportsNegativePrompt && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">反向提示词（可选）</label>
                  <input
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="不希望出现的元素..."
                    className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm placeholder-text-muted outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
              )}

              {/* Seed */}
              {selectedModel?.params.supportsSeed && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">种子值（可选）</label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="留空则随机"
                    className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm placeholder-text-muted outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
              )}

              {/* Steps */}
              {selectedModel?.params.supportsSteps && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    步数 (Steps)
                    <span className="ml-1 text-xs text-text-muted">
                      {steps} / {selectedModel.params.minSteps ?? 1}-{selectedModel.params.maxSteps ?? 100}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={selectedModel.params.minSteps ?? 1}
                    max={selectedModel.params.maxSteps ?? 100}
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full accent-accent-cyan"
                  />
                </div>
              )}

              {/* CFG Scale */}
              {selectedModel?.params.supportsCfgScale && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    CFG Scale
                    <span className="ml-1 text-xs text-text-muted">
                      {cfgScale} / {selectedModel.params.minCfgScale ?? 1}-{selectedModel.params.maxCfgScale ?? 30}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={selectedModel.params.minCfgScale ?? 1}
                    max={selectedModel.params.maxCfgScale ?? 30}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-full accent-accent-cyan"
                  />
                </div>
              )}

              {/* Style */}
              {selectedModel?.params.supportsStyle && selectedModel.params.styleOptions && selectedModel.params.styleOptions.length > 0 && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">风格</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-bg-primary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">默认</option>
                    {selectedModel.params.styleOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Preview */}
              {previewUrl && (
                <div className="rounded-radius-md border border-border-default overflow-hidden bg-bg-primary">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
                    <span className="text-xs text-text-secondary">预览</span>
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="text-text-muted hover:text-text-secondary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-full object-contain max-h-64"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePreview}
                  disabled={previewLoading || isGenerating || !prompt.trim()}
                  className="flex-1 py-2.5 rounded-radius-sm border border-border-default text-text-secondary text-sm font-medium hover:border-border-active transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {previewLoading ? '生成中...' : '预览'}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-[2] py-2.5 rounded-radius-sm bg-gradient-accent text-bg-primary font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      生成并保存
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
