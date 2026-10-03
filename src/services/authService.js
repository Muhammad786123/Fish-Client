// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById } from "./firestoreService";
import { clearCache } from "./cache";
import bcrypt from "bcryptjs";

const COLLECTION = "users";
const AUTH_STORAGE_KEY = "fish_erp_auth";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const failedAttemptsMap = {};

export async function ensureDefaultSuperAdmin() {
  try {
    const allUsers = await fetchCollection(COLLECTION);
    if (!allUsers || allUsers.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const defaultAdmin = {
        id: "u1",
        name: "Super Admin",
        username: "admin",
        email: "admin@royalion.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "active",
        lastLogin: new Date().toISOString(),
      };
      await saveDoc(COLLECTION, defaultAdmin.id, defaultAdmin);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Error initializing Super Admin:", err);
    }
  }
}

export async function login(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) {
    return { success: false, message: "Please enter both username and password." };
  }

  const query = usernameOrEmail.trim().toLowerCase();
  const now = Date.now();

  const attemptRecord = failedAttemptsMap[query];
  if (attemptRecord && attemptRecord.lockUntil && now < attemptRecord.lockUntil) {
    const minutesLeft = Math.ceil((attemptRecord.lockUntil - now) / 60000);
    return {
      success: false,
      message: `Too many failed login attempts. Account temporarily locked for ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  let allUsers = await fetchCollection(COLLECTION);
  if (!allUsers || allUsers.length === 0) {
    await ensureDefaultSuperAdmin();
    allUsers = await fetchCollection(COLLECTION);
  }

  const user = allUsers.find(
    (u) =>
      (u.username && u.username.toLowerCase() === query) ||
      (u.email && u.email.toLowerCase() === query)
  );

  if (user && (user.status === "inactive" || user.status === "disabled")) {
    return { success: false, message: "This account has been disabled. Contact your administrator." };
  }

  let isMatch = false;
  if (user && user.password) {
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      if (isMatch) {
        const hashed = await bcrypt.hash(password, 10);
        await updateDocById(COLLECTION, user.id, { password: hashed });
      }
    }
  }

  if (!user || !isMatch) {
    const currentCount = (attemptRecord?.count || 0) + 1;
    let lockUntil = null;
    if (currentCount >= MAX_FAILED_ATTEMPTS) {
      lockUntil = now + LOCKOUT_DURATION_MS;
    }
    failedAttemptsMap[query] = { count: currentCount, lockUntil };

    if (lockUntil) {
      return {
        success: false,
        message: "Too many failed login attempts. Account temporarily locked for 5 minutes.",
      };
    }

    return { success: false, message: "Invalid username or password." };
  }

  delete failedAttemptsMap[query];

  const lastLogin = new Date().toISOString().replace("T", " ").slice(0, 16);
  const updatedUser = await updateDocById(COLLECTION, user.id, { lastLogin });

  const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = now + SESSION_DURATION_MS;

  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ userId: user.id, token: sessionToken, expiresAt })
    );
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("Failed to write session token:", e);
    }
  }

  return { success: true, user: updatedUser };
}

export async function logout() {
  try {
    clearCache();
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("Failed to clear session token:", e);
    }
  }
  return { success: true };
}

export async function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.userId) return null;

    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await logout();
      return null;
    }

    const user = await fetchDocById(COLLECTION, parsed.userId);
    if (!user || user.status === "inactive" || user.status === "disabled") {
      await logout();
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
}
