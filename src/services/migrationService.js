import { db as dexieDb } from "../db/dexieDb";
import { bulkSaveCollection } from "./firestoreService";

/**
 * Migration Utility: Safely reads existing local Dexie/IndexedDB data
 * and pushes it into Firebase Firestore collections without overwriting newer records.
 */
export async function migrateLocalDataToCloud() {
  try {
    const tableNames = dexieDb.tables.map((t) => t.name);
    let migratedCount = 0;

    for (const name of tableNames) {
      if (name === "appMeta") continue;
      const rows = await dexieDb.table(name).toArray();
      if (Array.isArray(rows) && rows.length > 0) {
        await bulkSaveCollection(name, rows);
        migratedCount += rows.length;
      }
    }

    return { success: true, count: migratedCount };
  } catch (err) {
    console.error("Migration from IndexedDB to Firestore failed:", err);
    return { success: false, error: err.message };
  }
}
