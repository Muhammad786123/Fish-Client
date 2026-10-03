/**
 * Lightweight In-Memory Stale-While-Revalidate Cache Layer for Fish ERP
 */

const cacheMap = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds TTL for background revalidation

export function getCache(collectionName) {
  const entry = cacheMap.get(collectionName);
  if (!entry) return null;
  return entry.data;
}

export function isCacheStale(collectionName, ttlMs = DEFAULT_TTL_MS) {
  const entry = cacheMap.get(collectionName);
  if (!entry) return true;
  return Date.now() - entry.timestamp > ttlMs;
}

export function setCache(collectionName, data) {
  cacheMap.set(collectionName, {
    data: Array.isArray(data) ? [...data] : data,
    timestamp: Date.now()
  });
}

export function clearCache() {
  cacheMap.clear();
}

export function updateCacheItem(collectionName, item) {
  if (!item || !item.id) return;
  const current = getCache(collectionName) || [];
  const index = current.findIndex((x) => x.id === item.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...item };
  } else {
    updated = [item, ...current];
  }
  setCache(collectionName, updated);
}

export function removeCacheItem(collectionName, id) {
  if (!id) return;
  const current = getCache(collectionName) || [];
  const updated = current.filter((x) => x.id !== id);
  setCache(collectionName, updated);
}
