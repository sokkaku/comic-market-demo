import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Zap,
  Clock,
  Settings2,
  Sparkles,
  Cpu,
} from 'lucide-react'
import { toast } from 'sonner'
import { modelApi } from '@/api'
import { Skeleton } from '@/components/ui/skeleton'
import type { AIModel } from '@/api'

export default function Models() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailModel, setDetailModel] = useState<AIModel | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        setError(null)
        const list = await modelApi.list()
        const sorted = [...list].sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
          return (a.sortOrder || 0) - (b.sortOrder || 0)
        })
        setModels(sorted)
      } catch (err: any) {
        setError(err?.message || '加载模型列表失败')
        toast.error('加载模型失败', { description: err?.message })
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const handleViewDetail = useCallback(async (model: AIModel) => {
    try {
      const detail = await modelApi.get(model.id)
      setDetailModel(detail)
    } catch (err: any) {
      toast.error('获取详情失败', { description: err?.message })
      setDetailModel(model)
    }
  }, [])

  const getModelBadge = (model: AIModel) => {
    if (!model.isActive) return { text: '即将上线', color: 'bg-warning' }
    if (model.isBeta) return { text: '测试版', color: 'bg-info' }
    if (model.sortOrder === 1) return { text: '热门', color: 'bg-error' }
    return { text: '可用', color: 'bg-success' }
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-1">模型中心</h1>
          <p className="text-text-secondary text-sm">
            浏览所有可用的视频生成模型；模型选择已下沉到分镜工作台，每个分镜可独立挑选模型与参数。
          </p>
        </div>

        <div className="flex items-start gap-3 bg-accent-cyan/5 border border-accent-cyan/20 rounded-radius-lg p-4 mb-8">
          <Cpu className="w-4 h-4 text-accent-cyan mt-0.5 shrink-0" />
          <p className="text-text-secondary text-xs">
            想用某个模型？打开任一项目 → 进入分镜工作台 → 在「模型与参数」分页选择即可。这里只是目录页。
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
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
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-bg-tertiary text-text-primary text-sm hover:bg-white/5 transition-colors"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model, index) => {
                const badge = getModelBadge(model)
                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-bg-secondary border border-border-default hover:border-border-active rounded-radius-lg overflow-hidden transition-all group"
                    style={{ borderTopColor: model.brandColor, borderTopWidth: '3px' }}
                  >
                    <div className="h-40 overflow-hidden relative">
                      {model.iconUrl ? (
                        <img
                          src={model.iconUrl}
                          alt={model.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `${model.brandColor}15` }}
                        >
                          <Sparkles className="w-12 h-12" style={{ color: model.brandColor }} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={`${badge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{model.name}</h3>
                      <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                        {model.description || '暂无描述'}
                      </p>

                      <div className="flex items-center gap-3 mb-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          最长 {model.maxDuration}s
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          系数 {model.costFactor}x
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${model.brandColor}15`, color: model.brandColor }}
                        >
                          {model.category}
                        </span>
                        {model.isBeta && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-info/10 text-info">
                            Beta
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewDetail(model)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-radius-sm bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-white/5 transition-colors"
                      >
                        <Settings2 className="w-4 h-4" />
                        查看参数详情
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {detailModel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-bg-secondary border border-border-default rounded-radius-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-text-primary text-lg">
                    {detailModel.name} - 详细信息
                  </h3>
                  <button
                    onClick={() => setDetailModel(null)}
                    className="text-text-muted hover:text-text-secondary text-sm"
                  >
                    关闭
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-bg-tertiary rounded-md p-3">
                    <span className="text-text-muted text-xs">适配器</span>
                    <p className="text-text-primary text-sm font-mono mt-1">{detailModel.adapter}</p>
                  </div>
                  <div className="bg-bg-tertiary rounded-md p-3">
                    <span className="text-text-muted text-xs">最大时长</span>
                    <p className="text-text-primary text-sm font-mono mt-1">{detailModel.maxDuration} 秒</p>
                  </div>
                  <div className="bg-bg-tertiary rounded-md p-3">
                    <span className="text-text-muted text-xs">成本系数</span>
                    <p className="text-text-primary text-sm font-mono mt-1">{detailModel.costFactor}x</p>
                  </div>
                  <div className="bg-bg-tertiary rounded-md p-3">
                    <span className="text-text-muted text-xs">分类</span>
                    <p className="text-text-primary text-sm font-mono mt-1">{detailModel.category}</p>
                  </div>
                </div>
                {detailModel.supportedParams && (
                  <div className="mt-4">
                    <span className="text-text-muted text-xs">支持参数</span>
                    <pre className="mt-2 p-3 bg-bg-tertiary rounded-md text-xs text-text-secondary font-mono overflow-auto max-h-48">
                      {JSON.stringify(detailModel.supportedParams, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
