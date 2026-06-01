import { useEffect, useRef, useState } from 'react'
import { Play, Loader2, AlertCircle, RotateCw, Download, Film, Share2, X, Clapperboard, Image, Box, PenLine, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { generationApi, communityApi } from '@/api'
import { downloadFile } from '@/lib/download'
import type { Scene, GenerationJob } from '@/api'

/** 将 unknown 错误收敛成用户可读文案，避免不同异步入口重复写类型判断。 */
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误'
}

interface SceneGenerationPanelProps {
  scene: Scene
  onBeforeGenerate?: () => void | Promise<void>
  /** Triggered when the latest result snapshot should be refreshed (e.g. parent refetches scenes). */
  onCompleted?: () => void
}

type Phase = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export default function SceneGenerationPanel({ scene, onBeforeGenerate, onCompleted }: SceneGenerationPanelProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [latestUrl, setLatestUrl] = useState<string | null>(scene.latestResultUrl ?? null)
  const [latestThumb, setLatestThumb] = useState<string | null>(scene.latestResultThumbnail ?? null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareWorkType, setShareWorkType] = useState('video')
  const [shareTags, setShareTags] = useState('')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    setLatestUrl(scene.latestResultUrl ?? null)
    setLatestThumb(scene.latestResultThumbnail ?? null)
  }, [scene.latestResultUrl, scene.latestResultThumbnail])

  // Cleanup polling on unmount or scene change
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [scene.id])

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const beginPolling = (id: string) => {
    stopPolling()
    pollRef.current = window.setInterval(async () => {
      try {
        const job = await generationApi.getJob(id)
        applyJob(job)
        if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELED') {
          stopPolling()
        }
      } catch {
        // 网络瞬断不打断轮询。
      }
    }, 2000)
  }

  const applyJob = (job: GenerationJob) => {
    setProgress(job.progress ?? 0)
    if (job.status === 'QUEUED') {
      setPhase('queued')
      setMessage('排队中…')
    } else if (job.status === 'PROCESSING') {
      setPhase('processing')
      setMessage('生成中…')
    } else if (job.status === 'COMPLETED') {
      setPhase('completed')
      setMessage('完成')
      const result = job.results?.find((r) => r.sceneId === scene.id) ?? job.results?.[0]
      if (result) {
        setLatestUrl(result.url)
        setLatestThumb(result.thumbnail ?? null)
      }
      onCompleted?.()
      toast.success('分镜已生成')
    } else if (job.status === 'FAILED') {
      setPhase('failed')
      setError(job.errorMessage || '生成失败')
      toast.error('生成失败', { description: job.errorMessage })
    } else if (job.status === 'CANCELED') {
      setPhase('idle')
      setMessage('已取消')
    }
  }

  const generationMode = getGenerationMode(scene)
  const hasText =
    !!scene.prompt?.trim() ||
    !!scene.description?.trim()
  const hasReferenceImage = !!scene.referenceImage
  const ready =
    !!scene.modelId &&
    (generationMode === 'text_to_video'
      ? hasText
      : generationMode === 'image_to_video'
        ? hasReferenceImage
        : hasText && hasReferenceImage)

  const handleGenerate = async () => {
    if (!ready) {
      toast.error('请先选择模型并填写场景描述或提示词')
      return
    }
    try {
      await onBeforeGenerate?.()
      setError(null)
      setPhase('queued')
      setProgress(0)
      setMessage('提交中…')
      const job = await generationApi.submit({
        projectId: scene.projectId,
        sceneIds: [scene.id],
        workType: 'video',
      })
      setJobId(job.id)
      beginPolling(job.id)
      toast.success('已加入生成队列')
    } catch (err: unknown) {
      setPhase('failed')
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error('提交失败', { description: msg })
    }
  }

  const handleCancel = async () => {
    if (!jobId) return
    try {
      await generationApi.cancelJob(jobId)
      stopPolling()
      setPhase('idle')
      setMessage('已取消')
      toast.success('任务已取消')
    } catch (err: unknown) {
      toast.error('取消失败', { description: getErrorMessage(err) })
    }
  }

  const handleShare = async () => {
    if (!latestUrl || !jobId) return
    setSharing(true)
    try {
      await communityApi.share({
        sourceType: 'generation',
        sourceId: jobId,
        title: scene.title,
        workType: shareWorkType,
        mediaUrl: latestUrl,
        thumbnailUrl: latestThumb ?? undefined,
        tags: shareTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      })
      toast.success('已分享到社区')
      setShowShareModal(false)
      setShareTags('')
    } catch (err: unknown) {
      toast.error('分享失败', { description: getErrorMessage(err) })
    } finally {
      setSharing(false)
    }
  }

  const isBusy = phase === 'queued' || phase === 'processing'

  return (
    <div className="space-y-3">
      {/* Preview slot */}
      <div className="aspect-video w-full rounded-md overflow-hidden bg-bg-tertiary border border-border-default relative">
        {latestUrl ? (
          latestUrl.endsWith('.mp4') || latestUrl.endsWith('.webm') ? (
            <video
              src={latestUrl}
              poster={latestThumb ?? undefined}
              controls
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <img src={latestUrl} alt="最新生成" className="w-full h-full object-contain bg-black" />
          )
        ) : latestThumb ? (
          <img src={latestThumb} alt="预览" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted gap-2">
            <Film className="w-8 h-8" />
            <p className="text-xs">尚未生成成片</p>
          </div>
        )}
        {isBusy && (
          <div className="absolute inset-0 bg-bg-primary/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-text-primary">
            <Loader2 className="w-6 h-6 animate-spin text-accent-cyan" />
            <span className="font-mono text-sm">{progress}%</span>
            <span className="text-xs text-text-secondary">{message}</span>
          </div>
        )}
      </div>

      {/* Progress bar (only while busy) */}
      {isBusy && (
        <div className="h-1 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full bg-gradient-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error banner */}
      {phase === 'failed' && error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-error/5 border border-error/20 text-error text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {isBusy ? (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-bg-tertiary text-text-secondary text-sm hover:bg-white/5 transition-colors"
          >
            取消任务
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!ready}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-gradient-accent text-bg-primary text-sm font-medium hover:shadow-glow transition-shadow disabled:opacity-50 disabled:hover:shadow-none"
            title={!ready ? '请先选择模型并填写描述/提示词' : '生成此分镜'}
          >
            {latestUrl ? <RotateCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {latestUrl ? '重新生成' : '生成此分镜'}
          </button>
        )}
        {latestUrl && !isBusy && (
          <>
            <button
              onClick={() => {
                setShareWorkType(latestUrl.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image')
                setShowShareModal(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-bg-tertiary text-text-secondary text-sm hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              分享
            </button>
            <button
              onClick={() => downloadFile(latestUrl, `scene-${scene.number}-${scene.title}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-bg-tertiary text-text-secondary text-sm hover:bg-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载
            </button>
          </>
        )}
      </div>

      {!ready && phase === 'idle' && (
        <p className="text-text-muted text-[11px]">
          {getReadyHint(generationMode)}
        </p>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowShareModal(false)
            setShareTags('')
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-bg-secondary border border-border-default rounded-radius-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-accent-green" />
                <h3 className="font-display font-semibold text-text-primary">分享到社区</h3>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false)
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
                {latestUrl ? (
                  latestUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={latestUrl} className="w-full h-40 object-cover" controls />
                  ) : (
                    <img src={latestUrl} alt="预览" className="w-full h-40 object-cover" />
                  )
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <Film className="w-8 h-8 text-text-muted" />
                  </div>
                )}
              </div>
              <p className="text-text-primary text-sm font-medium">{scene.title}</p>

              {/* Work Type */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">作品类型</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'video', label: '视频', icon: Clapperboard },
                    { value: 'image', label: '图片', icon: Image },
                    { value: 'asset', label: '素材', icon: Box },
                    { value: 'comic', label: '漫画', icon: PenLine },
                    { value: 'animation', label: '动画', icon: Sparkles },
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
                    setShowShareModal(false)
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
          </div>
        </div>
      )}
    </div>
  )
}

/** 根据分镜参数推断生成方式，兼容旧分镜未显式保存 generationMode 的情况。 */
function getGenerationMode(scene: Scene) {
  const mode = scene.modelParams?.generationMode
  if (mode === 'text_to_video' || mode === 'image_to_video' || mode === 'image_text_to_video') {
    return mode
  }
  if (scene.referenceImage && (scene.prompt || scene.description)) return 'image_text_to_video'
  if (scene.referenceImage) return 'image_to_video'
  return 'text_to_video'
}

/** 按生成方式返回最具体的缺失条件提示，指导用户补齐模型、文字或参考图。 */
function getReadyHint(mode: ReturnType<typeof getGenerationMode>) {
  if (mode === 'image_to_video') return '需要先选定模型并挂载参考图才能生成'
  if (mode === 'image_text_to_video') return '需要先选定模型、挂载参考图并填写描述或提示词才能生成'
  return '需要先选定模型并填写描述或提示词才能生成'
}
