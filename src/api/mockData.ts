import type {
  User, Profile, Wallet, CreditPackage, CreditTransaction,
  Asset, Project, Scene, GenerationJob, CommunityWork, AIModel,
  ImageModelConfig, DashboardStats
} from './types'
import { assetUrl } from '@/lib/assets'

export const MOCK_USER: User = {
  id: 'demo-user-001',
  email: 'demo@comicdrama.ai',
  name: '演示用户',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  role: 'user',
}

export const MOCK_PROFILE: Profile = {
  ...MOCK_USER,
  bio: '热爱创作，探索 AI 漫剧的无限可能',
  preferences: {
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    theme: 'dark',
    emailNotifs: true,
    pushNotifs: false,
  },
  wallet: {
    balance: 8540,
    totalEarned: 12000,
    totalSpent: 3460,
    monthlyBudget: 5000,
  },
  connections: [],
}

export const MOCK_WALLET: Wallet = MOCK_PROFILE.wallet

export const MOCK_CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'free', name: '入门版', credits: 100, priceCny: 0, priceUsd: 0, description: '100 积分/月', isActive: true, sortOrder: 1 },
  { id: 'creator', name: '创作者', credits: 5000, priceCny: 99, priceUsd: 14, description: '5,000 积分/月', isActive: true, sortOrder: 2 },
  { id: 'studio', name: '工作室', credits: 20000, priceCny: 299, priceUsd: 42, description: '20,000 积分/月', isActive: true, sortOrder: 3 },
  { id: 'enterprise', name: '企业版', credits: 100000, priceCny: 999, priceUsd: 139, description: '100,000 积分/月', isActive: true, sortOrder: 4 },
]

export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: 'tx-1', type: '充值', amount: 5000, balance: 8540, description: '创作者套餐充值', createdAt: '2026-05-28T10:30:00Z' },
  { id: 'tx-2', type: '消耗', amount: -120, balance: 3540, description: '场景生成: 雨中决斗', createdAt: '2026-05-27T14:20:00Z' },
  { id: 'tx-3', type: '消耗', amount: -80, balance: 3660, description: '场景生成: 樱花下的约定', createdAt: '2026-05-26T09:15:00Z' },
  { id: 'tx-4', type: '奖励', amount: 200, balance: 3740, description: '每日签到奖励', createdAt: '2026-05-25T08:00:00Z' },
  { id: 'tx-5', type: '消耗', amount: -150, balance: 3540, description: '场景生成: 魔法战场', createdAt: '2026-05-24T16:45:00Z' },
  { id: 'tx-6', type: '充值', amount: 2000, balance: 3690, description: '积分充值', createdAt: '2026-05-20T11:00:00Z' },
]

export const MOCK_MODELS: AIModel[] = [
  {
    id: 'doubao', key: 'doubao', name: '豆包 Seedance',
    description: '字节跳动旗下高性能视频生成模型，擅长舞蹈与动作场景',
    category: 'video', brandColor: '#FF6B35', isActive: true, isBeta: false,
    costFactor: 1, maxDuration: 10, supportedParams: {}, adapter: 'doubao', sortOrder: 1,
  },
  {
    id: 'happyhourse', key: 'happyhourse', name: 'HappyHourse',
    description: '专注叙事性视频生成，角色一致性强，适合漫剧长镜头',
    category: 'video', brandColor: '#4ADE80', isActive: true, isBeta: false,
    costFactor: 1.2, maxDuration: 15, supportedParams: {}, adapter: 'happyhourse', sortOrder: 2,
  },
  {
    id: 'kling', key: 'kling', name: '可灵 Kling',
    description: '快手出品，画面细腻，运动幅度大，适合特效场景',
    category: 'video', brandColor: '#F472B6', isActive: true, isBeta: false,
    costFactor: 1.5, maxDuration: 10, supportedParams: {}, adapter: 'kling', sortOrder: 3,
  },
  {
    id: 'luma', key: 'luma', name: 'Luma Ray',
    description: '物理仿真效果出色，光影真实，适合写实风格',
    category: 'video', brandColor: '#A78BFA', isActive: true, isBeta: false,
    costFactor: 1.8, maxDuration: 8, supportedParams: {}, adapter: 'luma', sortOrder: 4,
  },
  {
    id: 'wan', key: 'wan', name: '万相 Wan 2.1',
    description: '阿里通义万相，中文理解强，适合国风内容',
    category: 'video', brandColor: '#F472B6', isActive: true, isBeta: true,
    costFactor: 1.3, maxDuration: 12, supportedParams: {}, adapter: 'wan', sortOrder: 5,
  },
  {
    id: 'hunyuan', key: 'hunyuan', name: '混元 Hunyuan',
    description: '腾讯混元，多模态理解，适合复杂场景描述',
    category: 'video', brandColor: '#60A5FA', isActive: true, isBeta: false,
    costFactor: 1.4, maxDuration: 10, supportedParams: {}, adapter: 'hunyuan', sortOrder: 6,
  },
]

export const MOCK_IMAGE_MODELS: ImageModelConfig[] = [
  {
    id: 'sdxl', name: 'Stable Diffusion XL', provider: 'stability',
    costCredits: 10, sortOrder: 1,
    params: {
      minWidth: 512, maxWidth: 2048, minHeight: 512, maxHeight: 2048,
      defaultWidth: 1024, defaultHeight: 1024,
      supportedSizes: [
        { label: '1:1', width: 1024, height: 1024 },
        { label: '16:9', width: 1344, height: 768 },
        { label: '9:16', width: 768, height: 1344 },
      ],
      supportsNegativePrompt: true, supportsSeed: true, supportsSteps: true,
      minSteps: 10, maxSteps: 50, defaultSteps: 25,
      supportsCfgScale: true, minCfgScale: 1, maxCfgScale: 20, defaultCfgScale: 7,
      supportsStyle: true, styleOptions: ['写实', '动漫', '油画', '水墨'],
    }
  },
  {
    id: 'dalle3', name: 'DALL·E 3', provider: 'openai',
    costCredits: 20, sortOrder: 2,
    params: {
      minWidth: 512, maxWidth: 2048, minHeight: 512, maxHeight: 2048,
      defaultWidth: 1024, defaultHeight: 1024,
      supportedSizes: [
        { label: '1:1', width: 1024, height: 1024 },
        { label: '16:9', width: 1792, height: 1024 },
        { label: '9:16', width: 1024, height: 1792 },
      ],
      supportsNegativePrompt: false, supportsSeed: false, supportsSteps: false,
      supportsCfgScale: false, supportsStyle: false,
    }
  },
]

export const MOCK_ASSETS: Asset[] = [
  { id: 'asset-1', name: '主角-林风', type: 'character', mimeType: 'image/webp', size: 2048000, url: assetUrl('demo-art/male-portrait.webp'), thumbnail: assetUrl('demo-art/male-portrait.webp'), width: 1254, height: 1254, tags: ['角色', '古风', '男性'], usageCount: 12, createdAt: '2026-05-20T08:00:00Z' },
  { id: 'asset-2', name: '女主角-苏雪', type: 'character', mimeType: 'image/webp', size: 1892000, url: assetUrl('demo-art/female-portrait.webp'), thumbnail: assetUrl('demo-art/female-portrait.webp'), width: 1254, height: 1254, tags: ['角色', '现代', '女性'], usageCount: 8, createdAt: '2026-05-19T10:00:00Z' },
  { id: 'asset-3', name: '樱花街道背景', type: 'background', mimeType: 'image/webp', size: 4096000, url: assetUrl('demo-art/sakura-street.webp'), thumbnail: assetUrl('demo-art/sakura-street.webp'), width: 1672, height: 941, tags: ['背景', '日式', '樱花'], usageCount: 5, createdAt: '2026-05-18T14:00:00Z' },
  { id: 'asset-4', name: '水晶魔法杖', type: 'prop', mimeType: 'image/webp', size: 512000, url: assetUrl('demo-art/crystal-wand.webp'), thumbnail: assetUrl('demo-art/crystal-wand.webp'), width: 1254, height: 1254, tags: ['道具', '魔法', '武器'], usageCount: 3, createdAt: '2026-05-15T09:00:00Z' },
  { id: 'asset-5', name: '雨夜都市', type: 'background', mimeType: 'image/webp', size: 3500000, url: assetUrl('demo-art/rainy-cyber-street.webp'), thumbnail: assetUrl('demo-art/rainy-cyber-street.webp'), width: 1672, height: 941, tags: ['背景', '都市', '夜景'], usageCount: 7, createdAt: '2026-05-10T16:00:00Z' },
  { id: 'asset-6', name: '战斗音效包', type: 'audio', mimeType: 'audio/wav', size: 8192000, url: assetUrl('demo-art/magic-battle.webp'), thumbnail: assetUrl('demo-art/magic-battle.webp'), duration: 120, tags: ['音效', '战斗', '动作'], usageCount: 2, createdAt: '2026-05-05T11:00:00Z' },
]

export const MOCK_SCENES: Scene[] = [
  {
    id: 'scene-1', projectId: 'proj-1', number: 1, title: '开场：雨夜相遇',
    description: '主角林风在雨夜中偶遇神秘女子苏雪', script: '雨夜，林风撑伞走在街道上，突然一个身影从巷口冲出...',
    duration: 8, shotType: '中景', cameraAngle: '平视', cameraMove: '推轨', transition: '淡入',
    stylePreset: '电影感', modelId: 'doubao', prompt: '雨夜都市街道，男主角撑伞，霓虹灯光反射，电影感色调',
    negativePrompt: '模糊，低质量，变形', seed: 12345,
    characterIds: ['asset-1', 'asset-2'], backgroundId: 'asset-5', propIds: [], audioId: null,
    dialogues: [
      { character: '林风', text: '你没事吧？', startAt: 2, duration: 1.5 },
      { character: '苏雪', text: '...有人在追我', startAt: 4, duration: 2 },
    ],
    assetIds: ['asset-1', 'asset-2', 'asset-5'],
    latestResultUrl: assetUrl('demo-art/rainy-duel.webp'), latestResultThumbnail: assetUrl('demo-art/rainy-duel.webp'),
    createdAt: '2026-05-25T09:00:00Z',
  },
  {
    id: 'scene-2', projectId: 'proj-1', number: 2, title: '追逐戏',
    description: '两人在雨夜中奔跑逃离追兵', script: '林风拉着苏雪的手在雨中奔跑，身后追兵的手电光闪烁...',
    duration: 10, shotType: '全景', cameraAngle: '俯视', cameraMove: '航拍', transition: '切',
    stylePreset: '动作片', modelId: 'kling', prompt: '雨夜追逐，两人在街道上奔跑，身后追兵，霓虹灯光，电影感',
    negativePrompt: '模糊', seed: 23456,
    characterIds: ['asset-1', 'asset-2'], backgroundId: 'asset-5', propIds: [], audioId: null,
    dialogues: [
      { character: '林风', text: '这边！', startAt: 1, duration: 1 },
      { character: '苏雪', text: '他们快追上来了！', startAt: 5, duration: 2 },
    ],
    assetIds: ['asset-1', 'asset-2', 'asset-5'],
    latestResultUrl: assetUrl('demo-art/cyber-chase.webp'), latestResultThumbnail: assetUrl('demo-art/cyber-chase.webp'),
    createdAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 'scene-3', projectId: 'proj-1', number: 3, title: '安全屋',
    description: '两人躲进一间废弃仓库暂时安全', script: '仓库内昏暗，只有一缕月光从破窗照入...',
    duration: 6, shotType: '特写', cameraAngle: '低角度', cameraMove: '固定', transition: '叠化',
    stylePreset: '悬疑', modelId: 'happyhourse', prompt: '废弃仓库内部，月光从破窗照入，灰尘飞舞，悬疑氛围',
    negativePrompt: '', seed: 34567,
    characterIds: ['asset-1', 'asset-2'], backgroundId: null, propIds: ['asset-4'], audioId: null,
    dialogues: [
      { character: '林风', text: '暂时安全了...你是谁？', startAt: 2, duration: 2 },
    ],
    assetIds: ['asset-1', 'asset-2', 'asset-4'],
    latestResultUrl: assetUrl('demo-art/rainy-cyber-street.webp'), latestResultThumbnail: assetUrl('demo-art/rainy-cyber-street.webp'),
    createdAt: '2026-05-25T11:00:00Z',
  },
]

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', name: '雨夜追凶', description: '一段发生在雨夜的悬疑爱情故事',
    status: 'ACTIVE', coverImage: assetUrl('demo-art/rainy-duel.webp'),
    createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-05-28T14:00:00Z',
    scenes: MOCK_SCENES,
  },
  {
    id: 'proj-2', name: '樱花下的约定', description: '青春校园爱情故事',
    status: 'COMPLETED', coverImage: assetUrl('demo-art/sakura-promise.webp'),
    createdAt: '2026-05-15T10:00:00Z', updatedAt: '2026-05-22T16:00:00Z',
    scenes: [],
  },
  {
    id: 'proj-3', name: '魔法学院', description: '奇幻魔法世界冒险',
    status: 'DRAFT', coverImage: assetUrl('demo-art/magic-girl.webp'),
    createdAt: '2026-05-10T09:00:00Z', updatedAt: '2026-05-12T11:00:00Z',
    scenes: [],
  },
  {
    id: 'proj-4', name: '赛博朋克2077同人', description: '夜之城的新传说',
    status: 'ACTIVE', coverImage: assetUrl('demo-art/cyber-skyline.webp'),
    createdAt: '2026-05-05T14:00:00Z', updatedAt: '2026-05-27T10:00:00Z',
    scenes: [],
  },
]

export const MOCK_GENERATION_JOBS: GenerationJob[] = [
  {
    id: 'job-1', projectId: 'proj-1', sceneIds: ['scene-1'], modelId: 'doubao',
    status: 'completed', params: { duration: 8 }, cost: 120, progress: 100,
    workType: 'video', tags: ['古风', '悬疑'], queuedAt: '2026-05-28T10:00:00Z',
    startedAt: '2026-05-28T10:00:05Z', completedAt: '2026-05-28T10:01:30Z',
    results: [{ id: 'res-1', sceneId: 'scene-1', url: assetUrl('demo-art/rainy-duel.webp'), thumbnail: assetUrl('demo-art/rainy-duel.webp') }],
  },
  {
    id: 'job-2', projectId: 'proj-1', sceneIds: ['scene-2'], modelId: 'kling',
    status: 'completed', params: { duration: 10 }, cost: 150, progress: 100,
    workType: 'video', tags: ['动作', '都市'], queuedAt: '2026-05-27T14:00:00Z',
    startedAt: '2026-05-27T14:00:03Z', completedAt: '2026-05-27T14:02:10Z',
    results: [{ id: 'res-2', sceneId: 'scene-2', url: assetUrl('demo-art/cyber-chase.webp'), thumbnail: assetUrl('demo-art/cyber-chase.webp') }],
  },
  {
    id: 'job-3', projectId: 'proj-1', sceneIds: ['scene-3'], modelId: 'happyhourse',
    status: 'running', params: { duration: 6 }, cost: 80, progress: 67,
    workType: 'video', tags: ['悬疑'], queuedAt: '2026-05-28T15:00:00Z',
    startedAt: '2026-05-28T15:00:02Z',
    results: [],
  },
  {
    id: 'job-4', projectId: 'proj-2', sceneIds: [], modelId: 'wan',
    status: 'completed', params: { duration: 12 }, cost: 200, progress: 100,
    workType: 'video', tags: ['校园', '浪漫'], queuedAt: '2026-05-22T09:00:00Z',
    startedAt: '2026-05-22T09:00:04Z', completedAt: '2026-05-22T09:03:20Z',
    results: [{ id: 'res-4', url: assetUrl('demo-art/sakura-promise.webp'), thumbnail: assetUrl('demo-art/sakura-promise.webp') }],
  },
]

export const MOCK_COMMUNITY_WORKS: CommunityWork[] = [
  { id: 'cw-1', userId: 'user-1', sourceType: 'generation', sourceId: 'job-1', title: '雨中决斗', description: '古风悬疑短片片段', workType: 'video', mediaUrl: assetUrl('demo-art/rainy-duel.webp'), thumbnailUrl: assetUrl('demo-art/rainy-duel.webp'), tags: ['古风', '悬疑', '动作'], userName: '张小明', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', createdAt: '2026-05-28T12:00:00Z' },
  { id: 'cw-2', userId: 'user-2', sourceType: 'generation', sourceId: 'job-2', title: '魔法战场', description: '奇幻魔法对决', workType: 'video', mediaUrl: assetUrl('demo-art/magic-battle.webp'), thumbnailUrl: assetUrl('demo-art/magic-battle.webp'), tags: ['奇幻', '战斗', '魔法'], userName: '李创意', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', createdAt: '2026-05-27T15:00:00Z' },
  { id: 'cw-3', userId: 'user-3', sourceType: 'generation', sourceId: 'job-4', title: '樱花下的约定', description: '青春校园爱情故事', workType: 'video', mediaUrl: assetUrl('demo-art/sakura-promise.webp'), thumbnailUrl: assetUrl('demo-art/sakura-promise.webp'), tags: ['校园', '浪漫', '治愈'], userName: '王视频', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', createdAt: '2026-05-26T10:00:00Z' },
  { id: 'cw-4', userId: 'user-4', sourceType: 'generation', sourceId: 'job-5', title: '暗夜追逐', description: '赛博朋克风格的追逐戏', workType: 'video', mediaUrl: assetUrl('demo-art/cyber-chase.webp'), thumbnailUrl: assetUrl('demo-art/cyber-chase.webp'), tags: ['科幻', '赛博朋克', '动作'], userName: '创作者A', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', createdAt: '2026-05-25T08:00:00Z' },
  { id: 'cw-5', userId: 'user-5', sourceType: 'generation', sourceId: 'job-6', title: '魔法少女变身', description: '经典变身场景', workType: 'video', mediaUrl: assetUrl('demo-art/magic-girl.webp'), thumbnailUrl: assetUrl('demo-art/magic-girl.webp'), tags: ['魔法', '变身', '少女心'], userName: '创作者B', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', createdAt: '2026-05-24T14:00:00Z' },
  { id: 'cw-6', userId: 'user-6', sourceType: 'generation', sourceId: 'job-7', title: '校园日常', description: '温馨的校园生活片段', workType: 'video', mediaUrl: assetUrl('demo-art/classroom.webp'), thumbnailUrl: assetUrl('demo-art/classroom.webp'), tags: ['校园', '日常', '治愈'], userName: '创作者C', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', createdAt: '2026-05-23T11:00:00Z' },
  { id: 'cw-7', userId: 'user-7', sourceType: 'generation', sourceId: 'job-8', title: '赛博朋克城市', description: '未来都市全景', workType: 'image', mediaUrl: assetUrl('demo-art/cyber-skyline.webp'), thumbnailUrl: assetUrl('demo-art/cyber-skyline.webp'), tags: ['科幻', '赛博朋克', '场景'], userName: '创作者D', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', createdAt: '2026-05-22T16:00:00Z' },
  { id: 'cw-8', userId: 'user-8', sourceType: 'generation', sourceId: 'job-9', title: '古风仙侠', description: '仙侠世界风景', workType: 'image', mediaUrl: assetUrl('demo-art/xianxia-clouds.webp'), thumbnailUrl: assetUrl('demo-art/xianxia-clouds.webp'), tags: ['古风', '仙侠', '风景'], userName: '创作者E', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', createdAt: '2026-05-21T09:00:00Z' },
  { id: 'cw-9', userId: 'user-9', sourceType: 'generation', sourceId: 'job-10', title: '机甲大战', description: '巨型机甲对决', workType: 'video', mediaUrl: assetUrl('demo-art/mecha-battle.webp'), thumbnailUrl: assetUrl('demo-art/mecha-battle.webp'), tags: ['科幻', '机甲', '战斗'], userName: '创作者F', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9', createdAt: '2026-05-20T13:00:00Z' },
  { id: 'cw-10', userId: 'user-10', sourceType: 'generation', sourceId: 'job-11', title: '海底世界', description: '奇幻海底探险', workType: 'video', mediaUrl: assetUrl('demo-art/underwater-ruins.webp'), thumbnailUrl: assetUrl('demo-art/underwater-ruins.webp'), tags: ['奇幻', '海洋', '探险'], userName: '创作者G', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10', createdAt: '2026-05-19T10:00:00Z' },
  { id: 'cw-11', userId: 'user-11', sourceType: 'generation', sourceId: 'job-12', title: '太空歌剧', description: '星际战争场景', workType: 'video', mediaUrl: assetUrl('demo-art/space-opera.webp'), thumbnailUrl: assetUrl('demo-art/space-opera.webp'), tags: ['科幻', '太空', '战争'], userName: '创作者H', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11', createdAt: '2026-05-18T15:00:00Z' },
  { id: 'cw-12', userId: 'user-12', sourceType: 'generation', sourceId: 'job-13', title: '异世界冒险', description: '勇者小队出发', workType: 'comic', mediaUrl: assetUrl('demo-art/fantasy-adventure.webp'), thumbnailUrl: assetUrl('demo-art/fantasy-adventure.webp'), tags: ['奇幻', '冒险', '热血'], userName: '创作者I', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12', createdAt: '2026-05-17T11:00:00Z' },
]

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 12580,
  activeUsers: 3420,
  totalRevenue: 856000,
  monthlyRevenue: 128000,
  totalGenerations: 45620,
  activeSubscriptions: 890,
  avgGenerationTime: 92,
  systemStatus: 'healthy',
}

// In-memory mutable state for demo interactivity
let demoProjects = [...MOCK_PROJECTS]
let demoJobs = [...MOCK_GENERATION_JOBS]
let demoAssets = [...MOCK_ASSETS]
let demoBalance = MOCK_WALLET.balance
let demoTransactions = [...MOCK_TRANSACTIONS]

export function getDemoProjects() { return [...demoProjects] }
export function setDemoProjects(projects: Project[]) { demoProjects = [...projects] }

export function getDemoJobs() { return [...demoJobs] }
export function setDemoJobs(jobs: GenerationJob[]) { demoJobs = [...jobs] }

export function getDemoAssets() { return [...demoAssets] }
export function setDemoAssets(assets: Asset[]) { demoAssets = [...assets] }

export function getDemoBalance() { return demoBalance }
export function setDemoBalance(b: number) { demoBalance = b }

export function getDemoTransactions() { return [...demoTransactions] }
export function setDemoTransactions(tx: CreditTransaction[]) { demoTransactions = [...tx] }
