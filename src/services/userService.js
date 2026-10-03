// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById } from "./firestoreService";
import bcrypt from "bcryptjs";

const COLLECTION = "users";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);
  if (filters.role) {
    results = results.filter((u) => u.role === filters.role);
  }
  if (filters.status) {
    results = results.filter((u) => u.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const plainPassword = data.password || "";
  if (plainPassword && plainPassword.length < 8 && !plainPassword.startsWith("$2a$") && !plainPassword.startsWith("$2b$")) {
    throw new Error("Password must be at least 8 characters long.");
  }

  let hashedPassword = plainPassword;
  if (plainPassword && !plainPassword.startsWith("$2a$") && !plainPassword.startsWith("$2b$")) {
    hashedPassword = await bcrypt.hash(plainPassword, 10);
  }

  const id = data.id || `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newItem = {
    id,
    name: data.name || "",
    username: data.username || "",
    email: data.email || "",
    role: data.role || "MANAGER",
    status: data.status || "active",
    lastLogin: data.lastLogin || "",
    ...data,
    password: hashedPassword,
  };

  return await saveDoc(COLLECTION, id, newItem);
}

export async function update(id, data) {
  if (!id) throw new Error("User ID is required for update");
  const existing = await fetchDocById(COLLECTION, id);
  if (!existing) throw new Error(`User with ID ${id} not found`);

  const updatedData = { ...data };

  if (data.password) {
    const plainPassword = data.password.trim();
    if (plainPassword && !plainPassword.startsWith("$2a$") && !plainPassword.startsWith("$2b$")) {
      if (plainPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }
      updatedData.password = await bcrypt.hash(plainPassword, 10);
    }
  } else {
    delete updatedData.password;
  }

  return await updateDocById(COLLECTION, id, updatedData);
}

export async function remove(id) {
  if (!id) throw new Error("User ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (!userId) throw new Error("User ID is required.");
  if (!currentPassword || !newPassword) throw new Error("Current and new passwords are required.");

  if (newPassword.trim().length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const user = await getById(userId);
  if (!user) throw new Error("User not found.");

  let isMatch = false;
  if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
    isMatch = await bcrypt.compare(currentPassword, user.password);
  } else {
    isMatch = user.password === currentPassword;
  }

  if (!isMatch) {
    throw new Error("Incorrect current password.");
  }

  const newHash = await bcrypt.hash(newPassword.trim(), 10);
  return await update(userId, { password: newHash });
}
