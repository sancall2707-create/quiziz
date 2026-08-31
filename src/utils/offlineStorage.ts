import { OfflineProgressRecord, OfflineRecordType } from '../types';

const OFFLINE_QUEUE_KEY = 'codenusa_offline_queue_v1';
const LAST_SYNC_KEY = 'codenusa_last_sync_time';

/**
 * Register Service Worker for offline capability and caching
 */
export async function registerServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[ServiceWorker] Berhasil didaftarkan dengan scope:', registration.scope);

      // Check if active
      if (registration.installing) {
        console.log('[ServiceWorker] Status: Installing...');
      } else if (registration.waiting) {
        console.log('[ServiceWorker] Status: Installed / Waiting');
      } else if (registration.active) {
        console.log('[ServiceWorker] Status: Aktif & Siap Melayani Offline');
      }

      return true;
    } catch (error) {
      console.warn('[ServiceWorker] Gagal mendaftarkan service worker:', error);
      return false;
    }
  } else {
    console.info('[ServiceWorker] Browser tidak mendukung Service Worker');
    return false;
  }
}

/**
 * Check if Service Worker is actively controlling the page
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller);
}

/**
 * Retrieve all pending offline progress records
 */
export function getOfflineQueue(): OfflineProgressRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Gagal membaca antrean offline:', e);
    return [];
  }
}

/**
 * Save a new progress record to the offline queue
 */
export function saveToOfflineQueue(record: {
  type: OfflineRecordType;
  userId: string;
  title: string;
  subtitle: string;
  payload: {
    missionId?: string;
    stars?: number;
    score?: number;
    xpEarned?: number;
    coinsEarned?: number;
    badgeId?: string;
    projectId?: string;
    challengeId?: string;
    timestamp?: string;
  };
}): OfflineProgressRecord {
  const currentQueue = getOfflineQueue();
  const newRecord: OfflineProgressRecord = {
    id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: record.type,
    userId: record.userId,
    title: record.title,
    subtitle: record.subtitle,
    payload: {
      ...record.payload,
      timestamp: record.payload.timestamp || new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    synced: false,
    syncAttempts: 0
  };

  const updated = [newRecord, ...currentQueue];
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Gagal menyimpan ke antrean offline:', e);
  }

  return newRecord;
}

/**
 * Remove a specific record after sync
 */
export function removeOfflineRecord(id: string): void {
  const currentQueue = getOfflineQueue();
  const updated = currentQueue.filter(item => item.id !== id);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Gagal memperbarui antrean offline:', e);
  }
}

/**
 * Clear all records from offline queue
 */
export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error('Gagal mengosongkan antrean offline:', e);
  }
}

/**
 * Get the last synchronization time string
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Record last sync time
 */
export function recordLastSyncTime(): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Get approximate local storage & IndexedDB estimate
 */
export async function getStorageEstimate(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 1024 * 1024 * 50; // default 50MB
      const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
      return { usedBytes, quotaBytes, percentage };
    } catch {
      // Fallback
    }
  }

  // Basic calculation from localStorage
  let totalChars = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      totalChars += (localStorage[key]?.length || 0) + key.length;
    }
  }
  const usedBytes = totalChars * 2; // rough UTF-16 byte estimate
  const quotaBytes = 5 * 1024 * 1024; // 5MB localStorage default
  return {
    usedBytes,
    quotaBytes,
    percentage: Math.min(100, Math.round((usedBytes / quotaBytes) * 100))
  };
}
