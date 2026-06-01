// ─── User ───
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
}

export interface Profile extends User {
  bio?: string;
  preferences: Preferences;
  wallet: Wallet;
  connections: Account[];
}

export interface Preferences {
  language?: string;
  timezone?: string;
  theme?: string;
  emailNotifs?: boolean;
  pushNotifs?: boolean;
}

// ─── Wallet / Credits ───
export interface Wallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  monthlyBudget: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceCny: number;
  priceUsd: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description?: string;
  createdAt: string;
}

// ─── Payment ───
export interface PaymentOrder {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  supportedCurrencies: string[];
}

// ─── Asset ───
export interface Asset {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

// ─── Project & Scene ───
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  scenes?: Scene[];
}

export interface Dialogue {
  character?: string;
  text: string;
  startAt?: number;
  duration?: number;
}

export interface Scene {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description?: string | null;
  script?: string | null;
  duration: number;
  shotType?: string | null;
  cameraAngle?: string | null;
  cameraMove?: string | null;
  transition: string | null;
  stylePreset?: string | null;

  modelId?: string | null;
  prompt?: string | null;
  negativePrompt?: string | null;
  seed?: number | null;
  modelParams?: Record<string, unknown>;
  referenceImage?: string | null;

  characterIds: string[];
  backgroundId?: string | null;
  propIds: string[];
  audioId?: string | null;
  dialogues: Dialogue[];

  assetIds: string[];
  settings?: Record<string, unknown>;

  latestResultUrl?: string | null;
  latestResultThumbnail?: string | null;
  latestJobId?: string | null;

  createdAt: string;
  updatedAt?: string;
}

export type SceneInput = Partial<Omit<Scene, 'id' | 'projectId' | 'number' | 'createdAt' | 'updatedAt'>> & {
  title: string;
};

export type SceneUpdateInput = Partial<Omit<Scene, 'id' | 'projectId' | 'number' | 'createdAt' | 'updatedAt'>>;

// ─── Generation ───
export interface GenerationJob {
  id: string;
  projectId?: string;
  sceneIds: string[];
  modelId: string;
  status: string;
  params: Record<string, unknown>;
  cost: number;
  progress: number;
  errorMessage?: string;
  workType: string;
  tags: string[];
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  results?: GenerationResult[];
}

export interface GenerationResult {
  id: string;
  sceneId?: string;
  url: string;
  thumbnail?: string;
}

// ─── Community / Gallery ───
export interface CommunityWork {
  id: string;
  userId: string;
  sourceType: string;
  sourceId: string;
  title?: string;
  description?: string;
  workType: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Model ───
export interface AIModel {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  brandColor: string;
  iconUrl?: string;
  isActive: boolean;
  isBeta: boolean;
  costFactor: number;
  maxDuration: number;
  supportedParams: Record<string, unknown>;
  adapter: string;
  sortOrder: number;
}

// ─── Auth ───
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

// ─── Account ───
export interface Account {
  provider: string;
  providerAccountId: string;
}

// ─── Image Generation ───
export interface ImageModelConfig {
  id: string;
  name: string;
  description?: string;
  provider: string;
  costCredits: number;
  sortOrder: number;
  params: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    defaultWidth: number;
    defaultHeight: number;
    supportedSizes: Array<{ label: string; width: number; height: number }>;
    supportsNegativePrompt: boolean;
    supportsSeed: boolean;
    supportsSteps: boolean;
    minSteps?: number;
    maxSteps?: number;
    defaultSteps?: number;
    supportsCfgScale: boolean;
    minCfgScale?: number;
    maxCfgScale?: number;
    defaultCfgScale?: number;
    supportsStyle: boolean;
    styleOptions?: string[];
  };
}

export interface GenerateImageResult {
  url: string;
  width?: number;
  height?: number;
  seed?: number;
  format?: string;
  metadata?: Record<string, unknown>;
}

// ─── Admin ───
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalGenerations: number;
  activeSubscriptions: number;
  avgGenerationTime: number;
  systemStatus: string;
}

export interface AdminLog {
  id: string;
  userId?: string;
  action: string;
  target?: string;
  createdAt: string;
}

export interface ReferralStats {
  code: string;
  isActive: boolean;
  totalInvites: number;
  totalRewards: number;
  totalEarned: number;
}

export interface ReferralReward {
  id: string;
  sourceType: string;
  amount: number;
  createdAt: string;
}

export interface ReferralRewardsResponse {
  rewards: ReferralReward[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreditPackageInput {
  name: string;
  credits: number;
  priceCny: number;
  priceUsd: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AIModelInput {
  key: string;
  name: string;
  description?: string;
  category: string;
  brandColor?: string;
  isActive?: boolean;
  isBeta?: boolean;
  costFactor?: number;
  maxDuration?: number;
  adapter: string;
  sortOrder?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
