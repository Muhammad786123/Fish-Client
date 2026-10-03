// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";

const COLLECTION = "dailyPackingRecords";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.date) {
    results = results.filter((d) => d.date === filters.date);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter((d) => d.createdBy && d.createdBy.toLowerCase().includes(q));
  }
  return results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `dp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    date: data.date || new Date().toISOString().slice(0, 10),
    createdBy: data.createdBy || "Admin User",
    sections: data.sections || [],
    ...data,
  };
  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("Daily packing record ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Daily packing record ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}
