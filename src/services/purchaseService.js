// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchCollectionForReport, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import { filterItemsByPeriod } from "../utils/dateUtils";

const COLLECTION = "purchases";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.supplierId) {
    results = results.filter((p) => p.supplierId === filters.supplierId);
  }
  if (filters.status) {
    results = results.filter((p) => p.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (p) =>
        (p.purchaseNo && p.purchaseNo.toLowerCase().includes(q)) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
        (p.fishName && p.fishName.toLowerCase().includes(q))
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
  const id = data.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    purchaseNo: data.purchaseNo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    supplierId: data.supplierId || "",
    supplierName: data.supplierName || "",
    fishId: data.fishId || "",
    fishName: data.fishName || "",
    qtyKg: parseFloat(data.qtyKg) || 0,
    ratePerKg: parseFloat(data.ratePerKg) || 0,
    totalCost: parseFloat(data.totalCost) || 0,
    paid: parseFloat(data.paid) || 0,
    remaining: parseFloat(data.remaining) || 0,
    status: data.status || (parseFloat(data.remaining) <= 0 ? "paid" : "pending"),
    paymentMethod: data.paymentMethod || "Cash",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Purchase ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Purchase ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
