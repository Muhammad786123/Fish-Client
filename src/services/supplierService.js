// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById, bulkSaveCollection } from "./firestoreService";
import { fmt } from "../components/common/ui";

const COLLECTION = "suppliers";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);

  if (filters.status) {
    results = results.filter((s) => s.status === filters.status);
  }
  if (filters.supplierType) {
    results = results.filter((s) => s.supplierType === filters.supplierType);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSupplier = {
    id,
    name: data.name || "",
    supplierType: data.supplierType || "Fish",
    phone: data.phone || "",
    address: data.address || "",
    openingBalance: parseFloat(data.openingBalance) || 0,
    totalPurchases: parseFloat(data.totalPurchases) || 0,
    paid: parseFloat(data.paid) || 0,
    payable: parseFloat(data.payable) || parseFloat(data.openingBalance) || 0,
    lastPurchase: data.lastPurchase || "",
    status: data.status || "active",
    createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    ...data,
  };

  return await saveDoc(COLLECTION, id, newSupplier);
}

export async function update(id, data) {
  if (!id) throw new Error("Supplier ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Supplier ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function bulkSave(suppliers = []) {
  return await bulkSaveCollection(COLLECTION, suppliers);
}

// ── Domain Ledger & Balance Calculation Helpers ──────────────────────────────

export function getSupplierLedger(supplier, purchases = [], payments = []) {
  if (!supplier) return [];

  const sPurchases = purchases.filter((p) => p.supplierId === supplier.id);
  const sPayments = payments.filter((p) => p.type === "supplier" && p.partyId === supplier.id);

  const entries = [];
  const openingBal = parseFloat(supplier.openingBalance) || 0;

  if (openingBal !== 0) {
    entries.push({
      id: `ob_${supplier.id}`,
      date: supplier.createdAt || "2026-01-01",
      desc: "Opening Balance",
      credit: openingBal > 0 ? openingBal : 0,
      debit: openingBal < 0 ? Math.abs(openingBal) : 0,
      type: "opening",
      refNo: "OB",
    });
  }

  sPurchases.forEach((p) => {
    entries.push({
      id: p.id,
      date: p.date || "",
      desc: `Purchase ${p.purchaseNo || p.id}`,
      credit: parseFloat(p.totalCost || 0),
      debit: 0,
      type: "purchase",
      refNo: p.purchaseNo,
      notes: `${p.fishName || "Fish"} (${p.qtyKg || 0} KG)`,
    });
  });

  sPayments.forEach((p) => {
    entries.push({
      id: p.id,
      date: p.date || "",
      desc: `Payment (${p.method || "Cash"})`,
      credit: 0,
      debit: parseFloat(p.amount || 0),
      type: "payment",
      refNo: p.refNo || "PAY",
      notes: p.notes || "",
    });
  });

  entries.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  let running = 0;
  return entries.map((entry) => {
    running += entry.credit - entry.debit;
    return {
      ...entry,
      balance: running,
    };
  });
}

export function recalculateSupplierBalance(supplier, purchases = [], payments = []) {
  if (!supplier) return supplier;

  const sPurchases = purchases.filter((p) => p.supplierId === supplier.id);
  const sPayments = payments.filter((p) => p.type === "supplier" && p.partyId === supplier.id);

  const totalPurchases = sPurchases.reduce((acc, p) => acc + (parseFloat(p.totalCost) || 0), 0);

  const directPurchasesPaid = sPurchases.reduce((acc, p) => acc + (parseFloat(p.paid) || 0), 0);
  const separatePayments = sPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const totalPaid = directPurchasesPaid + separatePayments;

  const openingBal = parseFloat(supplier.openingBalance) || 0;
  const currentPayable = openingBal + totalPurchases - totalPaid;

  const sortedPurchases = [...sPurchases].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const lastPurchase = sortedPurchases[0]?.date || supplier.lastPurchase || "";

  return {
    ...supplier,
    totalPurchases,
    paid: totalPaid,
    payable: currentPayable,
    lastPurchase,
  };
}
