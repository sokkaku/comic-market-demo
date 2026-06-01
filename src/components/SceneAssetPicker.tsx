import { useEffect, useMemo, useState } from 'react'
import { Plus, X, Search, ImageOff } from 'lucide-react'
import { assetApi } from '@/api'
import type { Asset } from '@/api'

type AssetKind = 'REFERENCE' | 'CHARACTER' | 'BACKGROUND' | 'PROP' | 'AUDIO'

interface SceneAssetPickerProps {
  referenceImage?: string | null
  /** Currently selected character IDs */
  characterIds: string[]
  /** Currently selected background ID (single) */
  backgroundId?: string | null
  /** Currently selected prop IDs */
  propIds: string[]
  /** Currently selected audio ID (single) */
  audioId?: string | null
  onChange: (next: {
    characterIds: string[]
    backgroundId: string | null
    propIds: string[]
    audioId: string | null
  }) => void
  onReferenceImageChange?: (referenceImage: string | null) => void
}

const KIND_LABELS: Record<AssetKind, string> = {
  REFERENCE: '参考图',
  CHARACTER: '人物',
  BACKGROUND: '背景',
  PROP: '道具',
  AUDIO: '音频',
}

type AssetsState = {
  assets: Asset[]
  loading: boolean
}

export default function SceneAssetPicker({
  referenceImage,
  characterIds,
  backgroundId,
  propIds,
  audioId,
  onChange,
  onReferenceImageChange,
}: SceneAssetPickerProps) {
  const [{ assets, loading }, setAssetsState] = useState<AssetsState>({ assets: [], loading: true })
  const [activeKind, setActiveKind] = useState<AssetKind>('CHARACTER')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    assetApi
      .list()
      .then((res) => {
        if (!alive) return
        setAssetsState({ assets: res.assets ?? [], loading: false })
      })
      .catch(() => {
        if (alive) setAssetsState({ assets: [], loading: false })
      })
    return () => {
      alive = false
    }
  }, [])

  const assetByMountKey = useMemo(() => {
    const entries = assets.flatMap((a): Array<[string, Asset]> => [[a.id, a], [a.url, a]])
    return new Map(entries)
  }, [assets])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((a) => {
      if (activeKind === 'REFERENCE') {
        if (!a.mimeType.startsWith('image/')) return false
      } else if (a.type !== activeKind) return false
      if (!q) return true
      return (
        a.name.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [assets, activeKind, query])

  const isMulti = activeKind === 'CHARACTER' || activeKind === 'PROP'

  const currentIdsForKind = (kind: AssetKind): string[] => {
    switch (kind) {
      case 'REFERENCE':
        return referenceImage ? [referenceImage] : []
      case 'CHARACTER':
        return characterIds
      case 'PROP':
        return propIds
      case 'BACKGROUND':
        return backgroundId ? [backgroundId] : []
      case 'AUDIO':
        return audioId ? [audioId] : []
    }
  }

  const toggleAsset = (asset: Asset) => {
    if (activeKind === 'REFERENCE') {
      onReferenceImageChange?.(referenceImage === asset.url ? null : asset.url)
      return
    }
    const kind = asset.type as AssetKind
    if (kind === 'CHARACTER') {
      const next = characterIds.includes(asset.id)
        ? characterIds.filter((id) => id !== asset.id)
        : [...characterIds, asset.id]
      onChange({ characterIds: next, backgroundId: backgroundId ?? null, propIds, audioId: audioId ?? null })
    } else if (kind === 'PROP') {
      const next = propIds.includes(asset.id)
        ? propIds.filter((id) => id !== asset.id)
        : [...propIds, asset.id]
      onChange({ characterIds, backgroundId: backgroundId ?? null, propIds: next, audioId: audioId ?? null })
    } else if (kind === 'BACKGROUND') {
      const next = backgroundId === asset.id ? null : asset.id
      onChange({ characterIds, backgroundId: next, propIds, audioId: audioId ?? null })
    } else if (kind === 'AUDIO') {
      const next = audioId === asset.id ? null : asset.id
      onChange({ characterIds, backgroundId: backgroundId ?? null, propIds, audioId: next })
    }
  }

  const removeMounted = (kind: AssetKind, id: string) => {
    if (kind === 'REFERENCE') {
      onReferenceImageChange?.(null)
    } else if (kind === 'CHARACTER') {
      onChange({
        characterIds: characterIds.filter((x) => x !== id),
        backgroundId: backgroundId ?? null,
        propIds,
        audioId: audioId ?? null,
      })
    } else if (kind === 'PROP') {
      onChange({
        characterIds,
        backgroundId: backgroundId ?? null,
        propIds: propIds.filter((x) => x !== id),
        audioId: audioId ?? null,
      })
    } else if (kind === 'BACKGROUND') {
      onChange({ characterIds, backgroundId: null, propIds, audioId: audioId ?? null })
    } else {
      onChange({ characterIds, backgroundId: backgroundId ?? null, propIds, audioId: null })
    }
  }

  return (
    <div className="space-y-4">
      {/* Mounted assets — grouped per kind */}
      {(['REFERENCE', 'CHARACTER', 'BACKGROUND', 'PROP', 'AUDIO'] as AssetKind[]).map((kind) => {
        const ids = currentIdsForKind(kind)
        return (
          <div key={kind}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">{KIND_LABELS[kind]}</span>
              <button
                onClick={() => {
                  setActiveKind(kind)
                  setPickerOpen(true)
                }}
                className="text-xs text-accent-cyan hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                添加
              </button>
            </div>
            {ids.length === 0 ? (
              <p className="text-text-muted text-xs italic">未挂载</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ids.map((id) => {
                  const a = assetByMountKey.get(id)
                  const previewUrl = a?.thumbnail || a?.url || (kind === 'REFERENCE' ? id : null)
                  return (
                    <div
                      key={id}
                      className="group relative w-16 h-16 rounded-md overflow-hidden border border-border-default bg-bg-tertiary"
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={a?.name || KIND_LABELS[kind]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      )}
                      <button
                        onClick={() => removeMounted(kind, id)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-bg-primary/80 text-text-muted opacity-0 group-hover:opacity-100 hover:text-error transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {a?.name && (
                        <span className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[10px] text-text-primary bg-bg-primary/70 truncate">
                          {a.name}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Picker drawer */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-bg-primary/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-bg-secondary border border-border-default rounded-radius-lg w-full max-w-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h3 className="font-display font-semibold text-text-primary">挂载{KIND_LABELS[activeKind]}</h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-border-default flex items-center gap-2">
              <div className="flex items-center gap-1">
                {(['CHARACTER', 'BACKGROUND', 'PROP', 'AUDIO'] as AssetKind[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveKind(k)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      activeKind === k
                        ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                        : 'bg-bg-tertiary text-text-secondary border border-transparent hover:border-border-default'
                    }`}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索素材名或标签"
                  className="w-full pl-7 pr-3 py-1.5 rounded-md bg-bg-tertiary border border-border-default text-text-primary text-xs outline-none focus:border-accent-cyan"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center text-text-muted text-sm py-8">加载素材...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">
                  暂无{KIND_LABELS[activeKind]}素材，请先到「素材库」上传
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((a) => {
                    const selected = currentIdsForKind(activeKind).includes(activeKind === 'REFERENCE' ? a.url : a.id)
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          toggleAsset(a)
                          if (!isMulti) setPickerOpen(false)
                        }}
                        className={`group relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                          selected
                            ? 'border-accent-cyan'
                            : 'border-border-default hover:border-border-active'
                        }`}
                      >
                        {a.thumbnail || a.url ? (
                          <img
                            src={a.thumbnail || a.url}
                            alt={a.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-bg-tertiary text-text-muted">
                            <ImageOff className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[11px] text-text-primary bg-bg-primary/70 truncate text-left">
                          {a.name}
                        </span>
                        {selected && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent-cyan text-bg-primary text-[10px] flex items-center justify-center font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border-default flex justify-end">
              <button
                onClick={() => setPickerOpen(false)}
                className="px-4 py-2 rounded-md bg-gradient-accent text-bg-primary text-sm font-medium hover:shadow-glow transition-shadow"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
