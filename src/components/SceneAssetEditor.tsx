import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import {
  Camera,
  Clapperboard,
  Grid3X3,
  Image,
  MousePointer2,
  Move,
  Move3D,
  Orbit,
  Rotate3D,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Asset } from '@/api/types'
import './SceneAssetEditor.css'

type ActorId = 'swordsman' | 'girl' | 'assassin'
type PoseName = 'neutral' | 'guard' | 'protect' | 'kneel' | 'attack'
type TransformMode = 'translate' | 'rotate'
type BoneName =
  | 'chest'
  | 'head'
  | 'leftUpperArm'
  | 'rightUpperArm'
  | 'leftUpperLeg'
  | 'rightUpperLeg'

type InternalBoneName =
  | BoneName
  | 'leftForeArm'
  | 'rightForeArm'
  | 'leftLowerLeg'
  | 'rightLowerLeg'

interface ActorConfig {
  id: ActorId
  name: string
  role: string
  color: number
  accent: string
  position: [number, number, number]
  rotationY: number
  scale?: number
}

interface CameraPreset {
  label: string
  description: string
  position: [number, number, number]
  target: [number, number, number]
}

type PoseDefinition = Partial<Record<InternalBoneName, [number, number, number]>>

interface StageSnapshot {
  selectedActorId: ActorId
  selectedActorName: string
  selectedPose: PoseName
  selectedCameraIndex: number
  cameraLabel: string
  actorPosition: [number, number, number]
  boneAngle: number
  agentLog: string
  agentWorking: boolean
  transformMode: TransformMode
  gridVisible: boolean
}

interface SceneAssetEditorProps {
  asset: Asset
  mode: SceneEditorMode
  onClose: () => void
  onSaved?: () => void
}

export type SceneEditorMode = 'edit3d' | 'storyboardPreview'

const ACTOR_CONFIGS: ActorConfig[] = [
  {
    id: 'swordsman',
    name: '剑客',
    role: 'HERO / A',
    color: 0xb9d5d0,
    accent: '#9bc8bf',
    position: [-0.75, 0, 0.45],
    rotationY: 0.18,
  },
  {
    id: 'girl',
    name: '少女',
    role: 'SUPPORT / B',
    color: 0xdb9a92,
    accent: '#db9a92',
    position: [-0.1, 0, 1.15],
    rotationY: 0.05,
    scale: 0.9,
  },
  {
    id: 'assassin',
    name: '杀手',
    role: 'ENEMY / C',
    color: 0x899a9b,
    accent: '#899a9b',
    position: [2.2, 0, -1.15],
    rotationY: -1.35,
    scale: 1.05,
  },
]

const CAMERA_PRESETS: CameraPreset[] = [
  { label: '中景', description: '平视', position: [5.9, 3.1, 7.2], target: [0.1, 1.15, 0.1] },
  { label: '仰拍', description: '压迫感', position: [5.2, 1.45, 5.5], target: [0.35, 1.45, -0.2] },
  { label: '俯拍', description: '空间关系', position: [5.8, 6.8, 5.9], target: [0.2, 0.85, 0.1] },
  { label: '过肩', description: '杀手视角', position: [2.65, 2.1, -0.35], target: [-0.35, 1.2, 0.55] },
]

const POSES: Record<PoseName, PoseDefinition> = {
  neutral: {
    leftUpperArm: [0, 0, -6],
    rightUpperArm: [0, 0, 6],
  },
  guard: {
    chest: [0, -8, 0],
    leftUpperArm: [-26, 2, -45],
    leftForeArm: [-42, 0, -12],
    rightUpperArm: [-58, 6, 38],
    rightForeArm: [-62, 0, 10],
    leftUpperLeg: [-4, 0, 0],
    rightUpperLeg: [8, 0, 0],
  },
  protect: {
    chest: [8, -18, -5],
    head: [-6, 12, 0],
    leftUpperArm: [-62, -5, -48],
    leftForeArm: [-25, 0, -18],
    rightUpperArm: [20, -15, 42],
    rightForeArm: [-54, 0, 0],
    leftUpperLeg: [-12, 0, 0],
    rightUpperLeg: [20, 0, 0],
  },
  kneel: {
    chest: [18, -4, 4],
    head: [-18, 0, 0],
    leftUpperArm: [-48, 0, -52],
    leftForeArm: [-48, 0, -10],
    rightUpperArm: [18, 0, 36],
    rightForeArm: [-74, 0, 0],
    leftUpperLeg: [-68, 0, -4],
    leftLowerLeg: [96, 0, 0],
    rightUpperLeg: [24, 0, 0],
    rightLowerLeg: [-34, 0, 0],
  },
  attack: {
    chest: [8, -18, 0],
    head: [-4, 14, 0],
    leftUpperArm: [-30, 0, -58],
    leftForeArm: [-45, 0, -10],
    rightUpperArm: [-126, 8, 42],
    rightForeArm: [-30, 0, 4],
    leftUpperLeg: [22, 0, 0],
    rightUpperLeg: [-30, 0, 0],
    rightLowerLeg: [36, 0, 0],
  },
}

const POSE_LABELS: Array<{ id: PoseName; label: string; hint: string }> = [
  { id: 'neutral', label: '站立', hint: 'NEUTRAL' },
  { id: 'guard', label: '戒备', hint: 'GUARD' },
  { id: 'protect', label: '护住', hint: 'PROTECT' },
  { id: 'kneel', label: '跪地', hint: 'KNEEL' },
  { id: 'attack', label: '进攻', hint: 'ATTACK' },
]

const BONE_LABELS: Array<{ id: BoneName; label: string }> = [
  { id: 'chest', label: '胸腔' },
  { id: 'head', label: '头部' },
  { id: 'leftUpperArm', label: '左臂' },
  { id: 'rightUpperArm', label: '右臂' },
  { id: 'leftUpperLeg', label: '左腿' },
  { id: 'rightUpperLeg', label: '右腿' },
]

const INITIAL_SNAPSHOT: StageSnapshot = {
  selectedActorId: 'swordsman',
  selectedActorName: '剑客',
  selectedPose: 'protect',
  selectedCameraIndex: 0,
  cameraLabel: '中景 / 平视',
  actorPosition: [-0.75, 0, 0.45],
  boneAngle: 18,
  agentLog: '等待导演指令',
  agentWorking: false,
  transformMode: 'translate',
  gridVisible: true,
}

/** 场景资产编辑器在资产页弹层内托管 Three.js 舞台，让用户直接调整角色、骨骼、机位和 AI 指令结果。 */
export default function SceneAssetEditor({ asset, mode, onClose, onSaved }: SceneAssetEditorProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<DirectorStageEngine | null>(null)
  const [snapshot, setSnapshot] = useState<StageSnapshot>(INITIAL_SNAPSHOT)
  const [selectedBone, setSelectedBone] = useState<BoneName>('chest')
  const isPreviewMode = mode === 'storyboardPreview'
  const [command, setCommand] = useState(
    isPreviewMode
      ? '根据图片建立三段分镜：远景交代环境，中景角色对峙，仰拍突出压迫感'
      : '剑客单膝跪地，用剑支撑身体；杀手站在远处俯视他，镜头切到轻微仰拍'
  )

  useEffect(() => {
    if (!mountRef.current) return undefined
    const engine = new DirectorStageEngine(mountRef.current, setSnapshot)
    stageRef.current = engine
    engine.initialize()
    engine.setSelectedBone('chest')
    return () => {
      engine.dispose()
      stageRef.current = null
    }
  }, [])

  useEffect(() => {
    stageRef.current?.setSelectedBone(selectedBone)
  }, [selectedBone])

  useEffect(() => {
    if (!isPreviewMode) return
    stageRef.current?.prepareStoryboardPreview(asset.name)
  }, [asset.name, isPreviewMode])

  /** 保存动作先把当前舞台快照同步到状态提示，演示环境用回调通知资产页完成一次编辑。 */
  const handleSaveScene = () => {
    stageRef.current?.confirmSaved(asset.name, isPreviewMode)
    toast.success(isPreviewMode ? '3D 预览已保存' : '场景资产已保存', {
      description: isPreviewMode
        ? `${asset.name} 的分镜 3D 预览已更新`
        : `${asset.name} 的角色站位、姿势和机位已更新`,
    })
    onSaved?.()
  }

  const handleGeneratePreview = () => {
    stageRef.current?.runAiCommand(command)
    toast.success('开始生成分镜 3D 预览', {
      description: '已把图片场景拆成机位、角色站位和姿势工具调用',
    })
  }

  return (
    <div className="director-editor-overlay" role="dialog" aria-modal="true" aria-label={`${asset.name} 场景编辑器`}>
      <div className="director-stage-page director-stage-modal">
        <header className="director-topbar">
          <div className="director-brand">
            <div className="director-brand-mark">
              <Clapperboard />
            </div>
            <div>
              <p>{isPreviewMode ? '资产 / 图片生成分镜 3D 预览' : '资产 / 3D 场景编辑器'}</p>
              <h1>
                {asset.name} <span>{isPreviewMode ? 'IMAGE TO 3D PREVIS' : 'SCENE ASSET'}</span>
              </h1>
            </div>
          </div>
          <div className="director-shot-meta">
            <span className="director-live-dot" />
            <strong>{asset.id.replace(/^asset-/, '').toUpperCase()}</strong>
            <span>{asset.tags[0] ?? '场景资产'}</span>
            <span className="director-divider" />
            <span>{isPreviewMode ? '3 SHOTS' : '16:9'}</span>
            <span>{isPreviewMode ? 'AUTO PREVIS' : '35 MM'}</span>
          </div>
          <div className="director-top-actions">
            <button
              className="director-icon-button"
              onClick={() => stageRef.current?.reset()}
              title="重置舞台"
              aria-label="重置舞台"
            >
              <RotateCcw />
            </button>
            <button className="director-secondary-button" onClick={() => stageRef.current?.captureFrame(asset.name)}>
              <Camera />
              导出参考帧
            </button>
            <button className="director-primary-button" onClick={handleSaveScene}>
              <Save />
              {isPreviewMode ? '保存预览' : '保存场景'}
            </button>
            <button className="director-close-button" onClick={onClose} title="关闭编辑器" aria-label="关闭编辑器">
              <X />
            </button>
          </div>
        </header>

        <main className="director-workspace">
          <section className="director-stage-shell">
            <div ref={mountRef} className="director-stage-mount" />
            <div className="director-frame-guide">
              <span className="director-corner director-top-left" />
              <span className="director-corner director-top-right" />
              <span className="director-corner director-bottom-left" />
              <span className="director-corner director-bottom-right" />
              <div className="director-center-cross" />
            </div>

            <aside className="director-scene-strip">
              <div className="director-strip-title">
                <span>角色</span>
                <small>03</small>
              </div>
              <div className="director-actor-list">
                {ACTOR_CONFIGS.map((actor, index) => (
                  <button
                    key={actor.id}
                    className={`director-actor-card ${snapshot.selectedActorId === actor.id ? 'active' : ''}`}
                    style={{ '--actor-accent': actor.accent } as CSSProperties}
                    onClick={() => stageRef.current?.selectActor(actor.id)}
                  >
                    <span className="director-actor-index">0{index + 1}</span>
                    <span className="director-actor-swatch" />
                    <span>
                      <strong>{actor.name}</strong>
                      <small>{actor.role}</small>
                    </span>
                  </button>
                ))}
              </div>
              <button
                className={`director-strip-button ${snapshot.gridVisible ? 'active' : ''}`}
                onClick={() => stageRef.current?.toggleGrid()}
                title="显示或隐藏网格"
              >
                <Grid3X3 />
              </button>
            </aside>

            {isPreviewMode && (
              <aside className="director-source-panel">
                <div className="director-source-thumb">
                  <img src={asset.thumbnail || asset.url} alt={asset.name} />
                </div>
                <div>
                  <p>IMAGE SOURCE</p>
                  <strong>{asset.name}</strong>
                  <span>自动拆解为远景 / 中景 / 仰拍三段预览</span>
                </div>
              </aside>
            )}

          <div className="director-stage-hud director-top-left-hud">
            <p>OUTPUT CAMERA</p>
            <strong>{snapshot.cameraLabel}</strong>
          </div>
          <div className="director-stage-hud director-bottom-left-hud">
            <span>
              <MousePointer2 /> 选择角色
            </span>
            <span>
              <Move3D /> 拖动手柄
            </span>
            <span>
              <Orbit /> 空白处旋转视角
            </span>
          </div>
          <div className="director-timeline">
            <span className="director-timecode">00:00:03:12</span>
            <div className="director-timeline-track">
              <span className="director-timeline-fill" />
              <span className="director-playhead" />
            </div>
            <span className="director-timecode muted">00:00:05:00</span>
          </div>
        </section>

        <aside className="director-inspector">
          <div className="director-inspector-head">
            <div>
              <p>INSPECTOR</p>
              <h2>{snapshot.selectedActorName}</h2>
            </div>
            <div className="director-status-pill">
              <span />
              已选中
            </div>
          </div>

          <section className="director-control-section">
            <div className="director-section-title">
              <span>变换工具</span>
              <small>TRANSFORM</small>
            </div>
            <div className="director-segmented">
              <button
                className={snapshot.transformMode === 'translate' ? 'active' : ''}
                onClick={() => stageRef.current?.setTransformMode('translate')}
              >
                <Move /> 位移
              </button>
              <button
                className={snapshot.transformMode === 'rotate' ? 'active' : ''}
                onClick={() => stageRef.current?.setTransformMode('rotate')}
              >
                <Rotate3D /> 旋转
              </button>
            </div>
            <div className="director-transform-grid">
              {(['x', 'y', 'z'] as const).map((axis, index) => (
                <label key={axis}>
                  <span>{axis.toUpperCase()}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={snapshot.actorPosition[index].toFixed(1)}
                    onChange={(event) => stageRef.current?.setActorPosition(axis, Number(event.target.value))}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="director-control-section">
            <div className="director-section-title">
              <span>姿势预设</span>
              <small>POSE LIBRARY</small>
            </div>
            <div className="director-pose-grid">
              {POSE_LABELS.map((pose) => (
                <button
                  key={pose.id}
                  className={snapshot.selectedPose === pose.id ? 'active' : ''}
                  onClick={() => stageRef.current?.applyPose(pose.id)}
                >
                  <strong>{pose.label}</strong>
                  <small>{pose.hint}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="director-control-section">
            <div className="director-section-title">
              <span>骨骼微调</span>
              <small>{snapshot.boneAngle}°</small>
            </div>
            <div className="director-bone-tabs">
              {BONE_LABELS.map((bone) => (
                <button
                  key={bone.id}
                  className={selectedBone === bone.id ? 'active' : ''}
                  onClick={() => setSelectedBone(bone.id)}
                >
                  {bone.label}
                </button>
              ))}
            </div>
            <label className="director-range-control">
              <span>-90</span>
              <input
                type="range"
                min="-90"
                max="90"
                value={snapshot.boneAngle}
                onChange={(event) => stageRef.current?.setBoneAngle(Number(event.target.value))}
              />
              <span>90</span>
            </label>
          </section>

          <section className="director-control-section">
            <div className="director-section-title">
              <span>输出机位</span>
              <small>CAMERA</small>
            </div>
            <div className="director-camera-grid">
              {CAMERA_PRESETS.map((preset, index) => (
                <button
                  key={preset.label}
                  className={snapshot.selectedCameraIndex === index ? 'active' : ''}
                  onClick={() => stageRef.current?.setCameraPreset(index)}
                >
                  <Camera />
                  <span>
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>
        </main>

        <section className="director-ai-dock">
          <div className="director-agent-mark">
            {isPreviewMode ? <Image /> : <Sparkles />}
            <div>
              <p>{isPreviewMode ? 'IMAGE TO PREVIS' : 'AI DIRECTOR'}</p>
              <span>{isPreviewMode ? 'STORYBOARD 3D PREVIEW' : 'LOCAL TOOL DEMO'}</span>
            </div>
          </div>
          <div className="director-agent-composer">
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (isPreviewMode) handleGeneratePreview()
                else stageRef.current?.runAiCommand(command)
              }
              }}
              aria-label="输入导演指令"
            />
            <button
              onClick={isPreviewMode ? handleGeneratePreview : () => stageRef.current?.runAiCommand(command)}
              title={isPreviewMode ? '生成分镜 3D 预览' : '执行导演指令'}
              aria-label={isPreviewMode ? '生成分镜 3D 预览' : '执行导演指令'}
            >
              <Send />
            </button>
          </div>
          <div className={`director-agent-log ${snapshot.agentWorking ? 'working' : ''}`}>
            <span />
            <p>{snapshot.agentLog}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

class RiggedActor {
  readonly root = new THREE.Group()
  readonly joints = {} as Record<InternalBoneName, THREE.Group>
  readonly config: ActorConfig
  currentPose: PoseName = 'neutral'
  private readonly material: THREE.MeshStandardMaterial
  private readonly darkMaterial: THREE.MeshStandardMaterial
  private readonly ring: THREE.Mesh

  constructor(config: ActorConfig) {
    this.config = config
    this.root.name = config.id
    this.root.position.set(...config.position)
    this.root.rotation.y = config.rotationY
    this.root.scale.setScalar(config.scale ?? 1)

    this.material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.68,
      metalness: 0.05,
    })
    this.darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x354445,
      roughness: 0.82,
      metalness: 0.05,
    })

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.43, 48),
      new THREE.MeshBasicMaterial({ color: 0xd3b677, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = 0.012
    this.ring.visible = false
    this.root.add(this.ring)

    const hips = this.makeJoint(this.root, 'hips', [0, 1.04, 0])
    this.addBox(hips, [0.48, 0.22, 0.22], [0, 0, 0])
    this.joints.chest = this.makeJoint(hips, 'chest', [0, 0.14, 0])
    this.addBox(this.joints.chest, [0.62, 0.72, 0.28], [0, 0.38, 0])

    this.joints.head = this.makeJoint(this.joints.chest, 'head', [0, 0.86, 0])
    this.addSphere(this.joints.head, 0.2, [0, 0.2, 0], this.material)
    this.addBox(this.joints.head, [0.09, 0.18, 0.1], [0, 0.19, 0.2], this.darkMaterial)

    this.createArm('left', this.joints.chest, -0.39)
    this.createArm('right', this.joints.chest, 0.39)
    this.createLeg('left', hips, -0.17)
    this.createLeg('right', hips, 0.17)

    this.root.traverse((child) => {
      child.userData.actorId = config.id
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  /** 应用姿势时先清空旧旋转，再落入预设关节角，避免多次操作产生不可预测的叠加。 */
  applyPose(pose: PoseName) {
    for (const joint of Object.values(this.joints)) joint.rotation.set(0, 0, 0)
    for (const [bone, rotation] of Object.entries(POSES[pose])) {
      this.setBoneRotation(bone as InternalBoneName, rotation)
    }
    this.currentPose = pose
  }

  /** 单关节覆盖是 AI Tools 的最低层能力，角度统一使用更便于模型表达的度数。 */
  setBoneRotation(bone: InternalBoneName, rotation: [number, number, number]) {
    this.joints[bone].rotation.set(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2])
    )
  }

  /** 剑作为手部子节点挂载，前臂旋转时道具会自然跟随。 */
  attachSword() {
    const sword = new THREE.Group()
    sword.position.set(0, -0.58, 0.03)
    sword.rotation.z = -0.08
    this.addBox(sword, [0.06, 0.92, 0.035], [0, -0.37, 0], this.darkMaterial)
    this.addBox(sword, [0.28, 0.045, 0.065], [0, 0.05, 0], this.material)
    this.joints.rightForeArm.add(sword)
  }

  setSelected(selected: boolean) {
    this.ring.visible = selected
  }

  private createArm(side: 'left' | 'right', chest: THREE.Group, x: number) {
    const multiplier = side === 'left' ? -1 : 1
    const upperName = `${side}UpperArm` as InternalBoneName
    const foreName = `${side}ForeArm` as InternalBoneName
    this.joints[upperName] = this.makeJoint(chest, upperName, [x, 0.69, 0])
    this.joints[upperName].rotation.z = THREE.MathUtils.degToRad(multiplier * 7)
    this.addLimb(this.joints[upperName], 0.5, 0.085)
    this.joints[foreName] = this.makeJoint(this.joints[upperName], foreName, [0, -0.5, 0])
    this.addLimb(this.joints[foreName], 0.46, 0.07)
    this.addSphere(this.joints[foreName], 0.09, [0, -0.49, 0], this.material)
  }

  private createLeg(side: 'left' | 'right', hips: THREE.Group, x: number) {
    const upperName = `${side}UpperLeg` as InternalBoneName
    const lowerName = `${side}LowerLeg` as InternalBoneName
    this.joints[upperName] = this.makeJoint(hips, upperName, [x, -0.05, 0])
    this.addLimb(this.joints[upperName], 0.58, 0.11)
    this.joints[lowerName] = this.makeJoint(this.joints[upperName], lowerName, [0, -0.58, 0])
    this.addLimb(this.joints[lowerName], 0.54, 0.095)
    this.addBox(this.joints[lowerName], [0.2, 0.12, 0.39], [0, -0.57, 0.1], this.darkMaterial)
  }

  private makeJoint(parent: THREE.Object3D, name: string, position: [number, number, number]) {
    const group = new THREE.Group()
    group.name = name
    group.position.set(...position)
    parent.add(group)
    this.addSphere(group, 0.105, [0, 0, 0], this.darkMaterial)
    return group
  }

  private addLimb(parent: THREE.Object3D, length: number, radius: number) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 6, 10), this.material)
    mesh.position.y = -length / 2
    parent.add(mesh)
  }

  private addBox(
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    material = this.material
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
    mesh.position.set(...position)
    parent.add(mesh)
  }

  private addSphere(
    parent: THREE.Object3D,
    radius: number,
    position: [number, number, number],
    material: THREE.Material
  ) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), material)
    mesh.position.set(...position)
    parent.add(mesh)
  }
}

class DirectorStageEngine {
  private readonly mount: HTMLDivElement
  private readonly setSnapshot: Dispatch<SetStateAction<StageSnapshot>>
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  private readonly orbitControls: OrbitControls
  private readonly transformControls: TransformControls
  private readonly grid = new THREE.GridHelper(20, 40, 0x54706d, 0x253b3a)
  private readonly actorMap = new Map<ActorId, RiggedActor>()
  private readonly resizeObserver: ResizeObserver
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private selectedActor: RiggedActor | null = null
  private selectedBone: BoneName = 'chest'
  private selectedCameraIndex = 0
  private transformMode: TransformMode = 'translate'
  private gridVisible = true
  private animationFrame = 0
  private commandTimer: number | undefined

  constructor(mount: HTMLDivElement, setSnapshot: Dispatch<SetStateAction<StageSnapshot>>) {
    this.mount = mount
    this.setSnapshot = setSnapshot
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement)
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer())
  }

  initialize() {
    this.mount.appendChild(this.renderer.domElement)
    this.scene.background = new THREE.Color(0x11191a)
    this.scene.fog = new THREE.Fog(0x11191a, 9, 24)
    this.camera.position.set(5.9, 3.1, 7.2)

    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.08
    this.orbitControls.target.set(0, 1.1, 0)
    this.orbitControls.maxPolarAngle = Math.PI * 0.48
    this.orbitControls.minDistance = 3
    this.orbitControls.maxDistance = 14

    this.transformControls.setMode('translate')
    this.transformControls.setSpace('world')
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !(event as THREE.Event & { value: boolean }).value
      this.publishSnapshot()
    })
    this.transformControls.addEventListener('change', () => {
      this.publishSnapshot()
      this.requestRender()
    })
    this.scene.add(this.transformControls.getHelper())

    this.grid.position.y = 0.005
    this.scene.add(this.grid)
    this.setupLighting()
    this.setupEnvironment()
    this.createActors()

    this.orbitControls.addEventListener('change', () => this.requestRender())
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown)
    this.resizeObserver.observe(this.mount)
    this.selectActor('swordsman')
    this.setCameraPreset(0)
    this.resizeRenderer()
    this.requestRender()
  }

  dispose() {
    if (this.commandTimer) window.clearInterval(this.commandTimer)
    this.resizeObserver.disconnect()
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown)
    this.transformControls.dispose()
    this.orbitControls.dispose()
    this.renderer.dispose()
    this.mount.replaceChildren()
  }

  selectActor(id: ActorId) {
    this.selectedActor?.setSelected(false)
    this.selectedActor = this.actorMap.get(id) ?? null
    if (!this.selectedActor) return
    this.selectedActor.setSelected(true)
    this.transformControls.attach(this.selectedActor.root)
    this.publishSnapshot()
    this.requestRender()
  }

  setSelectedBone(bone: BoneName) {
    this.selectedBone = bone
    this.publishSnapshot()
  }

  setTransformMode(mode: TransformMode) {
    this.transformMode = mode
    this.transformControls.setMode(mode)
    this.publishSnapshot()
  }

  setActorPosition(axis: 'x' | 'y' | 'z', value: number) {
    if (!this.selectedActor) return
    this.selectedActor.root.position[axis] = value
    this.publishSnapshot()
    this.requestRender()
  }

  applyPose(pose: PoseName) {
    if (!this.selectedActor) return
    this.selectedActor.applyPose(pose)
    this.publishSnapshot()
    this.requestRender()
  }

  setBoneAngle(value: number) {
    if (!this.selectedActor) return
    this.selectedActor.joints[this.selectedBone].rotation.x = THREE.MathUtils.degToRad(value)
    this.publishSnapshot()
    this.requestRender()
  }

  setCameraPreset(index: number) {
    const preset = CAMERA_PRESETS[index]
    this.selectedCameraIndex = index
    this.camera.position.set(...preset.position)
    this.orbitControls.target.set(...preset.target)
    this.orbitControls.update()
    this.publishSnapshot()
    this.requestRender()
  }

  toggleGrid() {
    this.gridVisible = !this.gridVisible
    this.grid.visible = this.gridVisible
    this.publishSnapshot()
    this.requestRender()
  }

  reset() {
    ACTOR_CONFIGS.forEach((config) => {
      const actor = this.actorMap.get(config.id)
      if (!actor) return
      actor.root.position.set(...config.position)
      actor.root.rotation.set(0, config.rotationY, 0)
      actor.applyPose(config.id === 'assassin' ? 'attack' : config.id === 'swordsman' ? 'protect' : 'neutral')
    })
    this.selectActor('swordsman')
    this.setCameraPreset(0)
    this.updateAgentLog('舞台已重置', false)
  }

  captureFrame(assetName: string) {
    this.renderer.render(this.scene, this.camera)
    this.renderer.domElement.toBlob((blob) => {
      if (!blob) return
      const filename = `${assetName.replace(/[\\/:*?"<>|]/g, '-') || 'scene-asset'}-参考帧.png`
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
      this.updateAgentLog(`参考帧已导出 · ${filename}`, false)
    })
  }

  /** 保存场景资产在演示版中只同步编辑状态提示，后续可替换为真实 assetApi.update 调用。 */
  confirmSaved(assetName: string, previewMode: boolean) {
    this.publishSnapshot()
    this.updateAgentLog(`${previewMode ? '已保存分镜 3D 预览' : '已保存到场景资产'} · ${assetName}`, false)
  }

  /** 图片场景打开时先套入一组稳定预演站位，模拟从图片自动还原空间层次的第一步。 */
  prepareStoryboardPreview(assetName: string) {
    this.reset()
    this.actorMap.get('swordsman')?.applyPose('guard')
    this.actorMap.get('girl')?.root.position.set(-0.35, 0, 1.35)
    this.actorMap.get('assassin')?.root.position.set(2.45, 0, -1.25)
    this.setCameraPreset(2)
    this.updateAgentLog(`图片场景已载入 · ${assetName}`, false)
    this.requestRender()
  }

  /** AI 面板暂用确定性的中文意图匹配模拟 Tool Calling，工具粒度可直接迁移到后续 MCP Server。 */
  runAiCommand(command: string) {
    const trimmed = command.trim()
    if (!trimmed) return
    if (this.commandTimer) window.clearInterval(this.commandTimer)

    const tasks: Array<{ text: string; execute: () => void }> = []
    const targetActor = trimmed.includes('杀手') && !trimmed.includes('剑客')
      ? 'assassin'
      : trimmed.includes('少女') && !trimmed.includes('剑客')
        ? 'girl'
        : 'swordsman'

    tasks.push({ text: `select_actor("${targetActor}")`, execute: () => this.selectActor(targetActor) })

    if (trimmed.includes('护') || trimmed.includes('推开') || trimmed.includes('身后')) {
      tasks.push({ text: 'apply_pose("swordsman", "protect")', execute: () => this.actorMap.get('swordsman')?.applyPose('protect') })
      tasks.push({ text: 'move_actor("girl", [-0.05, 0, 1.15])', execute: () => this.actorMap.get('girl')?.root.position.set(-0.05, 0, 1.15) })
    }
    if (trimmed.includes('跪') || trimmed.includes('支撑')) {
      tasks.push({ text: 'apply_pose("swordsman", "kneel")', execute: () => this.actorMap.get('swordsman')?.applyPose('kneel') })
      tasks.push({ text: 'rotate_bone("swordsman", "head", [-18, 0, 0])', execute: () => this.actorMap.get('swordsman')?.setBoneRotation('head', [-18, 0, 0]) })
    }
    if (trimmed.includes('杀手') && (trimmed.includes('压迫') || trimmed.includes('俯视') || trimmed.includes('远处'))) {
      tasks.push({ text: 'apply_pose("assassin", "attack")', execute: () => this.actorMap.get('assassin')?.applyPose('attack') })
      tasks.push({ text: 'move_actor("assassin", [2.2, 0, -1.15])', execute: () => this.actorMap.get('assassin')?.root.position.set(2.2, 0, -1.15) })
    }
    if (trimmed.includes('对峙')) {
      tasks.push({ text: 'apply_pose("swordsman", "guard")', execute: () => this.actorMap.get('swordsman')?.applyPose('guard') })
      tasks.push({ text: 'apply_pose("assassin", "guard")', execute: () => this.actorMap.get('assassin')?.applyPose('guard') })
    }

    const cameraIndex = trimmed.includes('仰拍')
      ? 1
      : trimmed.includes('俯拍')
        ? 2
        : trimmed.includes('过肩')
          ? 3
          : 0
    tasks.push({ text: `set_camera("${CAMERA_PRESETS[cameraIndex].label}")`, execute: () => this.setCameraPreset(cameraIndex) })

    let index = 0
    this.updateAgentLog(`正在拆解指令 · ${tasks.length} 个工具调用`, true)
    this.commandTimer = window.setInterval(() => {
      const task = tasks[index]
      task.execute()
      this.updateAgentLog(task.text, index < tasks.length - 1)
      this.publishSnapshot()
      this.requestRender()
      index += 1
      if (index >= tasks.length) {
        window.clearInterval(this.commandTimer)
        this.commandTimer = undefined
        window.setTimeout(() => this.updateAgentLog(`完成 · 已执行 ${tasks.length} 个舞台工具`, false), 420)
      }
    }, 460)
  }

  private handlePointerDown = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster
      .intersectObjects(this.scene.children, true)
      .find((candidate) => candidate.object.userData.actorId)
    if (hit?.object.userData.actorId) this.selectActor(hit.object.userData.actorId as ActorId)
  }

  private createActors() {
    for (const config of ACTOR_CONFIGS) {
      const actor = new RiggedActor(config)
      this.actorMap.set(config.id, actor)
      this.scene.add(actor.root)
    }
    this.actorMap.get('swordsman')?.attachSword()
    this.actorMap.get('assassin')?.attachSword()
    this.actorMap.get('swordsman')?.applyPose('protect')
    this.actorMap.get('girl')?.applyPose('neutral')
    this.actorMap.get('assassin')?.applyPose('attack')
  }

  private setupLighting() {
    this.scene.add(new THREE.HemisphereLight(0xb7d6d2, 0x1c2626, 2.2))
    const keyLight = new THREE.DirectionalLight(0xffe9c4, 3.4)
    keyLight.position.set(-4, 7, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.camera.left = -8
    keyLight.shadow.camera.right = 8
    keyLight.shadow.camera.top = 8
    keyLight.shadow.camera.bottom = -8
    this.scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x7dc3c1, 2)
    rimLight.position.set(5, 3, -5)
    this.scene.add(rimLight)
  }

  private setupEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x182524, roughness: 0.96, metalness: 0 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const bambooMaterial = new THREE.MeshStandardMaterial({ color: 0x47635b, roughness: 0.84 })
    const bambooPositions: Array<[number, number]> = [
      [-4.2, -2.2], [-3.6, 1.5], [-2.8, -3.5], [-1.4, -4.2], [0.8, -4.3],
      [2.8, -3.8], [4.1, -2.1], [4.5, 0.6], [3.6, 2.6], [2, 3.8],
      [-0.4, 4.2], [-2.8, 3.6], [-4.4, 2.5],
    ]
    bambooPositions.forEach(([x, z], index) => {
      const height = 4.6 + (index % 3) * 0.65
      const bamboo = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, height, 10), bambooMaterial)
      bamboo.position.set(x, height / 2, z)
      bamboo.castShadow = true
      this.scene.add(bamboo)
    })

    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x3d4b49, roughness: 0.96 })
    ;[[-2.2, 0.2], [3.1, 1.6], [1.3, -3.2]].forEach(([x, z], index) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + index * 0.12, 0), rockMaterial)
      rock.position.set(x, 0.22, z)
      rock.scale.y = 0.65
      rock.castShadow = true
      this.scene.add(rock)
    })
  }

  private publishSnapshot() {
    const actor = this.selectedActor
    if (!actor) return
    const cameraPreset = CAMERA_PRESETS[this.selectedCameraIndex]
    this.setSnapshot((prev) => ({
      ...prev,
      selectedActorId: actor.config.id,
      selectedActorName: actor.config.name,
      selectedPose: actor.currentPose,
      selectedCameraIndex: this.selectedCameraIndex,
      cameraLabel: `${cameraPreset.label} / ${cameraPreset.description}`,
      actorPosition: [actor.root.position.x, actor.root.position.y, actor.root.position.z],
      boneAngle: Math.round(THREE.MathUtils.radToDeg(actor.joints[this.selectedBone].rotation.x)),
      transformMode: this.transformMode,
      gridVisible: this.gridVisible,
    }))
  }

  private updateAgentLog(agentLog: string, agentWorking: boolean) {
    this.setSnapshot((prev) => ({ ...prev, agentLog, agentWorking }))
  }

  private resizeRenderer() {
    const width = this.mount.clientWidth
    const height = this.mount.clientHeight
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  /** 静态分镜只在场景发生变化时重绘，避免持续占用 GPU 和浏览器主线程。 */
  private requestRender() {
    if (this.animationFrame) return
    this.animationFrame = window.requestAnimationFrame(() => {
      this.animationFrame = 0
      this.orbitControls.update()
      this.renderer.render(this.scene, this.camera)
    })
  }
}
