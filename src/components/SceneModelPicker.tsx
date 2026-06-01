import { useEffect, useMemo, useState } from 'react'
import { Cpu, Sparkles, Loader2 } from 'lucide-react'
import { modelApi } from '@/api'
import type { AIModel } from '@/api'

interface SceneModelPickerProps {
  modelId?: string | null
  onChange: (modelId: string | null) => void
}

export function SceneModelPicker({ modelId, onChange }: SceneModelPickerProps) {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    modelApi
      .list()
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res) ? res : (res as any)?.data ?? []
        setModels(list.filter((m: AIModel) => m.isActive))
      })
      .catch(() => alive && setModels([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        加载模型...
      </div>
    )
  }

  if (models.length === 0) {
    return <p className="text-text-muted text-xs italic">暂无可用模型</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {models.map((m) => {
        const selected = modelId === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(selected ? null : m.id)}
            className={`group flex items-start gap-2 p-3 rounded-md border text-left transition-colors ${
              selected
                ? 'border-accent-cyan bg-accent-cyan/5'
                : 'border-border-default bg-bg-tertiary hover:border-border-active'
            }`}
            style={selected ? { boxShadow: `0 0 0 1px ${m.brandColor}33` } : undefined}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ background: `${m.brandColor}22`, color: m.brandColor }}
            >
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-semibold text-text-primary text-sm truncate">
                  {m.name}
                </span>
                {m.isBeta && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-magenta/10 text-accent-magenta">
                    BETA
                  </span>
                )}
              </div>
              <p className="text-text-muted text-[11px] mt-0.5 line-clamp-1">
                {m.category} · ×{m.costFactor} 积分系数 · 最长 {m.maxDuration}s
              </p>
              {m.description && (
                <p className="text-text-secondary text-[11px] mt-1 line-clamp-2">{m.description}</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Params editor ─────────────────────────────────────────

export interface SceneParamsValue {
  resolution?: '720p' | '1080p' | '2K' | '4K'
  duration?: number
  fps?: number
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  seed?: number | null
  faceEnhance?: boolean
  superResolution?: boolean
  cfgScale?: number
  steps?: number
}

interface SceneModelParamsProps {
  value: SceneParamsValue
  onChange: (next: SceneParamsValue) => void
  /** Optional model to surface supported params and limits */
  model?: AIModel | null
}

const RESOLUTIONS: Array<SceneParamsValue['resolution']> = ['720p', '1080p', '2K', '4K']
const ASPECT_RATIOS: Array<SceneParamsValue['aspectRatio']> = ['16:9', '9:16', '1:1', '4:3', '3:4']
const FPS_PRESETS = [24, 30, 60]

export function SceneModelParams({ value, onChange, model }: SceneModelParamsProps) {
  const maxDuration = model?.maxDuration ?? 10
  const supported = (model?.supportedParams ?? {}) as Record<string, unknown>
  const supportsCfg = supported.cfgScale !== false
  const supportsSteps = supported.steps !== false

  const update = (partial: Partial<SceneParamsValue>) => onChange({ ...value, ...partial })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {RESOLUTIONS.map((r) => (
          <button
            key={r}
            onClick={() => update({ resolution: r })}
            className={`px-2 py-1.5 rounded-md text-xs transition-colors ${
              value.resolution === r
                ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                : 'bg-bg-tertiary text-text-secondary border border-transparent hover:border-border-default'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-text-secondary mb-1 block">
          时长：<span className="text-accent-cyan font-mono">{value.duration ?? 5}s</span>
          {model && (
            <span className="text-text-muted ml-1">/ 最长 {maxDuration}s</span>
          )}
        </label>
        <input
          type="range"
          min={1}
          max={maxDuration}
          value={value.duration ?? 5}
          onChange={(e) => update({ duration: Number(e.target.value) })}
          className="w-full accent-accent-cyan"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary mb-1 block">画面比例</label>
          <select
            value={value.aspectRatio ?? '16:9'}
            onChange={(e) => update({ aspectRatio: e.target.value as SceneParamsValue['aspectRatio'] })}
            className="w-full px-2 py-1.5 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
          >
            {ASPECT_RATIOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-secondary mb-1 block">帧率</label>
          <select
            value={value.fps ?? 24}
            onChange={(e) => update({ fps: Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
          >
            {FPS_PRESETS.map((f) => (
              <option key={f} value={f}>
                {f} fps
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {supportsCfg && (
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              提示词强度 <span className="text-accent-cyan font-mono">{value.cfgScale ?? 7}</span>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={value.cfgScale ?? 7}
              onChange={(e) => update({ cfgScale: Number(e.target.value) })}
              className="w-full accent-accent-cyan"
            />
          </div>
        )}
        {supportsSteps && (
          <div>
            <label className="text-xs text-text-secondary mb-1 block">
              采样步数 <span className="text-accent-cyan font-mono">{value.steps ?? 30}</span>
            </label>
            <input
              type="range"
              min={10}
              max={80}
              value={value.steps ?? 30}
              onChange={(e) => update({ steps: Number(e.target.value) })}
              className="w-full accent-accent-cyan"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-text-secondary mb-1 block">随机种子</label>
        <input
          type="number"
          value={value.seed ?? ''}
          onChange={(e) =>
            update({ seed: e.target.value === '' ? null : Number(e.target.value) })
          }
          placeholder="留空 = 随机"
          className="w-full px-2 py-1.5 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={!!value.faceEnhance}
            onChange={(e) => update({ faceEnhance: e.target.checked })}
            className="w-3.5 h-3.5 accent-accent-cyan"
          />
          <Sparkles className="w-3 h-3 text-accent-cyan" />
          人脸增强
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={!!value.superResolution}
            onChange={(e) => update({ superResolution: e.target.checked })}
            className="w-3.5 h-3.5 accent-accent-cyan"
          />
          <Sparkles className="w-3 h-3 text-accent-magenta" />
          超分辨率
        </label>
      </div>
    </div>
  )
}

/**
 * Resolve the chosen model from a list. Convenience helper so callers don't
 * have to do their own lookup.
 */
export function useResolvedModel(modelId: string | null | undefined, models: AIModel[]) {
  return useMemo(() => models.find((m) => m.id === modelId) ?? null, [modelId, models])
}
