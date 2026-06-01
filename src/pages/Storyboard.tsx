import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Reorder, motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  AlertCircle,
  Save,
  Film,
  FileText,
  Image as ImageIcon,
  Images,
  Loader2,
  ChevronRight,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { projectApi, modelApi } from '@/api'
import { Skeleton } from '@/components/ui/skeleton'
import SceneAssetPicker from '@/components/SceneAssetPicker'
import {
  SceneModelPicker,
  SceneModelParams,
  type SceneParamsValue,
} from '@/components/SceneModelPicker'
import SceneGenerationPanel from '@/components/SceneGenerationPanel'
import type { Scene, AIModel } from '@/api'

const shotTypes = ['特写', '近景', '中景', '全景', '远景']
const cameraAngles = ['平视', '俯视', '仰视', '鸟瞰', '倾斜']
const cameraMoves = ['固定', '推镜', '拉镜', '摇镜', '跟拍', '环绕']
const transitions = ['切镜', '淡入淡出', '溶解', '划像', '闪白']
const stylePresets = ['写实', '动漫', '水墨', '赛博朋克', '复古']
type GenerationMode = 'text_to_video' | 'image_to_video' | 'image_text_to_video'

const generationModes: Array<{
  value: GenerationMode
  label: string
  icon: typeof FileText
}> = [
  { value: 'text_to_video', label: '文生视频', icon: FileText },
  { value: 'image_to_video', label: '图生视频', icon: ImageIcon },
  { value: 'image_text_to_video', label: '图+文生视频', icon: Images },
]

/** 将未知错误统一转成 toast 可展示的文案，接口或运行时异常都走同一出口。 */
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误'
}

interface SceneDraft {
  title: string
  description: string
  script: string
  duration: number
  shotType: string
  cameraAngle: string
  cameraMove: string
  transition: string
  stylePreset: string
  prompt: string
  negativePrompt: string
  generationMode: GenerationMode
  referenceImage: string | null
  modelId: string | null
  modelParams: SceneParamsValue
  characterIds: string[]
  backgroundId: string | null
  propIds: string[]
  audioId: string | null
}

function sceneToDraft(scene: Scene): SceneDraft {
  const mp = (scene.modelParams ?? {}) as SceneParamsValue
  return {
    title: scene.title,
    description: scene.description ?? '',
    script: scene.script ?? '',
    duration: scene.duration,
    shotType: scene.shotType ?? '中景',
    cameraAngle: scene.cameraAngle ?? '平视',
    cameraMove: scene.cameraMove ?? '固定',
    transition: scene.transition ?? '切镜',
    stylePreset: scene.stylePreset ?? '动漫',
    prompt: scene.prompt ?? '',
    negativePrompt: scene.negativePrompt ?? '',
    generationMode: resolveGenerationMode(scene),
    referenceImage: scene.referenceImage ?? null,
    modelId: scene.modelId ?? null,
    modelParams: {
      resolution: (mp.resolution as SceneParamsValue['resolution']) ?? '1080p',
      duration: scene.duration,
      fps: typeof mp.fps === 'number' ? mp.fps : 24,
      aspectRatio: (mp.aspectRatio as SceneParamsValue['aspectRatio']) ?? '16:9',
      seed: typeof mp.seed === 'number' ? mp.seed : (scene.seed ?? null),
      faceEnhance: !!mp.faceEnhance,
      superResolution: !!mp.superResolution,
      cfgScale: typeof mp.cfgScale === 'number' ? mp.cfgScale : 7,
      steps: typeof mp.steps === 'number' ? mp.steps : 30,
    },
    characterIds: scene.characterIds ?? [],
    backgroundId: scene.backgroundId ?? null,
    propIds: scene.propIds ?? [],
    audioId: scene.audioId ?? null,
  }
}

function draftToPayload(draft: SceneDraft) {
  return {
    title: draft.title,
    description: draft.description || null,
    script: draft.script || null,
    duration: draft.duration,
    shotType: draft.shotType,
    cameraAngle: draft.cameraAngle,
    cameraMove: draft.cameraMove,
    transition: draft.transition,
    stylePreset: draft.stylePreset,
    prompt: draft.prompt || null,
    negativePrompt: draft.negativePrompt || null,
    referenceImage: draft.referenceImage,
    seed: draft.modelParams.seed ?? null,
    modelId: draft.modelId,
    modelParams: {
      ...draft.modelParams,
      duration: draft.duration,
      generationMode: draft.generationMode,
    } as Record<string, unknown>,
    characterIds: draft.characterIds,
    backgroundId: draft.backgroundId,
    propIds: draft.propIds,
    audioId: draft.audioId,
  }
}

/** 从旧数据推断分镜生成方式，保证未保存 generationMode 的分镜也能按现有内容工作。 */
function resolveGenerationMode(scene: Scene): GenerationMode {
  const mode = scene.modelParams?.generationMode
  if (mode === 'text_to_video' || mode === 'image_to_video' || mode === 'image_text_to_video') {
    return mode
  }
  if (scene.referenceImage && (scene.prompt || scene.description)) return 'image_text_to_video'
  if (scene.referenceImage) return 'image_to_video'
  return 'text_to_video'
}

/** 把正在编辑的草稿合成临时 Scene，生成面板可直接用最新未刷新数据做校验和提交前保存。 */
function draftToScene(scene: Scene, draft: SceneDraft): Scene {
  return {
    ...scene,
    title: draft.title,
    description: draft.description || null,
    script: draft.script || null,
    duration: draft.duration,
    shotType: draft.shotType,
    cameraAngle: draft.cameraAngle,
    cameraMove: draft.cameraMove,
    transition: draft.transition,
    stylePreset: draft.stylePreset,
    prompt: draft.prompt || null,
    negativePrompt: draft.negativePrompt || null,
    referenceImage: draft.referenceImage,
    seed: draft.modelParams.seed ?? null,
    modelId: draft.modelId,
    modelParams: {
      ...draft.modelParams,
      duration: draft.duration,
      generationMode: draft.generationMode,
    } as Record<string, unknown>,
    characterIds: draft.characterIds,
    backgroundId: draft.backgroundId,
    propIds: draft.propIds,
    audioId: draft.audioId,
  }
}

export default function Storyboard() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('projectId')

  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SceneDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [models, setModels] = useState<AIModel[]>([])

  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  // Debounced autosave timer
  const autosaveRef = useRef<number | null>(null)

  useEffect(() => {
    modelApi
      .list()
      .then((res) => {
        setModels(res.filter((m) => m.isActive))
      })
      .catch(() => setModels([]))
  }, [])

  // Initial load
  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!projectId) {
        setLoading(false)
        setError('未指定项目 ID，请从仪表盘选择一个项目')
        return
      }
      try {
        setLoading(true)
        setError(null)
        const [proj, sceneList] = await Promise.all([
          projectApi.get(projectId),
          projectApi.listScenes(projectId),
        ])
        if (!alive) return
        setProjectName(proj.name || '')
        setProjectDesc(proj.description || '')
        setScenes(sceneList)
        if (sceneList.length > 0) {
          setSelectedSceneId(sceneList[0].id)
          setDraft(sceneToDraft(sceneList[0]))
        }
      } catch (err: unknown) {
        if (alive) {
          const message = getErrorMessage(err)
          setError(message || '加载项目失败')
          toast.error('加载项目失败', { description: message })
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [projectId])

  const selectedScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId]
  )

  const persistDraft = useCallback(
    async (showToast = true) => {
      if (!projectId || !selectedSceneId || !draft) return
      try {
        if (showToast) toast.loading('保存中…', { id: 'save-scene' })
        await projectApi.updateScene(projectId, selectedSceneId, draftToPayload(draft))
        if (showToast) toast.success('已保存', { id: 'save-scene' })
        setDirty(false)
        // Refresh list silently to pick up new derived fields
        const list = await projectApi.listScenes(projectId)
        setScenes(list)
      } catch (err: unknown) {
        toast.error('保存失败', {
          id: showToast ? 'save-scene' : undefined,
          description: getErrorMessage(err),
        })
      }
    },
    [projectId, selectedSceneId, draft]
  )

  // When user picks a different scene, load its draft
  const selectScene = useCallback(
    (scene: Scene) => {
      if (dirty && selectedScene) {
        // best-effort save before switching
        void persistDraft(false)
      }
      setSelectedSceneId(scene.id)
      setDraft(sceneToDraft(scene))
      setDirty(false)
    },
    [dirty, selectedScene, persistDraft]
  )

  const refreshScenes = useCallback(async () => {
    if (!projectId) return
    try {
      const list = await projectApi.listScenes(projectId)
      setScenes(list)
      // refresh current selection's snapshot fields without nuking unsaved edits
      const current = list.find((s) => s.id === selectedSceneId)
      if (current && !dirty) {
        setDraft(sceneToDraft(current))
      }
    } catch (err: unknown) {
      toast.error('刷新场景列表失败', { description: getErrorMessage(err) })
    }
  }, [projectId, selectedSceneId, dirty])

  // Autosave on edits — debounced 1200ms
  useEffect(() => {
    if (!dirty) return
    if (autosaveRef.current) window.clearTimeout(autosaveRef.current)
    autosaveRef.current = window.setTimeout(() => {
      void persistDraft(false)
    }, 1200)
    return () => {
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current)
    }
  }, [draft, dirty, persistDraft])

  const updateDraft = useCallback((partial: Partial<SceneDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev))
    setDirty(true)
  }, [])

  const handleAddScene = useCallback(async () => {
    if (!projectId) return
    const seq = (scenes.length + 1).toString().padStart(2, '0')
    try {
      toast.loading('新建场景…', { id: 'add-scene' })
      const created = await projectApi.createScene(projectId, {
        title: `场景 ${seq}`,
        duration: 5,
        shotType: '中景',
        cameraAngle: '平视',
        cameraMove: '固定',
        transition: '切镜',
        stylePreset: '动漫',
      })
      toast.success('已创建', { id: 'add-scene' })
      const list = await projectApi.listScenes(projectId)
      setScenes(list)
      setSelectedSceneId(created.id)
      setDraft(sceneToDraft(created))
      setDirty(false)
    } catch (err: unknown) {
      toast.error('创建失败', { id: 'add-scene', description: getErrorMessage(err) })
    }
  }, [projectId, scenes.length])

  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      if (!projectId) return
      if (!confirm('删除该场景？此操作不可撤销。')) return
      try {
        toast.loading('删除中…', { id: `del-${sceneId}` })
        await projectApi.deleteScene(projectId, sceneId)
        toast.success('已删除', { id: `del-${sceneId}` })
        const list = await projectApi.listScenes(projectId)
        setScenes(list)
        if (selectedSceneId === sceneId) {
          const next = list[0] ?? null
          setSelectedSceneId(next?.id ?? null)
          setDraft(next ? sceneToDraft(next) : null)
          setDirty(false)
        }
      } catch (err: unknown) {
        toast.error('删除失败', { id: `del-${sceneId}`, description: getErrorMessage(err) })
      }
    },
    [projectId, selectedSceneId]
  )

  const handleDuplicateScene = useCallback(
    async (sceneId: string) => {
      if (!projectId) return
      try {
        toast.loading('复制中…', { id: `dup-${sceneId}` })
        const dup = await projectApi.duplicateScene(projectId, sceneId)
        toast.success('已复制', { id: `dup-${sceneId}` })
        const list = await projectApi.listScenes(projectId)
        setScenes(list)
        setSelectedSceneId(dup.id)
        setDraft(sceneToDraft(dup))
        setDirty(false)
      } catch (err: unknown) {
        toast.error('复制失败', { id: `dup-${sceneId}`, description: getErrorMessage(err) })
      }
    },
    [projectId]
  )

  const handleReorder = useCallback(
    async (newOrder: Scene[]) => {
      if (!projectId) return
      setScenes(newOrder)
      try {
        await projectApi.reorderScenes(
          projectId,
          newOrder.map((s) => s.id)
        )
      } catch (err: unknown) {
        toast.error('排序失败', { description: getErrorMessage(err) })
        await refreshScenes()
      }
    },
    [projectId, refreshScenes]
  )

  const handleSaveProject = useCallback(async () => {
    if (!projectId) return
    try {
      setSaving(true)
      toast.loading('保存项目…', { id: 'save-project' })
      await projectApi.update(projectId, {
        name: projectName,
        description: projectDesc,
      })
      toast.success('已保存', { id: 'save-project' })
    } catch (err: unknown) {
      toast.error('保存失败', { id: 'save-project', description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }, [projectId, projectName, projectDesc])

  const selectedModel = useMemo(
    () => models.find((m) => m.id === draft?.modelId) ?? null,
    [models, draft?.modelId]
  )

  // ── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-bg-primary">
        <div className="container-limit py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6">
            <Skeleton className="col-span-3 h-96 rounded-radius-lg" />
            <Skeleton className="col-span-9 h-96 rounded-radius-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-bg-primary">
        <div className="container-limit py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-white/5">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="font-display text-3xl font-bold text-text-primary">分镜工作台</h1>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">出错了</h3>
            <p className="text-text-secondary text-sm mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              返回仪表盘
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <div className="container-limit py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1 min-w-0">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-display text-2xl font-bold text-text-primary bg-transparent border-none outline-none w-full placeholder:text-text-muted"
              placeholder="项目名称"
            />
            <input
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="text-text-secondary text-xs bg-transparent border-none outline-none w-full placeholder:text-text-muted"
              placeholder="项目描述（可选）"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {scenes.length} 个分镜 · 总 {scenes.reduce((s, sc) => s + (sc.duration || 0), 0)}s
            </span>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-radius-sm bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中…' : '保存项目'}
            </button>
          </div>
        </div>

        {/* Two-pane layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: scene list */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3">
            <div className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-default">
                <span className="text-xs uppercase tracking-wider text-text-muted">分镜</span>
                <button
                  onClick={handleAddScene}
                  className="flex items-center gap-1 text-xs text-accent-cyan hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  新建
                </button>
              </div>
              {scenes.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <Film className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-xs mb-3">还没有分镜</p>
                  <button
                    onClick={handleAddScene}
                    className="px-3 py-1.5 rounded-md bg-gradient-accent text-bg-primary text-xs font-medium"
                  >
                    创建第一个分镜
                  </button>
                </div>
              ) : (
                <Reorder.Group axis="y" values={scenes} onReorder={handleReorder} className="py-1">
                  <AnimatePresence>
                    {scenes.map((scene, index) => (
                      <Reorder.Item key={scene.id} value={scene}>
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => selectScene(scene)}
                          className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                            selectedSceneId === scene.id
                              ? 'bg-accent-cyan/5 border-l-2 border-l-accent-cyan'
                              : 'border-l-2 border-l-transparent hover:bg-white/[0.02]'
                          }`}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-text-muted shrink-0 cursor-grab active:cursor-grabbing" />
                          <span className="font-mono text-[10px] text-accent-cyan w-5 shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary text-xs truncate">{scene.title}</p>
                            <p className="text-text-muted text-[10px] truncate">
                              {scene.duration}s · {scene.shotType ?? '中景'}
                              {scene.latestResultUrl ? ' · ✓ 已生成' : ''}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicateScene(scene.id)
                              }}
                              className="p-1 rounded hover:bg-white/5 text-text-muted"
                              title="复制"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteScene(scene.id)
                              }}
                              className="p-1 rounded hover:bg-error/10 text-text-muted hover:text-error"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </div>
          </aside>

          {/* Right: workbench */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9 xl:col-span-9">
            {selectedScene && draft ? (
              <SceneWorkbench
                key={selectedScene.id}
                scene={selectedScene}
                draft={draft}
                dirty={dirty}
                onChange={updateDraft}
                onSave={() => persistDraft(true)}
                selectedModel={selectedModel}
                onRefreshScenes={refreshScenes}
              />
            ) : (
              <div className="bg-bg-secondary border border-border-default rounded-radius-lg p-12 text-center">
                <Film className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary text-sm">从左侧选择一个分镜开始编辑</p>
              </div>
            )}
          </main>
        </div>
      </div>
      <WorkflowHint />
    </div>
  )
}

/** 在项目工作台中显示轻量流程提示，用户关闭后本次页面会话内不再展示。 */
function WorkflowHint() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const steps = [
    { label: '项目', desc: '已打开项目', done: true },
    { label: '分镜', desc: '编辑内容 / 挂载素材', active: true },
    { label: '资产库', desc: '选择角色 / 背景 / 道具' },
    { label: '成片', desc: '生成并导出视频' },
  ]

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-[360px]">
      <div className="bg-bg-secondary/95 border border-border-active rounded-radius-lg shadow-glow backdrop-blur p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-display text-sm font-semibold text-text-primary">创作流程</p>
            <p className="text-text-muted text-[11px] mt-0.5">当前项目内的下一步提醒</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="关闭创作流程提示"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                  step.active
                    ? 'bg-accent-cyan text-bg-primary'
                    : step.done
                      ? 'bg-accent-cyan/15 text-accent-cyan'
                      : 'bg-bg-tertiary text-text-muted border border-border-default'
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium ${step.active ? 'text-accent-cyan' : 'text-text-primary'}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-text-muted truncate">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ── Right-pane workbench ─────────────────────────────────── */

function SceneWorkbench({
  scene,
  draft,
  dirty,
  onChange,
  onSave,
  selectedModel,
  onRefreshScenes,
}: {
  scene: Scene
  draft: SceneDraft
  dirty: boolean
  onChange: (partial: Partial<SceneDraft>) => void
  onSave: () => void | Promise<void>
  selectedModel: AIModel | null
  onRefreshScenes: () => void
}) {
  const [activeTab, setActiveTab] = useState<'basics' | 'assets' | 'prompt' | 'model' | 'preview'>(
    'basics'
  )

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'basics', label: '基础信息' },
    { id: 'assets', label: '资产挂载' },
    { id: 'prompt', label: '故事/提示词' },
    { id: 'model', label: '模型与参数' },
    { id: 'preview', label: '生成与预览' },
  ]

  return (
    <div className="bg-bg-secondary border border-border-default rounded-radius-lg overflow-hidden">
      {/* Workbench header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-xs text-accent-cyan">
            #{String(scene.number).padStart(2, '0')}
          </span>
          <input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="font-display font-semibold text-text-primary bg-transparent border-none outline-none flex-1 min-w-0"
            placeholder="分镜标题"
          />
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              未保存
            </span>
          ) : (
            <span className="text-[11px] text-text-muted">已同步</span>
          )}
          <button
            onClick={onSave}
            disabled={!dirty}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-bg-tertiary text-text-secondary text-xs hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <Save className="w-3 h-3" />
            保存
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-border-default overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-bg-tertiary text-accent-cyan border-b-2 border-accent-cyan'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'basics' && (
          <BasicsTab draft={draft} onChange={onChange} />
        )}
        {activeTab === 'assets' && (
          <SceneAssetPicker
            referenceImage={draft.referenceImage}
            characterIds={draft.characterIds}
            backgroundId={draft.backgroundId}
            propIds={draft.propIds}
            audioId={draft.audioId}
            onReferenceImageChange={(referenceImage) => onChange({ referenceImage })}
            onChange={(next) =>
              onChange({
                characterIds: next.characterIds,
                backgroundId: next.backgroundId,
                propIds: next.propIds,
                audioId: next.audioId,
              })
            }
          />
        )}
        {activeTab === 'prompt' && <PromptTab draft={draft} onChange={onChange} />}
        {activeTab === 'model' && (
          <div className="space-y-5">
            <GenerationModeControl
              value={draft.generationMode}
              onChange={(generationMode) => onChange({ generationMode })}
            />
            <div>
              <label className="text-xs text-text-secondary mb-2 block">选择模型</label>
              <SceneModelPicker
                modelId={draft.modelId}
                onChange={(modelId) => onChange({ modelId })}
              />
            </div>
            {selectedModel ? (
              <div>
                <label className="text-xs text-text-secondary mb-2 block">模型参数</label>
                <SceneModelParams
                  value={draft.modelParams}
                  onChange={(modelParams) => onChange({ modelParams, duration: modelParams.duration ?? draft.duration })}
                  model={selectedModel}
                />
              </div>
            ) : (
              <p className="text-text-muted text-xs italic">请先选择一个模型以编辑参数</p>
            )}
          </div>
        )}
        {activeTab === 'preview' && (
          <SceneGenerationPanel
            scene={draftToScene(scene, draft)}
            onBeforeGenerate={onSave}
            onCompleted={onRefreshScenes}
          />
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border-default flex items-center justify-between text-[11px] text-text-muted bg-bg-tertiary/30">
        <span>编辑会自动保存（间隔 1.2 秒），也可手动「保存」</span>
        <span className="flex items-center gap-1">
          下一步 <ChevronRight className="w-3 h-3" /> 切到「生成与预览」
        </span>
      </div>
    </div>
  )
}

/** 渲染单个分镜的生成方式选择，并把选择结果写回草稿的 modelParams。 */
function GenerationModeControl({
  value,
  onChange,
}: {
  value: GenerationMode
  onChange: (value: GenerationMode) => void
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary mb-2 block">生成方式</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {generationModes.map((mode) => {
          const Icon = mode.icon
          const selected = value === mode.value
          return (
            <button
              key={mode.value}
              onClick={() => onChange(mode.value)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
                selected
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border-default bg-bg-tertiary text-text-secondary hover:border-border-active'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Basics tab ──────────────────────────────────────────── */

function BasicsTab({
  draft,
  onChange,
}: {
  draft: SceneDraft
  onChange: (partial: Partial<SceneDraft>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Select
          label="景别"
          value={draft.shotType}
          options={shotTypes}
          onChange={(v) => onChange({ shotType: v })}
        />
        <Select
          label="机位角度"
          value={draft.cameraAngle}
          options={cameraAngles}
          onChange={(v) => onChange({ cameraAngle: v })}
        />
        <Select
          label="运镜"
          value={draft.cameraMove}
          options={cameraMoves}
          onChange={(v) => onChange({ cameraMove: v })}
        />
        <Select
          label="转场"
          value={draft.transition}
          options={transitions}
          onChange={(v) => onChange({ transition: v })}
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">风格预设</label>
        <div className="flex flex-wrap gap-2">
          {stylePresets.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ stylePreset: s })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                draft.stylePreset === s
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                  : 'bg-bg-tertiary text-text-secondary border border-transparent hover:border-border-default'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">
          时长 <span className="text-accent-cyan font-mono">{draft.duration}s</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={draft.duration}
          onChange={(e) => onChange({ duration: Number(e.target.value) })}
          className="w-full accent-accent-cyan"
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">场景描述</label>
        <textarea
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="描述这一镜里发生了什么、人物在做什么、镜头怎么走…"
          className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan resize-none"
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">镜头脚本（可选）</label>
        <textarea
          value={draft.script}
          onChange={(e) => onChange({ script: e.target.value })}
          rows={2}
          placeholder="导演备注、台词、节奏说明等"
          className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan resize-none"
        />
      </div>
    </div>
  )
}

function PromptTab({
  draft,
  onChange,
}: {
  draft: SceneDraft
  onChange: (partial: Partial<SceneDraft>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-text-secondary mb-1 block">
          正向提示词
          <span className="text-text-muted ml-2">
            未填写时会回退到「场景描述」
          </span>
        </label>
        <textarea
          value={draft.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={4}
          placeholder="例如：A cinematic medium shot of a girl in a red kimono walking through cherry blossoms, soft natural light, anime style…"
          className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan resize-none"
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">反向提示词</label>
        <textarea
          value={draft.negativePrompt}
          onChange={(e) => onChange({ negativePrompt: e.target.value })}
          rows={2}
          placeholder="例如：blurry, low quality, extra fingers, watermark…"
          className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan resize-none"
        />
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-sm outline-none focus:border-accent-cyan transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
