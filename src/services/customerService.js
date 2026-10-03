// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, updateDocById, deleteDocById, bulkSaveCollection } from "./firestoreService";
import { fmt } from "../components/common/ui";

const COLLECTION = "customers";

export async function getAll(filters = {}) {
  let results = await fetchCollection(COLLECTION);

  if (filters.status) {
    results = results.filter((c) => c.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }
  return results;
}

export async function getById(id) {
  return await fetchDocById(COLLECTION, id);
}

export async function create(data) {
  const id = data.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newCustomer = {
    id,
    name: data.name || "",
    phone: data.phone || "",
    address: data.address || "",
    openingBalance: parseFloat(data.openingBalance) || 0,
    totalSales: parseFloat(data.totalSales) || 0,
    paid: parseFloat(data.paid) || 0,
    due: parseFloat(data.due) || parseFloat(data.openingBalance) || 0,
    lastPurchase: data.lastPurchase || "",
    status: data.status || "active",
    createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    ...data,
  };

  return await saveDoc(COLLECTION, id, newCustomer);
}

export async function update(id, data) {
  if (!id) throw new Error("Customer ID is required for update");
  return await updateDocById(COLLECTION, id, data);
}

export async function remove(id) {
  if (!id) throw new Error("Customer ID is required for deletion");
  return await deleteDocById(COLLECTION, id);
}

export async function bulkSave(customers = []) {
  return await bulkSaveCollection(COLLECTION, customers);
}

// ── Domain Ledger & Balance Calculation Helpers ──────────────────────────────

export function getCustomerLedger(customer, sales = [], payments = []) {
  if (!customer) return [];

  const cSales = sales.filter((s) => s.customerId === customer.id);
  const cPayments = payments.filter((p) => p.type === "customer" && p.partyId === customer.id);

  const entries = [];
  const openingBal = parseFloat(customer.openingBalance) || 0;

  if (openingBal !== 0) {
    entries.push({
      id: `ob_${customer.id}`,
      date: customer.createdAt || "2026-01-01",
      desc: "Opening Balance",
      debit: openingBal > 0 ? openingBal : 0,
      credit: openingBal < 0 ? Math.abs(openingBal) : 0,
      type: "opening",
      refNo: "OB",
    });
  }

  cSales.forEach((s) => {
    entries.push({
      id: s.id,
      date: s.date || "",
      desc: `Sale ${s.invoiceNo || s.id}`,
      debit: parseFloat(s.grandTotal || 0),
      credit: 0,
      type: "sale",
      refNo: s.invoiceNo,
      notes: `${s.fishName || "Fish"} (${s.qtyKg || 0} KG)`,
    });
  });

  cPayments.forEach((p) => {
    entries.push({
      id: p.id,
      date: p.date || "",
      desc: `Payment (${p.method || "Cash"})`,
      debit: 0,
      credit: parseFloat(p.amount || 0),
      type: "payment",
      refNo: p.refNo || "PAY",
      notes: p.notes || "",
    });
  });

  entries.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  let running = 0;
  return entries.map((entry) => {
    running += entry.debit - entry.credit;
    return {
      ...entry,
      balance: running,
    };
  });
}

export function recalculateCustomerBalance(customer, sales = [], payments = []) {
  if (!customer) return customer;

  const cSales = sales.filter((s) => s.customerId === customer.id);
  const cPayments = payments.filter((p) => p.type === "customer" && p.partyId === customer.id);

  const totalSales = cSales.reduce((acc, s) => acc + (parseFloat(s.grandTotal) || 0), 0);

  const directSalesPaid = cSales.reduce((acc, s) => acc + (parseFloat(s.paid) || 0), 0);
  const separatePayments = cPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const totalPaid = directSalesPaid + separatePayments;

  const openingBal = parseFloat(customer.openingBalance) || 0;
  const currentDue = openingBal + totalSales - totalPaid;

  const sortedSales = [...cSales].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const lastPurchase = sortedSales[0]?.date || customer.lastPurchase || "";

  return {
    ...customer,
    totalSales,
    paid: totalPaid,
    due: currentDue,
    lastPurchase,
  };
}
