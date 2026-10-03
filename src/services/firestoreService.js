import { db } from "../firebase/firebaseConfig";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getCache, isCacheStale, setCache, updateCacheItem, removeCacheItem } from "./cache";
import { toNormalizedDateStr } from "../utils/dateUtils";

/**
 * Promise Timeout Helper: Prevents network/Firestore hangs from locking the app UI
 */
function withTimeout(promise, ms = 3000, fallback = null) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallback);
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }).catch((err) => {
      clearTimeout(timeoutId);
      return fallback;
    }),
    timeoutPromise
  ]);
}

/**
 * Common Firestore CRUD Helpers with Stale-While-Revalidate Caching
 */

export async function fetchCollection(collectionName) {
  const cached = getCache(collectionName);

  // If cache exists and is fresh, return immediately from cache
  if (cached && !isCacheStale(collectionName)) {
    return cached;
  }

  // Background fetch to update cache from Firestore
  const fetchPromise = getDocs(collection(db, collectionName))
    .then((snapshot) => {
      const freshData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCache(collectionName, freshData);
      return freshData;
    })
    .catch((err) => {
      if (import.meta.env.DEV) {
        console.error(`Error background fetching data:`, err);
      }
      return cached || [];
    });

  // If stale cache exists, return stale data instantly while background fetch runs
  if (cached) {
    fetchPromise; // run in background
    return cached;
  }

  // Initial load: wait for first fetch with timeout fallback
  const results = await withTimeout(fetchPromise, 3000, []);
  return results || [];
}

/**
 * Dedicated Uncapped Report Query Helper
 * Reports MUST NEVER be capped by query limits or stale cache shortcuts.
 * This helper fetches the complete, unrestricted collection for reporting calculations.
 */
export async function fetchCollectionForReport(collectionName, startDate = "", endDate = "", dateKey = "date") {
  try {
    const snap = await getDocs(collection(db, collectionName));
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fallback: If Firestore returned empty array or offline/demo mode, use cache fallback
    if (!items || items.length === 0) {
      const cached = getCache(collectionName);
      if (cached && cached.length > 0) {
        items = cached;
      }
    }

    if (startDate && endDate) {
      items = items.filter((item) => {
        const rawDate = item[dateKey];
        if (!rawDate) return false;
        const itemDateStr = toNormalizedDateStr(rawDate);
        if (!itemDateStr) return false;
        return itemDateStr >= startDate && itemDateStr <= endDate;
      });
    }

    return items.sort((a, b) => (toNormalizedDateStr(b[dateKey]) || "").localeCompare(toNormalizedDateStr(a[dateKey]) || ""));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error in fetchCollectionForReport for ${collectionName}:`, err);
    }
    const cached = getCache(collectionName) || [];
    if (startDate && endDate) {
      return cached.filter((item) => {
        const rawDate = item[dateKey];
        if (!rawDate) return false;
        const itemDateStr = toNormalizedDateStr(rawDate);
        if (!itemDateStr) return false;
        return itemDateStr >= startDate && itemDateStr <= endDate;
      }).sort((a, b) => (toNormalizedDateStr(b[dateKey]) || "").localeCompare(toNormalizedDateStr(a[dateKey]) || ""));
    }
    return cached;
  }
}

export async function fetchDocById(collectionName, id) {
  if (!id) return null;
  const cachedCollection = getCache(collectionName);
  if (cachedCollection) {
    const found = cachedCollection.find((item) => item.id === id);
    if (found) return found;
  }

  try {
    const fetchPromise = getDoc(doc(db, collectionName, id)).then((snap) =>
      snap.exists() ? { id: snap.id, ...snap.data() } : null
    );
    return await withTimeout(fetchPromise, 3000, null);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error fetching record:`, err);
    }
    return null;
  }
}

export async function saveDoc(collectionName, id, data) {
  const record = { id, ...data };
  // Optimistic cache update
  updateCacheItem(collectionName, record);

  try {
    const docRef = doc(db, collectionName, id);
    const savePromise = setDoc(docRef, data, { merge: true }).then(() => record);
    return await withTimeout(savePromise, 4000, record);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error saving record:`, err);
    }
    return record;
  }
}

export async function updateDocById(collectionName, id, data) {
  const record = { id, ...data };
  // Optimistic cache update
  updateCacheItem(collectionName, record);

  try {
    const docRef = doc(db, collectionName, id);
    const updatePromise = updateDoc(docRef, data).then(() => record);
    return await withTimeout(updatePromise, 4000, record);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error updating record:`, err);
    }
    return record;
  }
}

export async function deleteDocById(collectionName, id) {
  if (!id) return { id };
  // Optimistic cache removal
  removeCacheItem(collectionName, id);

  try {
    const docRef = doc(db, collectionName, id);
    const delPromise = deleteDoc(docRef).then(() => ({ id }));
    return await withTimeout(delPromise, 4000, { id });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error deleting record:`, err);
    }
    return { id };
  }
}

export async function bulkSaveCollection(collectionName, items = []) {
  if (!items || !items.length) return;
  // Optimistic cache update
  items.forEach((item) => updateCacheItem(collectionName, item));

  try {
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;

    for (const item of items) {
      if (!item.id) continue;
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
      count++;
      if (count % 400 === 0) {
        batches.push(batch.commit());
        batch = writeBatch(db);
      }
    }
    if (count % 400 !== 0) {
      batches.push(batch.commit());
    }
    await withTimeout(Promise.all(batches), 5000, null);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error(`Error bulk saving records:`, err);
    }
  }
}
