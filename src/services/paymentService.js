// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchCollectionForReport, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import { filterItemsByPeriod } from "../utils/dateUtils";

const COLLECTION = "payments";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.type) {
    results = results.filter((p) => p.type === filters.type);
  }
  if (filters.partyId) {
    results = results.filter((p) => p.partyId === filters.partyId);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (p) =>
        (p.partyName && p.partyName.toLowerCase().includes(q)) ||
        (p.refNo && p.refNo.toLowerCase().includes(q))
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
  const id = data.id || `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    type: data.type || "customer",
    partyId: data.partyId || "",
    partyName: data.partyName || "",
    amount: parseFloat(data.amount) || 0,
    date: data.date || new Date().toISOString().slice(0, 10),
    method: data.method || "Cash",
    refNo: data.refNo || "",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Payment ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Payment ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
