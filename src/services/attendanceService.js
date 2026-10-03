// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";

const COLLECTION = "attendanceRecords";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.employeeId) {
    results = results.filter((a) => a.employeeId === filters.employeeId);
  }
  if (filters.date) {
    results = results.filter((a) => a.date === filters.date);
  }
  return results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    date: data.date || new Date().toISOString().slice(0, 10),
    status: data.status || "present",
    notes: data.notes || "",
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Attendance record ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Attendance record ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function markAttendanceBatch(items = []) {
  const saved = [];
  for (const item of items) {
    const res = await create(item);
    saved.push(res);
  }
  return saved;
}
