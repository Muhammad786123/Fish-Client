// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchCollectionForReport, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import { filterItemsByPeriod } from "../utils/dateUtils";

const COLLECTION = "wastageRecords";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.fishId) {
    results = results.filter((w) => w.fishId === filters.fishId);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (w) =>
        (w.fishName && w.fishName.toLowerCase().includes(q)) ||
        (w.reason && w.reason.toLowerCase().includes(q))
    );
  }
  return results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getAllForReport(startDate = "", endDate = "", fallbackItems = []) {
  let items = await fetchCollectionForReport(COLLECTION, startDate, endDate, "date");
  if ((!items || items.length === 0) && fallbackItems && fallbackItems.length > 0) {
    items = filterItemsByPeriod(fallbackItems, "custom", startDate, endDate, "date");
  }
  return items;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    date: data.date || new Date().toISOString().slice(0, 10),
    fishId: data.fishId || null,
    fishName: data.fishName || "",
    qtyKg: parseFloat(data.qtyKg) || 0,
    pricePerKg: parseFloat(data.pricePerKg) || 0,
    costPerKg: parseFloat(data.costPerKg ?? data.pricePerKg) || 0,
    reason: data.reason || "Spoilage",
    totalLoss: parseFloat(data.totalLoss) || 0,
    transportCost: parseFloat(data.transportCost) || 0,
    recordedBy: data.recordedBy || "Admin User",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Wastage record ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Wastage record ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
