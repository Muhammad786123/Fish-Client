// CLOUD PHASE: Firebase Firestore persistence with cloud sync.

import { fetchCollection, fetchDocById, saveDoc, deleteDocById } from "./firestoreService";

const SETTINGS_COLLECTION = "settings";
const FINANCE_DOC_ID = "finance";
const BANK_TX_COLLECTION = "bankTransactions";

export async function getBalances() {
  const settings = await fetchDocById(SETTINGS_COLLECTION, FINANCE_DOC_ID);
  return {
    cashBalance: parseFloat(settings?.cashBalance) || 0,
    bankBalance: parseFloat(settings?.bankBalance) || 0,
  };
}

export async function setBalances(cash, bank) {
  const cashVal = parseFloat(cash) || 0;
  const bankVal = parseFloat(bank) || 0;
  await saveDoc(SETTINGS_COLLECTION, FINANCE_DOC_ID, {
    cashBalance: cashVal,
    bankBalance: bankVal,
  });
  return { cashBalance: cashVal, bankBalance: bankVal };
}

export async function getBankTransactions() {
  const txs = await fetchCollection(BANK_TX_COLLECTION);
  return txs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function depositToBank(amount, notes = "") {
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) throw new Error("Amount must be greater than zero");

  const { cashBalance, bankBalance } = await getBalances();
  const newCash = Math.max(cashBalance - amt, 0);
  const newBank = bankBalance + amt;

  await setBalances(newCash, newBank);

  const newTx = {
    id: `bt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString().slice(0, 10),
    type: "Deposit",
    desc: `Cash Deposit to Bank${notes ? ` — ${notes}` : ""}`,
    amount: amt,
    notes: notes || "",
  };

  await saveDoc(BANK_TX_COLLECTION, newTx.id, newTx);
  return { newCash, newBank, newTx };
}

export function recalculateCashBankBalance(sales = [], purchases = [], payments = [], expenses = [], bankTransactions = []) {
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  // 1. Sales
  (sales || []).forEach((s) => {
    const paid = parseFloat(s.paid) || 0;
    if (paid > 0) {
      const method = (s.paymentMethod || "Cash").trim();
      if (method.toLowerCase() === "cash") {
        cashIn += paid;
      } else {
        bankIn += paid;
      }
    }
  });

  // 2. Purchases
  (purchases || []).forEach((p) => {
    const paid = parseFloat(p.paid) || 0;
    if (paid > 0) {
      const method = (p.paymentMethod || "Cash").trim();
      if (method.toLowerCase() === "cash") {
        cashOut += paid;
      } else {
        bankOut += paid;
      }
    }
  });

  // 3. Payments
  (payments || []).forEach((p) => {
    const amt = parseFloat(p.amount) || 0;
    if (amt > 0) {
      const method = (p.method || "Cash").trim();
      const type = (p.type || p.partyType || "").toLowerCase();
      if (type === "customer") {
        if (method.toLowerCase() === "cash") {
          cashIn += amt;
        } else {
          bankIn += amt;
        }
      } else if (type === "supplier") {
        if (method.toLowerCase() === "cash") {
          cashOut += amt;
        } else {
          bankOut += amt;
        }
      }
    }
  });

  // 4. Expenses
  (expenses || []).forEach((e) => {
    const amt = parseFloat(e.amount) || 0;
    if (amt > 0) {
      const method = (e.paymentMethod || "Cash").trim();
      if (method.toLowerCase() === "cash") {
        cashOut += amt;
      } else {
        bankOut += amt;
      }
    }
  });

  // 5. Bank Transactions (deposits/transfers)
  (bankTransactions || []).forEach((tx) => {
    const amt = parseFloat(tx.amount) || 0;
    if (amt > 0) {
      const type = (tx.type || "").toLowerCase();
      if (type === "deposit") {
        cashOut += amt;
        bankIn += amt;
      } else if (type === "withdrawal") {
        bankOut += amt;
        cashIn += amt;
      }
    }
  });

  return {
    cashBalance: cashIn - cashOut,
    bankBalance: bankIn - bankOut,
  };
}
