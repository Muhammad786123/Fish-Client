// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";

const COLLECTION = "employees";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.status) {
    results = results.filter((e) => e.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.phone && e.phone.includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    name: data.name || "",
    role: data.role || "Worker",
    department: data.department || "Operations",
    phone: data.phone || "",
    salary: parseFloat(data.salary) || 0,
    status: data.status || "active",
    joinDate: data.joinDate || new Date().toISOString().slice(0, 10),
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Employee ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Employee ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
