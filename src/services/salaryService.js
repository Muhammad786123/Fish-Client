// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";

const COLLECTION = "salaryRecords";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.employeeId) {
    results = results.filter((s) => s.employeeId === filters.employeeId);
  }
  if (filters.month) {
    results = results.filter((s) => s.month === filters.month);
  }
  return results.sort((a, b) => (b.paidDate || "").localeCompare(a.paidDate || ""));
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `sal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    month: data.month || new Date().toISOString().slice(0, 7),
    amount: parseFloat(data.amount) || 0,
    paidDate: data.paidDate || new Date().toISOString().slice(0, 10),
    paymentMethod: data.paymentMethod || "Cash",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Salary record ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Salary record ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
