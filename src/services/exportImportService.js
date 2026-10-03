// CLOUD PHASE: Firebase Firestore backup & restore export/import helper.

import { fetchCollection, bulkSaveCollection } from "./firestoreService";

const COLLECTIONS = [
  "customers",
  "suppliers",
  "fishTypes",
  "batches",
  "sales",
  "purchases",
  "payments",
  "expenses",
  "wastageRecords",
  "employees",
  "attendanceRecords",
  "salaryRecords",
  "users",
  "dailyPackingRecords",
  "bankTransactions",
  "settings"
];

export async function exportAllData() {
  const exportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    tables: {},
  };

  for (const name of COLLECTIONS) {
    exportData.tables[name] = await fetchCollection(name);
  }

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `fish_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: Object.keys(exportData.tables).length };
}

export async function importAllData(jsonString) {
  try {
    const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;

    if (!data || !data.tables) {
      throw new Error("Invalid backup file format: missing tables data.");
    }

    for (const tableName of Object.keys(data.tables)) {
      if (COLLECTIONS.includes(tableName)) {
        const rows = data.tables[tableName];
        if (Array.isArray(rows) && rows.length > 0) {
          await bulkSaveCollection(tableName, rows);
        }
      }
    }

    return { success: true };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Failed to import data:", err);
    }
    throw err;
  }
}
