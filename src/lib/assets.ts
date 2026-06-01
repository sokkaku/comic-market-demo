/**
 * 将 public 目录资源转换为当前部署基路径下的 URL，兼容 GitHub Pages 子路径部署。
 */
export function assetUrl(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }

  const baseUrl = import.meta.env.BASE_URL === './' ? '/' : import.meta.env.BASE_URL
  return `${baseUrl}${path.replace(/^\/+/, '')}`
}
