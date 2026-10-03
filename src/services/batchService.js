// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById, bulkSaveCollection } from "./firestoreService";

const COLLECTION = "batches";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.supplierId) {
    results = results.filter((b) => b.supplierId === filters.supplierId);
  }
  if (filters.fishId) {
    results = results.filter((b) => b.fishId === filters.fishId);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (b) =>
        (b.batchNumber && b.batchNumber.toLowerCase().includes(q)) ||
        (b.fishName && b.fishName.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    batchNumber: data.batchNumber || `FB-${Math.floor(1000 + Math.random() * 9000)}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    fishId: data.fishId || "",
    fishName: data.fishName || "",
    supplierId: data.supplierId || "",
    supplierName: data.supplierName || "",
    initialQtyKg: parseFloat(data.initialQtyKg) || 0,
    remaining: parseFloat(data.remaining ?? data.initialQtyKg) || 0,
    purchasePriceKg: parseFloat(data.purchasePriceKg) || 0,
    status: data.status || "active",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Batch ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Batch ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function bulkSave(batches = []) {
  return await bulkSaveCollection(COLLECTION, batches);
}

export function recalculateBatchRemaining(batch, sales = [], wastageRecords = []) {
  if (!batch) return batch;

  const bSales = sales.filter((s) => s.batchId === batch.id);
  const bWastages = wastageRecords.filter((w) => w.batchId === batch.id);

  const totalSold = bSales.reduce((acc, s) => acc + (parseFloat(s.qtyKg) || 0), 0);
  const totalWasted = bWastages.reduce((acc, w) => acc + (parseFloat(w.qtyKg) || 0), 0);

  const initial = parseFloat(batch.initialQtyKg) || 0;
  const remaining = Math.max(0, initial - totalSold - totalWasted);

  return {
    ...batch,
    remaining,
    status: remaining <= 0 ? "depleted" : "active",
  };
}
