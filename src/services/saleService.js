// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchCollectionForReport, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import { filterItemsByPeriod } from "../utils/dateUtils";

const COLLECTION = "sales";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.customerId) {
    results = results.filter((s) => s.customerId === filters.customerId);
  }
  if (filters.status) {
    results = results.filter((s) => s.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (s) =>
        (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.fishName && s.fishName.toLowerCase().includes(q))
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
  const id = data.id || `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    invoiceNo: data.invoiceNo || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    customerId: data.customerId || "",
    customerName: data.customerName || "",
    fishId: data.fishId || "",
    fishName: data.fishName || "",
    qtyKg: parseFloat(data.qtyKg) || 0,
    ratePerKg: parseFloat(data.ratePerKg) || 0,
    subtotal: parseFloat(data.subtotal) || 0,
    discount: parseFloat(data.discount) || 0,
    grandTotal: parseFloat(data.grandTotal) || 0,
    paid: parseFloat(data.paid) || 0,
    due: parseFloat(data.due) || 0,
    status: data.status || (parseFloat(data.due) <= 0 ? "paid" : "partial"),
    paymentMethod: data.paymentMethod || "Cash",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Sale ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Sale ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
