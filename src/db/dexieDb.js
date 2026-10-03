import Dexie from "dexie";
import bcrypt from "bcryptjs";

/**
 * Dexie (IndexedDB) Database Configuration for Fish ERP
 * 
 * FUTURE SCHEMA MIGRATIONS GUIDE:
 * When modifying schema or adding tables in future versions:
 * 
 * 1. Increment version: db.version(2).stores({ ... })
 * 2. Add new fields/indexes or new tables.
 * 3. If transforming existing data structure, use an upgrade function:
 *    db.version(2).stores({
 *      customers: 'id, name, phone, status, createdAt, email'
 *    }).upgrade(tx => {
 *      return tx.table('customers').toCollection().modify(customer => {
 *        customer.email = customer.email || '';
 *      });
 *    });
 * 
 * CRITICAL: Never modify existing version definitions after release. Always define a new .version(N).
 */

export const db = new Dexie("FishERPDatabase");

db.version(1).stores({
  customers: "id, name, phone, status, createdAt",
  suppliers: "id, name, phone, supplierType, status, createdAt",
  fishTypes: "id, name, code, category, status",
  batches: "id, batchNumber, fishId, supplierId, date",
  sales: "id, invoiceNo, customerId, fishId, date, status, paymentMethod",
  purchases: "id, purchaseNo, supplierId, fishId, date, paymentMethod",
  payments: "id, refNo, type, partyId, date, method",
  expenses: "id, category, date, paymentMethod",
  wastageRecords: "id, fishId, date, reason",
  employees: "id, name, role, department, status",
  attendanceRecords: "id, employeeId, date, status",
  salaryRecords: "id, employeeId, month, paidDate",
  users: "id, username, email, role, status",
  dailyPackingRecords: "id, date, batchId, fishTypeId",
  bankTransactions: "id, date, type",
  appMeta: "key",
});

db.version(2).stores({
  customers: "id, name, phone, status, createdAt",
  suppliers: "id, name, phone, supplierType, status, createdAt",
  fishTypes: "id, name, code, category, status",
  batches: "id, batchNumber, fishId, supplierId, date",
  sales: "id, invoiceNo, customerId, fishId, date, status, paymentMethod",
  purchases: "id, purchaseNo, supplierId, fishId, date, paymentMethod",
  payments: "id, refNo, type, partyId, date, method",
  expenses: "id, category, date, paymentMethod",
  wastageRecords: "id, fishId, date, reason",
  employees: "id, name, role, department, status",
  attendanceRecords: "id, employeeId, date, status",
  salaryRecords: "id, employeeId, month, paidDate",
  users: "id, username, email, role, status",
  dailyPackingRecords: "id, date, batchId, fishTypeId",
  bankTransactions: "id, date, type",
  appMeta: "key",
  localBackups: "id, date, timestamp, deviceId",
});

/**
 * Ensures default Super Admin user exists and performs one-time cleanup of legacy dummy data.
 * Real operational data added by users will be preserved.
 */
export async function seedDatabaseIfNeeded() {
  try {
    const userCount = await db.users.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.users.add({
        id: "u1",
        name: "Super Admin",
        username: "admin",
        email: "admin@royalion.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "active",
        lastLogin: new Date().toISOString(),
      });
    } else {
      // Migrate legacy plain-text user passwords to bcrypt hashes
      const allUsers = await db.users.toArray();
      for (const u of allUsers) {
        if (u.password && !u.password.startsWith("$2a$") && !u.password.startsWith("$2b$")) {
          const newHash = await bcrypt.hash(u.password, 10);
          await db.users.update(u.id, { password: newHash });
        }
      }
    }

    // One-time cleanup of legacy seeded mock data to ensure only real user data is displayed
    const dummyDataCleaned = await db.appMeta.get("dummyDataCleaned_v2");
    if (!dummyDataCleaned || dummyDataCleaned.value !== "true") {
      await Promise.all([
        db.customers.clear(),
        db.suppliers.clear(),
        db.fishTypes.clear(),
        db.batches.clear(),
        db.sales.clear(),
        db.purchases.clear(),
        db.payments.clear(),
        db.expenses.clear(),
        db.wastageRecords.clear(),
        db.employees.clear(),
        db.attendanceRecords.clear(),
        db.salaryRecords.clear(),
        db.dailyPackingRecords.clear(),
        db.bankTransactions.clear()
      ]);
      await db.appMeta.put({ key: "cashBalance", value: 0 });
      await db.appMeta.put({ key: "bankBalance", value: 0 });
      await db.appMeta.put({ key: "dummyDataCleaned_v2", value: "true" });
    }

    const cashMeta = await db.appMeta.get("cashBalance");
    if (!cashMeta) {
      await db.appMeta.put({ key: "cashBalance", value: 0 });
    }

    const bankMeta = await db.appMeta.get("bankBalance");
    if (!bankMeta) {
      await db.appMeta.put({ key: "bankBalance", value: 0 });
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error("Error initializing local database:", err);
    }
  }
}

