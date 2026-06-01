import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  LayoutTemplate,
  FolderOpen,
  Cpu,
  Sliders,
  Zap,
  Globe,
  Clapperboard,
  Sparkles,
  Play,
  ChevronRight,
  Quote,
  ArrowRight,
  FolderHeart,
  BrainCircuit,
  Settings2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { modelApi, generationApi, creditApi } from '@/api'
import type { AIModel, GenerationJob, CreditPackage } from '@/api'

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

/* ─── Section 1: Hero ─── */
function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 500); return () => clearTimeout(t) }, [])

  const headlineChars1 = '让 AI 赋予你的故事生命'.split('')
  const headlineChars2 = 'Create Comic Dramas with AI'.split('')

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scale(1.1)' }}
      >
        <source src="/hero-bg-video.mp4" type="video/mp4" />
      </video>
      {/* Overlay */}
      <div className="absolute inset-0 bg-[rgba(10,10,15,0.6)]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Headline Line 1 */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[72px] leading-none text-text-primary mb-2">
          {headlineChars1.map((char, i) => (
            <motion.span
              key={`l1-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className={char === 'A' || char === 'I' ? 'gradient-text' : 'inline-block'}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>

        {/* Headline Line 2 */}
        <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-none text-text-primary mb-6">
          {headlineChars2.map((char, i) => (
            <motion.span
              key={`l2-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 + i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className={char === 'A' || char === 'I' ? 'gradient-text' : 'inline-block'}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-text-secondary text-base max-w-[560px] mx-auto mb-8 leading-relaxed"
        >
          从分镜到成片，一站式 AI 漫剧生成平台。支持多种主流视频模型，专业级工作流。
        </motion.p>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            to="/dashboard"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-base hover:shadow-glow transition-all"
          >
            <Sparkles className="w-5 h-5" />
            开始创作
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-transparent border border-[rgba(0,229,255,0.4)] text-accent-cyan font-display font-semibold text-base hover:bg-accent-cyan/5 transition-colors">
            <Play className="w-4 h-4" />
            观看演示
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={loaded ? { opacity: 1 } : {}}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-caption font-mono font-medium text-text-secondary"
        >
          <AnimatedCounter value={10000} suffix="+" label="作品生成" />
          <span className="text-text-muted hidden sm:inline">|</span>
          <AnimatedCounter value={6} suffix="+" label="视频模型" />
          <span className="text-text-muted hidden sm:inline">|</span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-accent-cyan font-bold">&lt; 2</span>
            <span>分钟 单场景</span>
          </span>
        </motion.div>
      </div>
    </section>
  )
}

function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span ref={ref} className="flex items-baseline gap-1.5">
      <span className="text-accent-cyan font-bold">{count.toLocaleString()}{suffix}</span>
      <span>{label}</span>
    </span>
  )
}

/* ─── Section 2: Workflow Showcase ─── */
const workflowSteps = [
  { num: '01', title: '编写分镜', en: 'Script & Storyboard', desc: '用自然语言描述场景，AI 帮你拆解成分镜脚本', icon: Clapperboard },
  { num: '02', title: '选择物料', en: 'Select Assets', desc: '从资产库选择角色、背景、道具，或上传自定义素材', icon: FolderHeart },
  { num: '03', title: '挑选模型', en: 'Choose Model', desc: '豆包 Seedance、可灵、Luma 等多种模型任你选', icon: BrainCircuit },
  { num: '04', title: '配置参数', en: 'Set Parameters', desc: '分辨率、帧率、风格强度... 精细控制生成效果', icon: Settings2 },
  { num: '05', title: '一键生成', en: 'Generate', desc: 'AI 渲染，实时预览，快速迭代', icon: Sparkles },
]

function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <section ref={ref} className="relative bg-bg-primary py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.02)_0%,transparent_70%)]" />
      <div className="container-limit relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            5步完成专业漫剧
          </h2>
          <p className="text-text-secondary">标准化工作流，让创作更高效</p>
        </motion.div>

        {/* Step Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Step Visual */}
          <div className="relative h-72 sm:h-80">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-accent-cyan/5 border border-accent-cyan/20 flex items-center justify-center animate-glow-pulse">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                      {(() => {
                        const Icon = workflowSteps[activeStep].icon
                        return <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-accent-cyan" />
                      })()}
                    </div>
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-accent-cyan/20 animate-spin" style={{ animationDuration: '20s' }} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step Counter */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-accent-cyan text-xl">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeStep}
                  initial={{ opacity: 0, rotateX: -90 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  exit={{ opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                >
                  {workflowSteps[activeStep].num}
                </motion.span>
              </AnimatePresence>
              <span className="text-text-muted"> / 05</span>
            </div>
          </div>

          {/* Step Info */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-text-muted text-sm font-mono mb-1 block">
                  {workflowSteps[activeStep].en}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                  {workflowSteps[activeStep].title}
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {workflowSteps[activeStep].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="flex items-center gap-3">
              {workflowSteps.map((_s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="group flex items-center gap-2"
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i === activeStep
                        ? 'bg-accent-cyan shadow-[0_0_8px_rgba(0,229,255,0.5)]'
                        : i < activeStep
                        ? 'bg-accent-cyan/50'
                        : 'bg-bg-tertiary border border-border-default group-hover:border-text-muted'
                    }`}
                  />
                  {i < workflowSteps.length - 1 && (
                    <div className="w-6 h-px bg-border-default relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-accent-cyan transition-all duration-500"
                        style={{ width: i < activeStep ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Section 3: Model Highlights ─── */
const FALLBACK_MODELS: AIModel[] = [
  {
    id: 'doubao',
    key: 'doubao',
    name: '豆包 Seedance',
    description: '字节跳动旗下高性能视频生成模型，擅长舞蹈与动作场景',
    category: 'video',
    brandColor: '#FF6B35',
    isActive: true,
    isBeta: false,
    costFactor: 1,
    maxDuration: 10,
    supportedParams: {},
    adapter: 'doubao',
    sortOrder: 1,
  },
  {
    id: 'happyhourse',
    key: 'happyhourse',
    name: 'HappyHourse',
    description: '专注叙事性视频生成，角色一致性强，适合漫剧长镜头',
    category: 'video',
    brandColor: '#4ADE80',
    isActive: true,
    isBeta: false,
    costFactor: 1.2,
    maxDuration: 15,
    supportedParams: {},
    adapter: 'happyhourse',
    sortOrder: 2,
  },
]

const LOBE_ICON_BASE_URL = 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@1.91.0/icons'

const MODEL_LOGO_RULES = [
  { keywords: ['kling', '可灵'], icon: 'kling-color' },
  { keywords: ['hunyuan', '混元'], icon: 'hunyuan-color' },
  { keywords: ['doubao', 'seedance', '豆包'], icon: 'doubao-color' },
  { keywords: ['sora'], icon: 'sora-color' },
  { keywords: ['hailuo', '海螺'], icon: 'hailuo-color' },
  { keywords: ['minimax'], icon: 'minimax-color' },
  { keywords: ['wan', '万相', '通义'], icon: 'alibaba-color' },
  { keywords: ['luma', 'ray'], icon: 'luma-color' },
  { keywords: ['runway'], icon: 'runway' },
  { keywords: ['pika'], icon: 'pika' },
  { keywords: ['veo', 'google'], icon: 'google-color' },
  { keywords: ['fal'], icon: 'fal-color' },
  { keywords: ['replicate'], icon: 'replicate' },
  { keywords: ['comfy'], icon: 'comfyui-color' },
]

/**
 * 根据模型的 key、名称和 adapter 推导 LobeHub Icons 中对应的模型 Logo。
 * 后端如果已经配置了 iconUrl，则优先使用后端配置，方便运营侧覆盖。
 * 聚合器模型按实际承载模型优先匹配，例如 fal-kling 使用 Kling Logo。
 */
function getModelLogoUrl(model: AIModel) {
  if (model.iconUrl) return model.iconUrl

  const modelText = `${model.key} ${model.name} ${model.adapter}`.toLowerCase()
  const rule = MODEL_LOGO_RULES.find(({ keywords }) => keywords.some((keyword) => modelText.includes(keyword)))

  return rule ? `${LOBE_ICON_BASE_URL}/${rule.icon}.svg` : '/model-comfyui.jpg'
}

function ModelHighlightsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    modelApi.list()
      .then((data) => {
        if (!cancelled) setModels(data.length > 0 ? data : FALLBACK_MODELS)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error('加载模型失败: ' + (err instanceof Error ? err.message : '未知错误'))
          setModels(FALLBACK_MODELS)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const modelBadge = (m: AIModel) => {
    if (m.isBeta) return { text: '新上架', color: 'bg-success' }
    return { text: '热门', color: 'bg-error' }
  }

  const modelTags = (m: AIModel): string[] => {
    if (m.key === 'doubao') return ['舞蹈', '动作', '高画质']
    if (m.key === 'happyhourse') return ['叙事', '角色一致', '长镜头']
    return ['高质量', '多风格', '快速生成']
  }

  return (
    <section ref={ref} className="bg-bg-secondary section-padding">
      <div className="container-limit">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            强大模型生态
          </h2>
          <p className="text-text-secondary">接入业界领先的视频生成模型，持续更新</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-bg-primary border border-border-default rounded-radius-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {models.map((model, i) => {
              const badge = modelBadge(model)
              const tags = modelTags(model)
              const modelLogoUrl = getModelLogoUrl(model)
              return (
                <motion.div
                  key={model.id}
                  variants={scaleIn}
                  custom={i}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group bg-bg-primary border border-border-default rounded-radius-lg overflow-hidden hover:border-border-active transition-all"
                  style={{ borderTopWidth: '3px', borderTopColor: model.brandColor }}
                >
                  <div className="h-48 overflow-hidden bg-[#F7F8FA]">
                    <img
                      src={modelLogoUrl}
                      alt={model.name}
                      className="w-full h-full object-contain p-14 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${badge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {badge.text}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-text-primary text-lg mb-2">{model.name}</h3>
                    <p className="text-text-secondary text-sm mb-4 leading-relaxed">{model.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${model.brandColor}15`, color: model.brandColor }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/gallery"
                      className="inline-flex items-center gap-1 text-accent-cyan text-sm font-medium hover:gap-2 transition-all"
                    >
                      浏览作品 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}

/* ─── Section 4: Feature Grid ─── */
const features = [
  { icon: LayoutTemplate, title: '可视化分镜', desc: '拖拽式分镜编辑器，直观排列场景顺序' },
  { icon: FolderOpen, title: '资产管理', desc: '角色、背景、道具分类管理，支持批量上传' },
  { icon: Cpu, title: '多模型支持', desc: '6+ 主流视频模型，一键切换对比效果' },
  { icon: Sliders, title: '精细参数', desc: '分辨率、帧率、风格强度、种子值完全可控' },
  { icon: Zap, title: '积分系统', desc: '灵活积分套餐，用多少付多少，无订阅压力' },
  { icon: Globe, title: '多语言UI', desc: '中文/英文界面切换，国际化支持' },
]

function FeatureGridSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="bg-bg-primary section-padding">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
            专业级创作工具
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i}
              className="group bg-bg-secondary border border-border-default rounded-radius-lg p-6 hover:border-border-active transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(0,229,255,0.1)] flex items-center justify-center mb-4 group-hover:bg-[rgba(0,229,255,0.15)] transition-colors">
                <feature.icon className="w-6 h-6 text-accent-cyan" />
              </div>
              <h3 className="font-body font-semibold text-text-primary text-lg mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Section 5: Live Gallery Preview ─── */
const FALLBACK_GALLERY = [
  { title: '雨中决斗', author: '张小明', model: '豆包 Seedance', image: '/gallery-sample-1.jpg' },
  { title: '魔法战场', author: '李创意', model: '可灵 Kling', image: '/gallery-sample-2.jpg' },
  { title: '樱花下的约定', author: '王视频', model: 'Luma Ray', image: '/gallery-sample-3.jpg' },
  { title: '暗夜追逐', author: '创作者A', model: '豆包 Seedance', image: '/gallery-sample-1.jpg' },
  { title: '魔法少女变身', author: '创作者B', model: '可灵 Kling', image: '/gallery-sample-2.jpg' },
  { title: '校园日常', author: '创作者C', model: 'Runway', image: '/gallery-sample-3.jpg' },
  { title: '赛博朋克城市', author: '创作者D', model: '豆包 Seedance', image: '/gallery-sample-1.jpg' },
  { title: '古风仙侠', author: '创作者E', model: 'Wan 2.1', image: '/gallery-sample-3.jpg' },
]

interface GalleryItem {
  title: string
  author: string
  model: string
  image: string
}

function GalleryPreviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(FALLBACK_GALLERY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    generationApi.listJobs({ limit: 8 })
      .then((res) => {
        if (cancelled) return
        const jobs = res.jobs || []
        if (jobs.length > 0) {
          const items: GalleryItem[] = jobs.map((job: GenerationJob, idx: number) => {
            const fallback = FALLBACK_GALLERY[idx % FALLBACK_GALLERY.length]
            const resultUrl = job.results?.[0]?.thumbnail || job.results?.[0]?.url
            return {
              title: fallback.title,
              author: '创作者',
              model: job.modelId || 'AI',
              image: resultUrl || fallback.image,
            }
          })
          setGalleryItems(items)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error('加载作品预览失败: ' + (err instanceof Error ? err.message : '未知错误'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || isLoading) return
    let animId: number
    let scrollPos = 0
    const speed = 0.3

    const animate = () => {
      if (!isPaused && el) {
        scrollPos += speed
        if (scrollPos >= el.scrollWidth / 2) scrollPos = 0
        el.scrollLeft = scrollPos
      }
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [isPaused, isLoading])

  const displayItems = galleryItems.length > 0 ? galleryItems : FALLBACK_GALLERY

  return (
    <section ref={ref} className="bg-bg-secondary section-padding overflow-hidden">
      <div className="container-limit mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-1">社区作品</h2>
            <p className="text-text-secondary text-sm">探索创作者的精彩作品</p>
          </div>
          <Link
            to="/gallery"
            className="hidden sm:inline-flex items-center gap-1 text-accent-cyan text-sm font-medium hover:gap-2 transition-all"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 px-6 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="shrink-0 w-[320px] h-[200px] rounded-radius-lg" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-4 overflow-x-auto scrollbar-hide px-6"
            style={{ scrollBehavior: 'auto' }}
          >
            {/* Double the items for seamless loop */}
            {[...displayItems, ...displayItems].map((item, i) => (
              <div
                key={i}
                className="group relative shrink-0 w-[320px] h-[200px] rounded-radius-lg overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.8)] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="font-display font-semibold text-text-primary text-sm mb-0.5">{item.title}</h4>
                  <p className="text-text-muted text-xs">{item.author} · {item.model}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Hint */}
          <p className="text-center text-text-muted text-xs mt-4">
            &larr; 滑动查看更多 &rarr;
          </p>
        </motion.div>
      )}
    </section>
  )
}

/* ─── Section 6: Pricing Teaser ─── */
const FALLBACK_TIERS: CreditPackage[] = [
  {
    id: 'free',
    name: '入门版',
    credits: 100,
    priceCny: 0,
    priceUsd: 0,
    description: '100 积分/月',
  },
  {
    id: 'creator',
    name: '创作者',
    credits: 5000,
    priceCny: 99,
    priceUsd: 14,
    description: '5,000 积分/月',
  },
  {
    id: 'studio',
    name: '工作室',
    credits: 20000,
    priceCny: 299,
    priceUsd: 42,
    description: '20,000 积分/月',
  },
]

const TIER_FEATURES: Record<string, string[]> = {
  free: ['基础分镜', '2个模型', '720p输出', '社区支持'],
  creator: ['高级分镜', '全部模型', '1080p输出', '优先队列', 'API访问'],
  studio: ['全部Creator功能', '4K输出', '自定义模型', '专属客服', 'SLA保障'],
}

function PricingTeaserSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    creditApi.getPackages()
      .then((res) => {
        const pkgs = res.packages || []
        if (!cancelled) setPackages(pkgs.length > 0 ? pkgs : FALLBACK_TIERS)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error('加载套餐失败: ' + (err instanceof Error ? err.message : '未知错误'))
          setPackages(FALLBACK_TIERS)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const tiers = packages.length > 0 ? packages : FALLBACK_TIERS
  const tierStyle = (idx: number) => idx === 1 ? 'gradient' : 'outline'
  const tierHighlight = (idx: number) => idx === 1

  return (
    <section ref={ref} className="bg-bg-primary section-padding">
      <div className="max-w-[900px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-3">
            灵活的积分方案
          </h2>
          <p className="text-text-secondary">按需充值，无隐藏费用</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-radius-lg p-6 space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                variants={scaleIn}
                custom={i}
                className={`relative bg-bg-secondary rounded-radius-lg p-6 ${
                  tierHighlight(i)
                    ? 'border-2 border-transparent -mt-3 mb-3'
                    : 'border border-border-default'
                }`}
                style={tierHighlight(i) ? {
                  background: 'linear-gradient(#12121A, #12121A) padding-box, linear-gradient(135deg, #00E5FF, #A855F7) border-box',
                } : {}}
              >
                {tierHighlight(i) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-bg-primary text-[11px] font-bold px-3 py-0.5 rounded-full">
                    最受欢迎
                  </div>
                )}
                <h3 className="font-display font-semibold text-text-primary mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-mono text-3xl font-bold text-text-primary">¥{tier.priceCny}</span>
                  <span className="text-text-muted text-sm">/次</span>
                </div>
                <p className="text-accent-cyan font-mono text-sm mb-4">{tier.credits.toLocaleString()} 积分</p>
                <ul className="space-y-2 mb-6">
                  {(TIER_FEATURES[tier.id] || TIER_FEATURES.creator).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className="w-4 h-4 text-accent-cyan shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className={`block w-full text-center py-2.5 rounded-radius-sm font-display font-semibold text-sm transition-all ${
                    tierStyle(i) === 'gradient'
                      ? 'bg-gradient-accent text-bg-primary hover:shadow-glow animate-glow-pulse'
                      : 'border border-border-default text-text-primary hover:border-border-active'
                  }`}
                >
                  {tierHighlight(i) ? '立即订阅' : tier.priceCny === 0 ? '免费开始' : '了解更多'}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Payment Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-6 mt-10"
        >
          {['支付宝', '微信支付', 'Stripe', 'PayPal'].map((method) => (
            <span
              key={method}
              className="text-text-muted text-xs hover:text-text-secondary transition-colors cursor-default"
            >
              {method}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Section 7: Testimonials ─── */
const testimonials = [
  {
    quote: '分镜到成片只需要10分钟，效率提升了10倍',
    author: '张小明',
    role: '独立漫画家',
  },
  {
    quote: '多种模型一键切换，总能找到最适合的风格',
    author: '李创意',
    role: '动画工作室负责人',
  },
  {
    quote: '积分系统很合理，用多少充多少，没有浪费',
    author: '王视频',
    role: '短视频创作者',
  },
]

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="bg-bg-secondary section-padding">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary">
            创作者怎么说
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              variants={staggerItem}
              className="relative bg-bg-primary border border-border-default rounded-radius-lg p-6"
            >
              {/* Quote mark */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
              >
                <Quote className="w-8 h-8 text-accent-cyan mb-4" />
              </motion.div>
              <p className="text-text-primary text-base leading-relaxed italic mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/avatar-default.jpg"
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover border border-border-default"
                />
                <div>
                  <p className="font-body font-semibold text-text-primary text-sm">{t.author}</p>
                  <p className="text-text-secondary text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Section 8: CTA Footer ─── */
function CTAFooterSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="bg-gradient-hero section-padding">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4"
        >
          准备好开始创作了吗？
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-text-secondary mb-8"
        >
          注册即送 100 积分，立即体验 AI 漫剧生成
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-accent text-bg-primary font-display font-semibold text-lg hover:shadow-glow-lg transition-all animate-glow-pulse"
          >
            <Sparkles className="w-5 h-5" />
            免费开始创作
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-6"
        >
          <Link
            to="/login"
            className="text-accent-cyan text-sm hover:underline"
          >
            已有账号？立即登录
          </Link>
        </motion.p>
      </div>
    </section>
  )
}

/* ─── Home Page ─── */
export default function Home() {
  return (
    <div className="bg-bg-primary">
      <HeroSection />
      <WorkflowSection />
      <ModelHighlightsSection />
      <FeatureGridSection />
      <GalleryPreviewSection />
      <PricingTeaserSection />
      <TestimonialsSection />
      <CTAFooterSection />
    </div>
  )
}
