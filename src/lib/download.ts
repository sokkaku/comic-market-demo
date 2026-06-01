import { toast } from 'sonner';

function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'download';
  } catch {
    return 'download';
  }
}

/**
 * Trigger a file download from a URL.
 * Handles cross-origin URLs by fetching as blob.
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  if (!url) {
    toast.error('下载链接无效');
    return;
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || getFilenameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
    toast.success('下载已开始');
  } catch {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}
