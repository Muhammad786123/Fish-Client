// LOCAL-FIRST BACKUP SYSTEM FOR FISH ERP
// Completely removes Cloud Storage dependencies to run 100% free on Firebase Spark plan.

import { db } from "../db/dexieDb";
import { fetchCollection, saveDoc, deleteDocById } from "./firestoreService";

import * as customerService from "./customerService";
import * as supplierService from "./supplierService";
import * as fishTypeService from "./fishTypeService";
import * as batchService from "./batchService";
import * as saleService from "./saleService";
import * as purchaseService from "./purchaseService";
import * as paymentService from "./paymentService";
import * as expenseService from "./expenseService";
import * as wastageService from "./wastageService";
import * as employeeService from "./employeeService";
import * as attendanceService from "./attendanceService";
import * as salaryService from "./salaryService";
import * as userService from "./userService";
import * as dailyPackingService from "./dailyPackingService";
import * as financeService from "./financeService";

const LOGS_COLLECTION = "backupLogs";
const MAX_RETENTION_COUNT = 30;

/**
 * Returns a persistent unique identifier for the current browser/device.
 */
export function getDeviceId() {
  let devId = localStorage.getItem("fish_erp_device_id");
  if (!devId) {
    devId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("fish_erp_device_id", devId);
  }
  return devId;
}

/**
 * Creates a full system JSON backup, saves it locally in Dexie (IndexedDB),
 * records cloud metadata in Firestore backupLogs, and auto-downloads a safety copy.
 */
export async function runBackup(autoDownload = true) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const deviceId = getDeviceId();

  // Fetch all collections in parallel
  const [
    customers,
    suppliers,
    fishTypes,
    batches,
    sales,
    purchases,
    payments,
    expenses,
    wastageRecords,
    employees,
    attendanceRecords,
    salaryRecords,
    rawUsers,
    dailyPackingRecords,
    balances,
    bankTransactions,
  ] = await Promise.all([
    customerService.getAll().catch(() => []),
    supplierService.getAll().catch(() => []),
    fishTypeService.getAll().catch(() => []),
    batchService.getAll().catch(() => []),
    saleService.getAll().catch(() => []),
    purchaseService.getAll().catch(() => []),
    paymentService.getAll().catch(() => []),
    expenseService.getAll().catch(() => []),
    wastageService.getAll().catch(() => []),
    employeeService.getAll().catch(() => []),
    attendanceService.getAll().catch(() => []),
    salaryService.getAll().catch(() => []),
    userService.getAll().catch(() => []),
    dailyPackingService.getAll().catch(() => []),
    financeService.getBalances().catch(() => ({ cashBalance: 0, bankBalance: 0 })),
    financeService.getBankTransactions().catch(() => []),
  ]);

  // CRITICAL SECURITY REQUIREMENT: Strip password hashes out before bundling
  const sanitizedUsers = (rawUsers || []).map((u) => {
    const { password, ...safeUser } = u;
    return safeUser;
  });

  const recordCounts = {
    customers: customers.length,
    suppliers: suppliers.length,
    fishTypes: fishTypes.length,
    batches: batches.length,
    sales: sales.length,
    purchases: purchases.length,
    payments: payments.length,
    expenses: expenses.length,
    wastageRecords: wastageRecords.length,
    employees: employees.length,
    attendanceRecords: attendanceRecords.length,
    salaryRecords: salaryRecords.length,
    users: sanitizedUsers.length,
    dailyPackingRecords: dailyPackingRecords.length,
    bankTransactions: bankTransactions.length,
  };

  const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

  const backupPayload = {
    version: "1.0",
    appName: "Fish ERP (Royal N Trading System)",
    date: todayStr,
    timestamp: nowIso,
    deviceId,
    totalRecords,
    recordCounts,
    data: {
      customers,
      suppliers,
      fishTypes,
      batches,
      sales,
      purchases,
      payments,
      expenses,
      wastageRecords,
      employees,
      attendanceRecords,
      salaryRecords,
      users: sanitizedUsers,
      dailyPackingRecords,
      balances,
      bankTransactions,
    },
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blobSize = new Blob([jsonStr]).size;
  const fileSizeStr = blobSize > 1024 * 1024
    ? `${(blobSize / (1024 * 1024)).toFixed(2)} MB`
    : `${(blobSize / 1024).toFixed(1)} KB`;

  const logId = `bk_${Date.now()}`;

  // 1. Save full backup payload locally in Dexie IndexedDB
  try {
    await db.localBackups.put({
      id: logId,
      date: todayStr,
      timestamp: nowIso,
      deviceId,
      payload: jsonStr,
      recordCounts,
      fileSize: fileSizeStr,
      sizeBytes: blobSize,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Failed to save local backup:", err);
    }
  }

  // 2. Save metadata entry in Firestore backupLogs collection
  const logDoc = {
    id: logId,
    date: todayStr,
    timestamp: nowIso,
    status: "success",
    fileSize: fileSizeStr,
    totalRecords,
    recordCounts,
    deviceId,
  };

  await saveDoc(LOGS_COLLECTION, logId, logDoc);

  // 3. Auto-download safety copy to local Downloads folder
  if (autoDownload) {
    try {
      downloadJsonFile(jsonStr, `fish_erp_backup_${todayStr}.json`);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("Auto-download notice:", e);
      }
    }
  }

  // 4. Cleanup old backups (keep last 30)
  try {
    await cleanupOldBackups();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Backup retention cleanup warning:", err);
    }
  }

  return logDoc;
}

/**
 * Checks if a backup has already run today; if not, triggers runBackup() automatically.
 */
export async function checkAndRunDailyBackup() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const logs = await fetchCollection(LOGS_COLLECTION).catch(() => []);

  const existingToday = logs.find(
    (l) => l.date === todayStr && l.status === "success"
  );

  if (existingToday) {
    return { ran: false, reason: "Backup already executed for today", backup: existingToday };
  }

  const newBackup = await runBackup(true);
  return { ran: true, backup: newBackup };
}

/**
 * Fetches all past backup logs sorted by timestamp descending.
 */
export async function getBackupLogs() {
  const logs = await fetchCollection(LOGS_COLLECTION).catch(() => []);
  return logs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
}

/**
 * Checks if a backup record is available in local Dexie IndexedDB on this browser.
 */
export async function isLocalBackupAvailable(logId) {
  if (!logId) return false;
  try {
    const record = await db.localBackups.get(logId);
    return Boolean(record && record.payload);
  } catch (e) {
    return false;
  }
}

/**
 * Downloads a backup file from local Dexie storage.
 */
export async function downloadLocalBackup(logId) {
  if (!logId) return false;
  try {
    const record = await db.localBackups.get(logId);
    if (!record || !record.payload) {
      return false;
    }
    downloadJsonFile(record.payload, `fish_erp_backup_${record.date || "file"}.json`);
    return true;
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("Error fetching local backup for download:", e);
    }
    return false;
  }
}

/**
 * Cleans up Dexie local backups and Firestore backupLogs beyond retention limit (30 max).
 */
async function cleanupOldBackups() {
  // 1. Dexie local cleanup
  try {
    const localRecords = await db.localBackups.toArray();
    if (localRecords.length > MAX_RETENTION_COUNT) {
      localRecords.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      const toDeleteLocal = localRecords.slice(MAX_RETENTION_COUNT);
      for (const item of toDeleteLocal) {
        await db.localBackups.delete(item.id);
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("Local cleanup warning:", e);
    }
  }

  // 2. Firestore log metadata cleanup
  try {
    const logs = await fetchCollection(LOGS_COLLECTION).catch(() => []);
    if (logs.length > MAX_RETENTION_COUNT) {
      const sortedLogs = [...logs].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      const toDeleteLogs = sortedLogs.slice(MAX_RETENTION_COUNT);
      for (const item of toDeleteLogs) {
        if (item.id) {
          await deleteDocById(LOGS_COLLECTION, item.id).catch(() => {});
        }
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("Backup cleanup warning:", e);
    }
  }
}

/**
 * Helper to trigger browser JSON file download using Blob + ObjectURL.
 */
function downloadJsonFile(jsonString, fileName) {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
