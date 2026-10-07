// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById, bulkSaveCollection } from "./firestoreService";

const COLLECTION = "fishTypes";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.status) {
    results = results.filter((f) => f.status === filters.status);
  }
  if (filters.category) {
    results = results.filter((f) => f.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (f) =>
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.code && f.code.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    name: data.name || "",
    code: data.code || "",
    category: data.category || "Freshwater",
    currentStock: parseFloat(data.currentStock) || 0,
    unit: data.unit || "kg",
    purchasePriceKg: parseFloat(data.purchasePriceKg) || 0,
    sellingPriceKg: parseFloat(data.sellingPriceKg) || 0,
    totalPurchased: parseFloat(data.totalPurchased) || 0,
    totalSold: parseFloat(data.totalSold) || 0,
    totalWastage: parseFloat(data.totalWastage) || 0,
    status: data.status || "active",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("FishType ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("FishType ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function bulkSave(fishTypes = []) {
  return await bulkSaveCollection(COLLECTION, fishTypes);
}

export function recalculateFishTypeStock(fishType, purchases = [], sales = [], wastageRecords = []) {
  if (!fishType) return fishType;

  const typeName = (fishType.name || "").trim().toLowerCase();
  const fPurchases = purchases.filter((p) => p.fishId === fishType.id || (!p.fishId && p.fishName && p.fishName.trim().toLowerCase() === typeName));
  const fSales = sales.filter((s) => s.fishId === fishType.id || (!s.fishId && s.fishName && s.fishName.trim().toLowerCase() === typeName));
  const fWastages = wastageRecords.filter((w) => w.fishId === fishType.id || (!w.fishId && w.fishName && w.fishName.trim().toLowerCase() === typeName));

  const totalPurchased = fPurchases.reduce((acc, p) => acc + (parseFloat(p.qtyKg) || 0), 0);
  const totalSold = fSales.reduce((acc, s) => acc + (parseFloat(s.qtyKg) || 0), 0);
  const totalWastage = fWastages.reduce((acc, w) => acc + (parseFloat(w.qtyKg) || 0), 0);
  const openingStock = parseFloat(fishType.openingStock) || parseFloat(fishType.initialStock) || 0;

  const calculatedStock = openingStock + totalPurchased - totalSold - totalWastage;

  return {
    ...fishType,
    openingStock,
    initialStock: openingStock,
    totalPurchased,
    totalSold,
    totalWastage,
    currentStock: Math.max(0, calculatedStock),
  };
}
