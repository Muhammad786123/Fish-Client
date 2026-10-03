// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchCollectionForReport, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import { filterItemsByPeriod } from "../utils/dateUtils";

const COLLECTION = "expenses";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.category) {
    results = results.filter((e) => e.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (e) =>
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
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
  const id = data.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    date: data.date || new Date().toISOString().slice(0, 10),
    category: data.category || "General",
    description: data.description || "",
    amount: parseFloat(data.amount) || 0,
    paidBy: data.paidBy || "",
    paymentMethod: data.paymentMethod || "Cash",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Expense ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Expense ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
