import type {
  User, Profile, Wallet, CreditPackage, CreditTransaction,
  Asset, Project, Scene, SceneInput, SceneUpdateInput,
  GenerationJob, CommunityWork, AIModel,
  ImageModelConfig, GenerateImageResult, PaymentOrder,
  PaginatedResponse
} from './types'
import {
  MOCK_USER, MOCK_PROFILE, MOCK_WALLET, MOCK_CREDIT_PACKAGES,
  MOCK_TRANSACTIONS, MOCK_MODELS, MOCK_IMAGE_MODELS, MOCK_ASSETS,
  MOCK_PROJECTS, MOCK_SCENES, MOCK_GENERATION_JOBS, MOCK_COMMUNITY_WORKS,
  getDemoProjects, setDemoProjects,
  getDemoJobs, setDemoJobs,
  getDemoAssets, setDemoAssets,
  getDemoBalance, setDemoBalance,
  getDemoTransactions, setDemoTransactions,
} from './mockData'
import { assetUrl } from '@/lib/assets'

// Re-export types
export type { ReferralStats, ReferralReward, ReferralRewardsResponse } from './types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Auth ───
export const authApi = {
  async me(): Promise<User> {
    await delay(300)
    return MOCK_USER
  },
  async login(email: string, _password: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    await delay(500)
    return { user: { ...MOCK_USER, email }, tokens: { accessToken: 'demo-token', refreshToken: 'demo-refresh' } }
  },
  async register(email: string, _password: string, name?: string, _ref?: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    await delay(500)
    return { user: { ...MOCK_USER, email, name: name || '新用户' }, tokens: { accessToken: 'demo-token', refreshToken: 'demo-refresh' } }
  },
  async logout(): Promise<void> {
    await delay(200)
  },
}

// ─── User ───
export const userApi = {
  async getProfile(): Promise<Profile> {
    await delay(300)
    return MOCK_PROFILE
  },
  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    await delay(300)
    return { ...MOCK_PROFILE, ...data }
  },
  async getConnections(): Promise<{ provider: string; providerAccountId: string }[]> {
    await delay(200)
    return []
  },
  async getApiKeys(): Promise<{ id: string; name: string; key?: string; createdAt: string }[]> {
    await delay(200)
    return [
      { id: 'key-1', name: '默认密钥', key: 'sk-demo-xxxxxxxxxxxxxxxx', createdAt: '2026-05-01T00:00:00Z' }
    ]
  },
}

// ─── Credit ───
export const creditApi = {
  async getBalance(): Promise<{ balance: number }> {
    await delay(200)
    return { balance: getDemoBalance() }
  },
  async getPackages(): Promise<{ packages: CreditPackage[] }> {
    await delay(300)
    return { packages: MOCK_CREDIT_PACKAGES }
  },
  async getTransactions(params?: { page?: number; limit?: number }): Promise<{ transactions: CreditTransaction[]; meta?: { page: number; limit: number; total: number; totalPages: number } }> {
    await delay(300)
    const txs = getDemoTransactions()
    const page = params?.page || 1
    const limit = params?.limit || 20
    const totalPages = Math.max(1, Math.ceil(txs.length / limit))
    return {
      transactions: txs.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total: txs.length, totalPages }
    }
  },
  async purchase(packageId: string): Promise<{ order: PaymentOrder }> {
    await delay(600)
    const pkg = MOCK_CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) throw new Error('套餐不存在')
    const newTx: CreditTransaction = {
      id: `tx-${Date.now()}`, type: '充值', amount: pkg.credits,
      balance: getDemoBalance() + pkg.credits, description: `${pkg.name} 充值`,
      createdAt: new Date().toISOString(),
    }
    setDemoBalance(newTx.balance)
    setDemoTransactions([newTx, ...getDemoTransactions()])
    return {
      order: {
        id: `order-${Date.now()}`, type: 'credit', amount: pkg.priceCny,
        currency: 'CNY', status: 'completed', provider: 'mock', createdAt: new Date().toISOString(),
      }
    }
  },
}

// ─── Model ───
export const modelApi = {
  async list(): Promise<AIModel[]> {
    await delay(300)
    return MOCK_MODELS
  },
  async get(id: string): Promise<AIModel> {
    await delay(200)
    const model = MOCK_MODELS.find((m) => m.id === id)
    if (!model) throw new Error('模型不存在')
    return model
  },
}

// ─── Image Generation ───
export const imageGenerationApi = {
  async getModels(): Promise<ImageModelConfig[]> {
    await delay(300)
    return MOCK_IMAGE_MODELS
  },
  async listModels(): Promise<ImageModelConfig[]> {
    await delay(300)
    return MOCK_IMAGE_MODELS
  },
  async generate(_params: Record<string, unknown>): Promise<GenerateImageResult> {
    await delay(2000)
    return {
      url: assetUrl('demo-art/magic-girl.webp'), width: 1672, height: 941,
      seed: Math.floor(Math.random() * 1000000), format: 'webp',
    }
  },
}

// ─── Project ───
export const projectApi = {
  async list(): Promise<{ projects: Project[]; meta: { total: number } }> {
    await delay(300)
    const projects = getDemoProjects()
    return { projects, meta: { total: projects.length } }
  },
  async get(id: string): Promise<Project> {
    await delay(300)
    const project = getDemoProjects().find((p) => p.id === id)
    if (!project) throw new Error('项目不存在')
    return project
  },
  async create(data: { name: string; description?: string }): Promise<Project> {
    await delay(400)
    const newProject: Project = {
      id: `proj-${Date.now()}`, name: data.name, description: data.description,
      status: 'DRAFT', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), scenes: [],
    }
    setDemoProjects([newProject, ...getDemoProjects()])
    return newProject
  },
  async update(id: string, data: Partial<Project>): Promise<Project> {
    await delay(300)
    const projects = getDemoProjects()
    const idx = projects.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('项目不存在')
    projects[idx] = { ...projects[idx], ...data, updatedAt: new Date().toISOString() }
    setDemoProjects(projects)
    return projects[idx]
  },
  async delete(id: string): Promise<void> {
    await delay(300)
    setDemoProjects(getDemoProjects().filter((p) => p.id !== id))
  },
  /** 分镜页仍从 projectApi 调用分镜接口，演示环境在这里代理到内存版 sceneApi。 */
  async listScenes(projectId: string): Promise<Scene[]> {
    return sceneApi.list(projectId)
  },
  /** 创建分镜后立即写回所属项目，确保演示页面刷新列表时能看到新数据。 */
  async createScene(projectId: string, data: SceneInput): Promise<Scene> {
    return sceneApi.create(projectId, data)
  },
  async updateScene(projectId: string, sceneId: string, data: SceneUpdateInput): Promise<Scene> {
    return sceneApi.update(projectId, sceneId, data)
  },
  async deleteScene(projectId: string, sceneId: string): Promise<void> {
    return sceneApi.delete(projectId, sceneId)
  },
  /** 复制当前分镜并重排编号，模拟真实后端的 duplicateScene 行为。 */
  async duplicateScene(projectId: string, sceneId: string): Promise<Scene> {
    await delay(300)
    const projects = getDemoProjects()
    const projectIndex = projects.findIndex((p) => p.id === projectId)
    const source = projects[projectIndex]?.scenes?.find((scene) => scene.id === sceneId)
    if (projectIndex === -1 || !source) throw new Error('场景不存在')
    const nextScene: Scene = {
      ...source,
      id: `scene-${Date.now()}`,
      number: (projects[projectIndex].scenes?.length ?? 0) + 1,
      title: `${source.title} 副本`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      latestJobId: null,
    }
    projects[projectIndex].scenes = [...(projects[projectIndex].scenes ?? []), nextScene].map((scene, index) => ({
      ...scene,
      number: index + 1,
    }))
    projects[projectIndex].updatedAt = new Date().toISOString()
    setDemoProjects(projects)
    return nextScene
  },
  /** 按拖拽后的 id 顺序重排项目分镜，保持左侧列表编号稳定更新。 */
  async reorderScenes(projectId: string, sceneIds: string[]): Promise<void> {
    await delay(200)
    const projects = getDemoProjects()
    const projectIndex = projects.findIndex((p) => p.id === projectId)
    if (projectIndex === -1) throw new Error('项目不存在')
    const scenes = projects[projectIndex].scenes ?? []
    const sceneById = new Map(scenes.map((scene) => [scene.id, scene]))
    projects[projectIndex].scenes = sceneIds
      .map((id) => sceneById.get(id))
      .filter((scene): scene is Scene => !!scene)
      .map((scene, index) => ({ ...scene, number: index + 1 }))
    projects[projectIndex].updatedAt = new Date().toISOString()
    setDemoProjects(projects)
  },
}

// ─── Scene ───
export const sceneApi = {
  async list(projectId: string): Promise<Scene[]> {
    await delay(300)
    const project = getDemoProjects().find((p) => p.id === projectId)
    return project?.scenes || []
  },
  async create(projectId: string, data: SceneInput): Promise<Scene> {
    await delay(400)
    const projects = getDemoProjects()
    const idx = projects.findIndex((p) => p.id === projectId)
    if (idx === -1) throw new Error('项目不存在')
    const scenes = projects[idx].scenes || []
    const newScene: Scene = {
      id: `scene-${Date.now()}`, projectId, number: scenes.length + 1,
      title: data.title, description: data.description || null,
      script: data.script || null, duration: data.duration || 5,
      shotType: data.shotType || null, cameraAngle: data.cameraAngle || null,
      cameraMove: data.cameraMove || null, transition: data.transition || null,
      stylePreset: data.stylePreset || null, modelId: data.modelId || null,
      prompt: data.prompt || null, negativePrompt: data.negativePrompt || null,
      seed: data.seed || null, modelParams: data.modelParams || {},
      referenceImage: data.referenceImage || null,
      characterIds: data.characterIds || [], backgroundId: data.backgroundId || null,
      propIds: data.propIds || [], audioId: data.audioId || null,
      dialogues: data.dialogues || [], assetIds: data.assetIds || [],
      settings: data.settings || {}, createdAt: new Date().toISOString(),
    }
    projects[idx].scenes = [...scenes, newScene]
    projects[idx].updatedAt = new Date().toISOString()
    setDemoProjects(projects)
    return newScene
  },
  async update(_projectId: string, sceneId: string, data: SceneUpdateInput): Promise<Scene> {
    await delay(300)
    const projects = getDemoProjects()
    for (const project of projects) {
      const idx = project.scenes?.findIndex((s) => s.id === sceneId)
      if (idx !== undefined && idx !== -1 && project.scenes) {
        project.scenes[idx] = { ...project.scenes[idx], ...data, updatedAt: new Date().toISOString() }
        project.updatedAt = new Date().toISOString()
        setDemoProjects(projects)
        return project.scenes[idx]
      }
    }
    throw new Error('场景不存在')
  },
  async delete(projectId: string, sceneId: string): Promise<void> {
    await delay(300)
    const projects = getDemoProjects()
    const idx = projects.findIndex((p) => p.id === projectId)
    if (idx !== -1 && projects[idx].scenes) {
      projects[idx].scenes = projects[idx].scenes!.filter((s) => s.id !== sceneId)
      projects[idx].updatedAt = new Date().toISOString()
      setDemoProjects(projects)
    }
  },
}

// ─── Generation ───
export const generationApi = {
  async listJobs(params?: { limit?: number; page?: number }): Promise<{ jobs: GenerationJob[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    await delay(300)
    const jobs = getDemoJobs()
    const limit = params?.limit || 10
    const page = params?.page || 1
    const totalPages = Math.ceil(jobs.length / limit)
    return { jobs: jobs.slice((page - 1) * limit, page * limit), meta: { total: jobs.length, page, limit, totalPages } }
  },
  async create(projectId: string, sceneIds: string[], modelId: string, _params?: Record<string, unknown>): Promise<GenerationJob> {
    await delay(500)
    const newJob: GenerationJob = {
      id: `job-${Date.now()}`, projectId, sceneIds, modelId,
      status: 'QUEUED', params: _params || {}, cost: 100, progress: 0,
      workType: 'video', tags: [], queuedAt: new Date().toISOString(),
    }
    setDemoJobs([newJob, ...getDemoJobs()])
    // 模拟生成任务推进，并在完成时把最新结果同步回对应分镜，便于演示预览刷新。
    setTimeout(() => {
      const jobs = getDemoJobs()
      const idx = jobs.findIndex((j) => j.id === newJob.id)
      if (idx !== -1) {
        jobs[idx] = { ...jobs[idx], status: 'PROCESSING', progress: 30, startedAt: new Date().toISOString() }
        setDemoJobs(jobs)
      }
    }, 2000)
    setTimeout(() => {
      const jobs = getDemoJobs()
      const idx = jobs.findIndex((j) => j.id === newJob.id)
      if (idx !== -1) {
        jobs[idx] = { ...jobs[idx], status: 'PROCESSING', progress: 70 }
        setDemoJobs(jobs)
      }
    }, 5000)
    setTimeout(() => {
      const jobs = getDemoJobs()
      const idx = jobs.findIndex((j) => j.id === newJob.id)
      if (idx !== -1) {
        const resultUrl = assetUrl('demo-art/rainy-duel.webp')
        jobs[idx] = {
          ...jobs[idx], status: 'COMPLETED', progress: 100,
          completedAt: new Date().toISOString(),
          results: [{ id: `res-${Date.now()}`, sceneId: sceneIds[0], url: resultUrl, thumbnail: resultUrl }]
        }
        setDemoJobs(jobs)
        const projects = getDemoProjects()
        const projectIndex = projects.findIndex((p) => p.id === projectId)
        const sceneIndex = projects[projectIndex]?.scenes?.findIndex((scene) => scene.id === sceneIds[0])
        if (projectIndex !== -1 && sceneIndex !== undefined && sceneIndex !== -1 && projects[projectIndex].scenes) {
          projects[projectIndex].scenes![sceneIndex] = {
            ...projects[projectIndex].scenes![sceneIndex],
            latestJobId: newJob.id,
            latestResultUrl: resultUrl,
            latestResultThumbnail: resultUrl,
            updatedAt: new Date().toISOString(),
          }
          setDemoProjects(projects)
        }
      }
    }, 8000)
    return newJob
  },
  /** 兼容真实前端的提交接口，把对象参数转成演示环境的内存任务。 */
  async submit(data: { projectId: string; sceneIds: string[]; modelId?: string; workType?: string; params?: Record<string, unknown> }): Promise<GenerationJob> {
    return generationApi.create(data.projectId, data.sceneIds, data.modelId ?? 'doubao', data.params)
  },
  async getJob(id: string): Promise<GenerationJob> {
    await delay(200)
    const job = getDemoJobs().find((j) => j.id === id)
    if (!job) throw new Error('任务不存在')
    return job
  },
  /** 取消演示任务时只更新内存状态，轮询面板会据此回到 idle。 */
  async cancelJob(id: string): Promise<void> {
    await delay(200)
    const jobs = getDemoJobs()
    const idx = jobs.findIndex((job) => job.id === id)
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], status: 'CANCELED', progress: jobs[idx].progress ?? 0 }
      setDemoJobs(jobs)
    }
  },
}

// ─── Asset ───
export const assetApi = {
  async list(params?: { type?: string; search?: string }): Promise<{ assets: Asset[]; meta: { total: number } }> {
    await delay(300)
    let assets = getDemoAssets()
    if (params?.type && params.type !== 'all') {
      assets = assets.filter((a) => a.type === params.type)
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      assets = assets.filter((a) => a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
    }
    return { assets, meta: { total: assets.length } }
  },
  async create(data: { name: string; type: string; url: string; tags?: string[] }): Promise<Asset> {
    await delay(400)
    const newAsset: Asset = {
      id: `asset-${Date.now()}`, name: data.name, type: data.type,
      mimeType: 'image/png', size: 1024000, url: data.url,
      thumbnail: data.url, width: 1024, height: 1024,
      tags: data.tags || [], usageCount: 0, createdAt: new Date().toISOString(),
    }
    setDemoAssets([newAsset, ...getDemoAssets()])
    return newAsset
  },
  async upload(_formData: FormData): Promise<Asset> {
    await delay(1500)
    const newAsset: Asset = {
      id: `asset-${Date.now()}`, name: '上传素材', type: 'image',
      mimeType: 'image/webp', size: 2048000, url: assetUrl('demo-art/sakura-street.webp'),
      thumbnail: assetUrl('demo-art/sakura-street.webp'), width: 1672, height: 941,
      tags: [], usageCount: 0, createdAt: new Date().toISOString(),
    }
    setDemoAssets([newAsset, ...getDemoAssets()])
    return newAsset
  },
  async delete(id: string): Promise<void> {
    await delay(300)
    setDemoAssets(getDemoAssets().filter((a) => a.id !== id))
  },
  async bulkDelete(ids: string[]): Promise<void> {
    await delay(500)
    setDemoAssets(getDemoAssets().filter((a) => !ids.includes(a.id)))
  },
  async addTag(assetId: string, tag: string): Promise<Asset> {
    await delay(200)
    const assets = getDemoAssets()
    const idx = assets.findIndex((a) => a.id === assetId)
    if (idx === -1) throw new Error('素材不存在')
    if (!assets[idx].tags.includes(tag)) {
      assets[idx].tags = [...assets[idx].tags, tag]
    }
    setDemoAssets(assets)
    return assets[idx]
  },
  async removeTag(assetId: string, tag: string): Promise<Asset> {
    await delay(200)
    const assets = getDemoAssets()
    const idx = assets.findIndex((a) => a.id === assetId)
    if (idx === -1) throw new Error('素材不存在')
    assets[idx].tags = assets[idx].tags.filter((t) => t !== tag)
    setDemoAssets(assets)
    return assets[idx]
  },
  async generate(_params: Record<string, unknown>): Promise<Asset> {
    await delay(3000)
    const newAsset: Asset = {
      id: `asset-${Date.now()}`, name: 'AI生成素材', type: 'image',
      mimeType: 'image/webp', size: 3072000, url: assetUrl('demo-art/magic-girl.webp'),
      thumbnail: assetUrl('demo-art/magic-girl.webp'), width: 1672, height: 941,
      tags: ['AI生成'], usageCount: 0, createdAt: new Date().toISOString(),
    }
    setDemoAssets([newAsset, ...getDemoAssets()])
    return newAsset
  },
}

// ─── Community ───
export const communityApi = {
  async listWorks(params?: Record<string, string>): Promise<{ works: CommunityWork[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    await delay(400)
    let works = [...MOCK_COMMUNITY_WORKS]
    if (params?.workType) works = works.filter((w) => w.workType === params.workType)
    if (params?.tag) works = works.filter((w) => w.tags.includes(params.tag!))
    if (params?.search) {
      const q = params.search.toLowerCase()
      works = works.filter((w) => w.title?.toLowerCase().includes(q) || w.tags.some((t) => t.toLowerCase().includes(q)))
    }
    const limit = Number(params?.limit) || 12
    const page = Number(params?.page) || 1
    const totalPages = Math.max(1, Math.ceil(works.length / limit))
    return { works: works.slice((page - 1) * limit, page * limit), meta: { total: works.length, page, limit, totalPages } }
  },
  async getWork(id: string): Promise<CommunityWork> {
    await delay(200)
    const work = MOCK_COMMUNITY_WORKS.find((w) => w.id === id)
    if (!work) throw new Error('作品不存在')
    return work
  },
  async share(_data: Record<string, unknown>): Promise<CommunityWork> {
    await delay(500)
    return MOCK_COMMUNITY_WORKS[0]
  },
  async updateWork(id: string, data: Partial<CommunityWork>): Promise<CommunityWork> {
    await delay(300)
    const work = MOCK_COMMUNITY_WORKS.find((w) => w.id === id)
    if (!work) throw new Error('作品不存在')
    return { ...work, ...data }
  },
  async unshare(_id: string): Promise<void> {
    await delay(300)
  },
}

// ─── Payment ───
export const paymentApi = {
  async createOrder(params: { packageId?: string; amount?: number; currency?: string; method?: string }): Promise<{ orderId: string }> {
    await delay(400)
    return { orderId: `order-${Date.now()}` }
  },
  async getOrder(_orderId: string): Promise<{ orderId: string; status: string }> {
    await delay(300)
    return { orderId: `order-${Date.now()}`, status: 'completed' }
  },
}

// ─── Referral ───
export const referralApi = {
  async getCode(): Promise<{ code: string; link: string; rewards: number }> {
    await delay(200)
    return { code: 'DEMO2026', link: 'https://comicdrama.ai/r/DEMO2026', rewards: 500 }
  },
  async getStats(): Promise<{ code: string; isActive: boolean; totalInvites: number; totalRewards: number; totalEarned: number }> {
    await delay(200)
    return { code: 'DEMO2026', isActive: true, totalInvites: 12, totalRewards: 8, totalEarned: 2400 }
  },
  async getRewards(params?: { page?: number; limit?: number }): Promise<{ rewards: { id: string; sourceType: string; amount: number; createdAt: string }[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    await delay(200)
    const rewards = [
      { id: 'r-1', sourceType: 'generation', amount: 300, createdAt: '2026-05-20T10:00:00Z' },
      { id: 'r-2', sourceType: 'generation', amount: 200, createdAt: '2026-05-18T14:00:00Z' },
    ]
    return { rewards, meta: { page: params?.page || 1, limit: params?.limit || 10, total: 2, totalPages: 1 } }
  },
  async createCode(): Promise<{ code: string }> {
    await delay(300)
    return { code: 'DEMO2026' }
  },
}
