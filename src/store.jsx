import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from "react";
import { hasPermission, normalizeRole } from "./constants/permissions";

import * as customerService from "./services/customerService";
import * as supplierService from "./services/supplierService";
import * as fishTypeService from "./services/fishTypeService";
import * as batchService from "./services/batchService";
import * as saleService from "./services/saleService";
import * as purchaseService from "./services/purchaseService";
import * as paymentService from "./services/paymentService";
import * as expenseService from "./services/expenseService";
import * as wastageService from "./services/wastageService";
import * as employeeService from "./services/employeeService";
import * as attendanceService from "./services/attendanceService";
import * as salaryService from "./services/salaryService";
import * as userService from "./services/userService";
import * as dailyPackingService from "./services/dailyPackingService";
import * as authService from "./services/authService";
import * as financeService from "./services/financeService";
import * as exportImportService from "./services/exportImportService";
import * as backupService from "./services/backupService";
import { sanitizeErrorMessage } from "./utils/errorMessages";

// Re-export recalculate helpers for backwards compatibility
export { recalculateCustomerBalance } from "./services/customerService";
export { recalculateSupplierBalance } from "./services/supplierService";

// ── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  // loading & errors
  isLoading: true,
  error: null,

  // navigation
  page: "dashboard",
  selectedId: null,
  sidebarOpen: true,

  // auth / permissions: "checking" | "authenticated" | "unauthenticated"
  authStatus: "checking",
  isAuthenticated: false,
  currentUser: null,

  // ui
  lang: "en",
  toasts: [],

  // cash & bank accounts
  cashBalance: 0,
  bankBalance: 0,
  bankTransactions: [],

  // data collections (hydrated from Dexie)
  customers: [],
  suppliers: [],
  fishTypes: [],
  batches: [],
  sales: [],
  purchases: [],
  payments: [],
  expenses: [],
  wastageRecords: [],
  employees: [],
  users: [],
  attendanceRecords: [],
  salaryRecords: [],
  dailyPackingRecords: [],
};

// ── Recomputation Helper ──────────────────────────────────────────────────────

export function recomputeDerivedState(state) {
  const sales = state.sales || [];
  const purchases = state.purchases || [];
  const payments = state.payments || [];
  const expenses = state.expenses || [];
  const wastageRecords = state.wastageRecords || [];
  const bankTransactions = state.bankTransactions || [];

  const customers = (state.customers || []).map((c) =>
    customerService.recalculateCustomerBalance(c, sales, payments)
  );

  const suppliers = (state.suppliers || []).map((s) =>
    supplierService.recalculateSupplierBalance(s, purchases, payments)
  );

  const fishTypes = (state.fishTypes || []).map((f) =>
    fishTypeService.recalculateFishTypeStock(f, purchases, sales, wastageRecords)
  );

  const batches = (state.batches || []).map((b) =>
    batchService.recalculateBatchRemaining(b, sales, wastageRecords)
  );

  const { cashBalance, bankBalance } = financeService.recalculateCashBankBalance(
    sales,
    purchases,
    payments,
    expenses,
    bankTransactions
  );

  return {
    ...state,
    customers,
    suppliers,
    fishTypes,
    batches,
    cashBalance,
    bankBalance,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };

    case "SET_INITIAL_DATA": {
      const isAuth = Boolean(action.payload?.currentUser);
      return recomputeDerivedState({
        ...state,
        ...action.payload,
        authStatus: isAuth ? "authenticated" : "unauthenticated",
        isAuthenticated: isAuth,
        isLoading: false,
        error: null,
      });
    }

    case "SET_SECONDARY_DATA":
      return recomputeDerivedState({
        ...state,
        ...action.payload,
      });

    case "NAVIGATE":
      return { ...state, page: action.page, selectedId: action.id ?? null };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "SET_LANG":
      return { ...state, lang: action.lang };

    case "SHOW_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, { id: action.id, message: action.message, type: action.toastType }],
      };

    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "ADD_CUSTOMER":
      return recomputeDerivedState({ ...state, customers: [...state.customers, action.payload] });

    case "UPDATE_CUSTOMER":
      return recomputeDerivedState({
        ...state,
        customers: state.customers.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)),
      });

    case "DELETE_CUSTOMER":
      return recomputeDerivedState({
        ...state,
        customers: state.customers.filter((c) => c.id !== action.payload),
      });

    case "ADD_SUPPLIER":
      return recomputeDerivedState({ ...state, suppliers: [...state.suppliers, action.payload] });

    case "UPDATE_SUPPLIER":
      return recomputeDerivedState({
        ...state,
        suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? { ...s, ...action.payload } : s)),
      });

    case "DELETE_SUPPLIER":
      return recomputeDerivedState({
        ...state,
        suppliers: state.suppliers.filter((s) => s.id !== action.payload),
      });

    case "ADD_FISH_TYPE":
      return recomputeDerivedState({ ...state, fishTypes: [...state.fishTypes, action.payload] });

    case "UPDATE_FISH_TYPE":
      return recomputeDerivedState({
        ...state,
        fishTypes: state.fishTypes.map((f) => (f.id === action.payload.id ? { ...f, ...action.payload } : f)),
      });

    case "DELETE_FISH_TYPE":
      return recomputeDerivedState({
        ...state,
        fishTypes: state.fishTypes.filter((f) => f.id !== action.payload),
      });

    case "ADD_BATCH":
      return recomputeDerivedState({ ...state, batches: [...state.batches, action.payload] });

    case "UPDATE_BATCH":
      return recomputeDerivedState({
        ...state,
        batches: state.batches.map((b) => (b.id === action.payload.id ? { ...b, ...action.payload } : b)),
      });

    case "DELETE_BATCH":
      return recomputeDerivedState({
        ...state,
        batches: state.batches.filter((b) => b.id !== action.payload),
      });

    case "ADD_SALE":
    case "SET_SALE_STATE": {
      const sale = action.payload?.sale || action.payload;
      const newSales = [sale, ...state.sales.filter((s) => s.id !== sale.id)];
      const salesUpdated = action.payload?.sales || newSales;
      return recomputeDerivedState({
        ...state,
        sales: salesUpdated,
        batches: action.payload?.batches || state.batches,
      });
    }

    case "UPDATE_SALE": {
      const updated = action.payload;
      const newSales = state.sales.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      return recomputeDerivedState({
        ...state,
        sales: newSales,
      });
    }

    case "DELETE_SALE": {
      const saleId = action.payload;
      const newSales = state.sales.filter((s) => s.id !== saleId);
      return recomputeDerivedState({
        ...state,
        sales: newSales,
      });
    }

    case "ADD_PURCHASE":
    case "SET_PURCHASE_STATE": {
      const purchase = action.payload?.purchase || action.payload;
      const newPurchases = [purchase, ...state.purchases.filter((p) => p.id !== purchase.id)];
      const purchasesUpdated = action.payload?.purchases || newPurchases;
      return recomputeDerivedState({
        ...state,
        purchases: purchasesUpdated,
      });
    }

    case "UPDATE_PURCHASE": {
      const updated = action.payload;
      const newPurchases = state.purchases.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
      return recomputeDerivedState({
        ...state,
        purchases: newPurchases,
      });
    }

    case "DELETE_PURCHASE": {
      const purchaseId = action.payload;
      const newPurchases = state.purchases.filter((p) => p.id !== purchaseId);
      return recomputeDerivedState({
        ...state,
        purchases: newPurchases,
      });
    }

    case "ADD_PAYMENT":
    case "SET_PAYMENT_STATE": {
      const payment = action.payload?.payment || action.payload;
      const newPayments = [payment, ...state.payments.filter((p) => p.id !== payment.id)];
      const salesUpdated = action.payload?.sales || state.sales;
      const purchasesUpdated = action.payload?.purchases || state.purchases;
      return recomputeDerivedState({
        ...state,
        payments: newPayments,
        sales: salesUpdated,
        purchases: purchasesUpdated,
      });
    }

    case "UPDATE_PAYMENT": {
      const updated = action.payload;
      const newPayments = state.payments.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
      const salesUpdated = action.payload?.sales || state.sales;
      const purchasesUpdated = action.payload?.purchases || state.purchases;
      return recomputeDerivedState({
        ...state,
        payments: newPayments,
        sales: salesUpdated,
        purchases: purchasesUpdated,
      });
    }

    case "DELETE_PAYMENT": {
      const paymentId = typeof action.payload === "object" ? action.payload.id : action.payload;
      const newPayments = state.payments.filter((p) => p.id !== paymentId);
      const salesUpdated = action.payload?.sales || state.sales;
      const purchasesUpdated = action.payload?.purchases || state.purchases;
      return recomputeDerivedState({
        ...state,
        payments: newPayments,
        sales: salesUpdated,
        purchases: purchasesUpdated,
      });
    }

    case "ADD_EXPENSE":
    case "SET_EXPENSE_STATE": {
      const expense = action.payload?.expense || action.payload;
      const newExpenses = [expense, ...state.expenses.filter((e) => e.id !== expense.id)];
      return recomputeDerivedState({
        ...state,
        expenses: newExpenses,
      });
    }

    case "UPDATE_EXPENSE": {
      const updated = action.payload;
      const newExpenses = state.expenses.map((e) => (e.id === updated.id ? { ...e, ...updated } : e));
      return recomputeDerivedState({
        ...state,
        expenses: newExpenses,
      });
    }

    case "DELETE_EXPENSE": {
      const expenseId = action.payload;
      const newExpenses = state.expenses.filter((e) => e.id !== expenseId);
      return recomputeDerivedState({
        ...state,
        expenses: newExpenses,
      });
    }

    case "ADD_WASTAGE":
    case "SET_WASTAGE_STATE": {
      const wastage = action.payload?.wastage || action.payload;
      const newWastage = [wastage, ...state.wastageRecords.filter((w) => w.id !== wastage.id)];
      return recomputeDerivedState({
        ...state,
        wastageRecords: newWastage,
      });
    }

    case "UPDATE_WASTAGE": {
      const updated = action.payload;
      const newWastage = state.wastageRecords.map((w) => (w.id === updated.id ? { ...w, ...updated } : w));
      return recomputeDerivedState({
        ...state,
        wastageRecords: newWastage,
      });
    }

    case "DELETE_WASTAGE": {
      const wastageId = action.payload;
      const newWastage = state.wastageRecords.filter((w) => w.id !== wastageId);
      return recomputeDerivedState({
        ...state,
        wastageRecords: newWastage,
      });
    }

    case "ADD_EMPLOYEE":
      return { ...state, employees: [...state.employees, action.payload] };

    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((e) => (e.id === action.payload.id ? { ...e, ...action.payload } : e)),
      };

    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.filter((e) => e.id !== action.payload),
      };

    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };

    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? { ...u, ...action.payload } : u)),
      };

    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };

    case "SET_ATTENDANCE_STATE":
      return { ...state, attendanceRecords: action.payload };

    case "SET_SALARY_STATE": {
      const { salaryRecord, expense, employees } = action.payload;
      return recomputeDerivedState({
        ...state,
        salaryRecords: [salaryRecord, ...state.salaryRecords],
        expenses: [expense, ...state.expenses],
        employees: employees || state.employees,
      });
    }

    case "ADD_DAILY_PACKING":
      return {
        ...state,
        dailyPackingRecords: [action.payload, ...(state.dailyPackingRecords || [])],
      };

    case "UPDATE_DAILY_PACKING":
      return {
        ...state,
        dailyPackingRecords: (state.dailyPackingRecords || []).map((dp) =>
          dp.id === action.payload.id ? { ...dp, ...action.payload } : dp
        ),
      };

    case "DELETE_DAILY_PACKING":
      return {
        ...state,
        dailyPackingRecords: (state.dailyPackingRecords || []).filter((dp) => dp.id !== action.payload),
      };

    case "DEPOSIT_TO_BANK": {
      const { newTx } = action.payload;
      const newTxs = [newTx, ...(state.bankTransactions || [])];
      return recomputeDerivedState({
        ...state,
        bankTransactions: newTxs,
      });
    }

    case "LOGIN_SUCCESS":
      return {
        ...state,
        authStatus: "authenticated",
        isAuthenticated: true,
        currentUser: action.payload,
        page: "dashboard",
      };

    case "LOGOUT":
      return {
        ...state,
        authStatus: "unauthenticated",
        isAuthenticated: false,
        currentUser: null,
        page: "dashboard",
      };

    case "SET_CURRENT_USER": {
      const isAuth = Boolean(action.payload);
      return {
        ...state,
        authStatus: isAuth ? "authenticated" : "unauthenticated",
        isAuthenticated: isAuth,
        currentUser: action.payload,
      };
    }

    case "RECALCULATE_CUSTOMER_BALANCE":
    case "RECALCULATE_ALL_CUSTOMER_BALANCES":
    case "RECALCULATE_SUPPLIER_BALANCE":
    case "RECALCULATE_ALL_SUPPLIER_BALANCES":
      return recomputeDerivedState(state);

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load state from Firestore/Cache on boot using staged loading
  const loadData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    try {
      const storedUser = await authService.getStoredSession().catch(() => null);

      // Stage 1: Load Dashboard & Core Collections required for instant UI rendering
      const [
        customers,
        suppliers,
        fishTypes,
        batches,
        sales,
        purchases,
        expenses,
        wastageRecords,
        balances,
      ] = await Promise.all([
        customerService.getAll().catch(() => []),
        supplierService.getAll().catch(() => []),
        fishTypeService.getAll().catch(() => []),
        batchService.getAll().catch(() => []),
        saleService.getAll().catch(() => []),
        purchaseService.getAll().catch(() => []),
        expenseService.getAll().catch(() => []),
        wastageService.getAll().catch(() => []),
        financeService.getBalances().catch(() => ({ cashBalance: 0, bankBalance: 0 })),
      ]);

      dispatch({
        type: "SET_INITIAL_DATA",
        payload: {
          isAuthenticated: Boolean(storedUser),
          currentUser: storedUser,
          customers: customers || [],
          suppliers: suppliers || [],
          fishTypes: fishTypes || [],
          batches: batches || [],
          sales: sales || [],
          purchases: purchases || [],
          expenses: expenses || [],
          wastageRecords: wastageRecords || [],
          cashBalance: balances?.cashBalance || 0,
          bankBalance: balances?.bankBalance || 0,
        },
      });

      // Stage 2: Non-blocking background fetch for secondary collections
      Promise.all([
        paymentService.getAll().catch(() => []),
        employeeService.getAll().catch(() => []),
        userService.getAll().catch(() => []),
        attendanceService.getAll().catch(() => []),
        salaryService.getAll().catch(() => []),
        dailyPackingService.getAll().catch(() => []),
        financeService.getBankTransactions().catch(() => []),
      ]).then(
        ([
          payments,
          employees,
          users,
          attendanceRecords,
          salaryRecords,
          dailyPackingRecords,
          bankTransactions,
        ]) => {
          dispatch({
            type: "SET_SECONDARY_DATA",
            payload: {
              payments: payments || [],
              employees: employees || [],
              users: users || [],
              attendanceRecords: attendanceRecords || [],
              salaryRecords: salaryRecords || [],
              dailyPackingRecords: dailyPackingRecords || [],
              bankTransactions: bankTransactions || [],
            },
          });
        }
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to load state:", err);
      }
      dispatch({ type: "SET_ERROR", error: sanitizeErrorMessage(err, "Unable to load data. Please refresh and try again.") });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically persist recomputed derived state to Firestore cloud storage
  useEffect(() => {
    if (state.isLoading) return;
    const syncDerived = async () => {
      try {
        if (state.customers?.length) {
          await customerService.bulkSave(state.customers);
        }
        if (state.suppliers?.length) {
          await supplierService.bulkSave(state.suppliers);
        }
        if (state.fishTypes?.length) {
          await fishTypeService.bulkSave(state.fishTypes);
        }
        if (state.batches?.length) {
          await batchService.bulkSave(state.batches);
        }
        await financeService.setBalances(state.cashBalance, state.bankBalance);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Error syncing state:", err);
        }
      }
    };
    syncDerived();
  }, [
    state.isLoading,
    state.customers,
    state.suppliers,
    state.fishTypes,
    state.batches,
    state.cashBalance,
    state.bankBalance,
  ]);

  const navigate = useCallback((page, id) => {
    dispatch({ type: "NAVIGATE", page, id });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const setLang = useCallback((lang) => {
    dispatch({ type: "SET_LANG", lang });
  }, []);

  const showToast = useCallback((message, toastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "SHOW_TOAST", id, message, toastType });
    setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), 3500);
  }, []);

  // Customer actions
  const addCustomer = useCallback(async (payload) => {
    const created = await customerService.create(payload);
    dispatch({ type: "ADD_CUSTOMER", payload: created });
    return created;
  }, []);

  const updateCustomer = useCallback(async (payload) => {
    const updated = await customerService.update(payload.id, payload);
    dispatch({ type: "UPDATE_CUSTOMER", payload: updated });
    return updated;
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await customerService.remove(id);
    dispatch({ type: "DELETE_CUSTOMER", payload: id });
  }, []);

  // Supplier actions
  const addSupplier = useCallback(async (payload) => {
    const created = await supplierService.create(payload);
    dispatch({ type: "ADD_SUPPLIER", payload: created });
    return created;
  }, []);

  const updateSupplier = useCallback(async (payload) => {
    const updated = await supplierService.update(payload.id, payload);
    dispatch({ type: "UPDATE_SUPPLIER", payload: updated });
    return updated;
  }, []);

  const deleteSupplier = useCallback(async (id) => {
    await supplierService.remove(id);
    dispatch({ type: "DELETE_SUPPLIER", payload: id });
  }, []);

  // Fish Type actions
  const addFishType = useCallback(async (payload) => {
    const created = await fishTypeService.create(payload);
    dispatch({ type: "ADD_FISH_TYPE", payload: created });
    return created;
  }, []);

  const updateFishType = useCallback(async (payload) => {
    const updated = await fishTypeService.update(payload.id, payload);
    dispatch({ type: "UPDATE_FISH_TYPE", payload: updated });
    return updated;
  }, []);

  const deleteFishType = useCallback(async (id) => {
    await fishTypeService.remove(id);
    dispatch({ type: "DELETE_FISH_TYPE", payload: id });
  }, []);

  // Batch actions
  const addBatch = useCallback(async (payload) => {
    const created = await batchService.create(payload);
    dispatch({ type: "ADD_BATCH", payload: created });
    return created;
  }, []);

  const updateBatch = useCallback(async (payload) => {
    const updated = await batchService.update(payload.id, payload);
    dispatch({ type: "UPDATE_BATCH", payload: updated });
    return updated;
  }, []);

  const deleteBatch = useCallback(async (id) => {
    await batchService.remove(id);
    dispatch({ type: "DELETE_BATCH", payload: id });
  }, []);

  // Sale action
  const addSale = useCallback(async (salePayload) => {
    const createdSale = await saleService.create(salePayload);
    dispatch({ type: "ADD_SALE", payload: createdSale });
    return createdSale;
  }, []);

  const updateSale = useCallback(async (payload) => {
    const updated = await saleService.update(payload.id, payload);
    dispatch({ type: "UPDATE_SALE", payload: updated });
    return updated;
  }, []);

  const deleteSale = useCallback(async (id) => {
    await saleService.remove(id);
    dispatch({ type: "DELETE_SALE", payload: id });
  }, []);

  // Purchase action
  const addPurchase = useCallback(async (purchasePayload) => {
    const createdPurchase = await purchaseService.create(purchasePayload);
    dispatch({ type: "ADD_PURCHASE", payload: createdPurchase });
    return createdPurchase;
  }, []);

  const updatePurchase = useCallback(async (payload) => {
    const updated = await purchaseService.update(payload.id, payload);
    dispatch({ type: "UPDATE_PURCHASE", payload: updated });
    return updated;
  }, []);

  const deletePurchase = useCallback(async (id) => {
    await purchaseService.remove(id);
    dispatch({ type: "DELETE_PURCHASE", payload: id });
  }, []);

  // Payment action
  const addPayment = useCallback(async (paymentPayload) => {
    const createdPayment = await paymentService.create(paymentPayload);
    const amt = parseFloat(createdPayment.amount) || 0;
    let updatedSales = state.sales;
    let updatedPurchases = state.purchases;

    if (createdPayment.type === "customer" && createdPayment.refId) {
      const targetS = state.sales.find((sl) => sl.id === createdPayment.refId);
      if (targetS) {
        const newPaid = (targetS.paid || 0) + amt;
        const newDue = (targetS.grandTotal || 0) - newPaid;
        const updatedS = await saleService.update(targetS.id, { paid: newPaid, due: newDue, status: newDue <= 0 ? "paid" : "partial" });
        updatedSales = state.sales.map((sl) => (sl.id === updatedS.id ? updatedS : sl));
      }
    } else if (createdPayment.type === "supplier" && createdPayment.refId) {
      const targetP = state.purchases.find((p) => p.id === createdPayment.refId);
      if (targetP) {
        const newPaid = (targetP.paid || 0) + amt;
        const newRemaining = (targetP.totalCost || 0) - newPaid;
        const updatedP = await purchaseService.update(targetP.id, { paid: newPaid, remaining: newRemaining });
        updatedPurchases = state.purchases.map((p) => (p.id === updatedP.id ? updatedP : p));
      }
    }

    dispatch({
      type: "ADD_PAYMENT",
      payload: { payment: createdPayment, sales: updatedSales, purchases: updatedPurchases },
    });
    return createdPayment;
  }, [state.sales, state.purchases]);

  const updatePayment = useCallback(async (payload) => {
    const updated = await paymentService.update(payload.id, payload);
    dispatch({ type: "UPDATE_PAYMENT", payload: updated });
    return updated;
  }, []);

  const deletePayment = useCallback(async (id) => {
    const target = state.payments.find((p) => p.id === id);
    let updatedSales = state.sales;
    let updatedPurchases = state.purchases;
    if (target && target.refId) {
      if (target.type === "customer") {
        const sale = state.sales.find((s) => s.id === target.refId);
        if (sale) {
          const newPaid = Math.max((sale.paid || 0) - (target.amount || 0), 0);
          const newDue = (sale.grandTotal || 0) - newPaid;
          const updatedS = await saleService.update(sale.id, { paid: newPaid, due: newDue, status: newDue <= 0 ? "paid" : "partial" });
          updatedSales = state.sales.map((s) => (s.id === updatedS.id ? updatedS : s));
        }
      } else if (target.type === "supplier") {
        const purchase = state.purchases.find((p) => p.id === target.refId);
        if (purchase) {
          const newPaid = Math.max((purchase.paid || 0) - (target.amount || 0), 0);
          const newRemaining = (purchase.totalCost || 0) - newPaid;
          const updatedP = await purchaseService.update(purchase.id, { paid: newPaid, remaining: newRemaining });
          updatedPurchases = state.purchases.map((p) => (p.id === updatedP.id ? updatedP : p));
        }
      }
    }
    await paymentService.remove(id);
    dispatch({ type: "DELETE_PAYMENT", payload: { id, sales: updatedSales, purchases: updatedPurchases } });
  }, [state.payments, state.sales, state.purchases]);

  // Expense action
  const addExpense = useCallback(async (expensePayload) => {
    const createdExpense = await expenseService.create(expensePayload);
    dispatch({ type: "ADD_EXPENSE", payload: createdExpense });
    return createdExpense;
  }, []);

  const updateExpense = useCallback(async (payload) => {
    const updated = await expenseService.update(payload.id, payload);
    dispatch({ type: "UPDATE_EXPENSE", payload: updated });
    return updated;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await expenseService.remove(id);
    dispatch({ type: "DELETE_EXPENSE", payload: id });
  }, []);

  // Wastage action
  const addWastage = useCallback(async (wastagePayload) => {
    const createdWastage = await wastageService.create(wastagePayload);
    dispatch({ type: "ADD_WASTAGE", payload: createdWastage });
    return createdWastage;
  }, []);

  const updateWastage = useCallback(async (payload) => {
    const updated = await wastageService.update(payload.id, payload);
    dispatch({ type: "UPDATE_WASTAGE", payload: updated });
    return updated;
  }, []);

  const deleteWastage = useCallback(async (id) => {
    await wastageService.remove(id);
    dispatch({ type: "DELETE_WASTAGE", payload: id });
  }, []);

  // Employee action
  const addEmployee = useCallback(async (payload) => {
    const created = await employeeService.create(payload);
    dispatch({ type: "ADD_EMPLOYEE", payload: created });
    return created;
  }, []);

  const updateEmployee = useCallback(async (payload) => {
    const updated = await employeeService.update(payload.id, payload);
    dispatch({ type: "UPDATE_EMPLOYEE", payload: updated });
    return updated;
  }, []);

  const deleteEmployee = useCallback(async (id) => {
    await employeeService.remove(id);
    dispatch({ type: "DELETE_EMPLOYEE", payload: id });
  }, []);

  // User actions
  const addUser = useCallback(async (payload) => {
    const created = await userService.create(payload);
    dispatch({ type: "ADD_USER", payload: created });
    return created;
  }, []);

  const updateUser = useCallback(async (idOrPayload, payloadData) => {
    const id = typeof idOrPayload === "object" ? idOrPayload.id : idOrPayload;
    const data = typeof idOrPayload === "object" ? idOrPayload : payloadData;
    const updated = await userService.update(id, data);
    dispatch({ type: "UPDATE_USER", payload: updated });
    return updated;
  }, []);

  const deleteUser = useCallback(async (id) => {
    await userService.remove(id);
    dispatch({ type: "DELETE_USER", payload: id });
  }, []);

  const toggleUserStatus = useCallback(async (id) => {
    const target = state.users.find((u) => u.id === id);
    if (!target) return;
    const newStatus = target.status === "active" ? "inactive" : "active";
    const updated = await userService.update(id, { status: newStatus });
    dispatch({ type: "UPDATE_USER", payload: updated });
    return updated;
  }, [state.users]);

  const changePassword = useCallback(async (userId, currentPassword, newPassword) => {
    const updated = await userService.changePassword(userId, currentPassword, newPassword);
    dispatch({ type: "UPDATE_USER", payload: updated });
    return updated;
  }, []);

  // Attendance & Salary
  const markAttendance = useCallback(async (payload) => {
    const items = Array.isArray(payload) ? payload : [payload];
    await attendanceService.markAttendanceBatch(items);
    const updatedRecords = await attendanceService.getAll();
    dispatch({ type: "SET_ATTENDANCE_STATE", payload: updatedRecords });
  }, []);

  const addSalaryRecord = useCallback(async (recordPayload) => {
    const createdRecord = await salaryService.create(recordPayload);
    const net = parseFloat(createdRecord.netPaid) || 0;
    const method = createdRecord.paymentMethod || "Bank";

    let cashBal = state.cashBalance;
    let bankBal = state.bankBalance;
    if (method === "Cash") {
      cashBal = Math.max(cashBal - net, 0);
    } else {
      bankBal = Math.max(bankBal - net, 0);
    }
    await financeService.setBalances(cashBal, bankBal);

    const expCategory = createdRecord.category === "General Labour" ? "Labour Wages" : "Employee Salary";
    const createdExpense = await expenseService.create({
      date: createdRecord.paidDate || new Date().toISOString().slice(0, 10),
      category: expCategory,
      description: `Salary payout for ${createdRecord.employeeName} (${createdRecord.month})`,
      amount: net,
      paidBy: "Management",
      paymentMethod: method,
      notes: `Base: ${createdRecord.baseSalary}, Advances: ${createdRecord.advances}, Deductions: ${createdRecord.deductions}`,
    });

    let updatedEmployees = state.employees;
    if (createdRecord.employeeId) {
      const targetEmp = state.employees.find((e) => e.id === createdRecord.employeeId);
      if (targetEmp) {
        const newPaid = (targetEmp.salaryPaid || 0) + net;
        const newDue = Math.max((targetEmp.salary || 0) - newPaid, 0);
        const updatedE = await employeeService.update(targetEmp.id, { salaryPaid: newPaid, salaryDue: newDue });
        updatedEmployees = state.employees.map((e) => (e.id === updatedE.id ? updatedE : e));
      }
    }

    dispatch({
      type: "SET_SALARY_STATE",
      payload: {
        salaryRecord: createdRecord,
        expense: createdExpense,
        employees: updatedEmployees,
        cashBalance: cashBal,
        bankBalance: bankBal,
      },
    });

    return createdRecord;
  }, [state.cashBalance, state.bankBalance, state.employees]);

  // Daily packing action
  const addDailyPacking = useCallback(async (payload) => {
    const created = await dailyPackingService.create(payload);
    dispatch({ type: "ADD_DAILY_PACKING", payload: created });
    return created;
  }, []);

  const updateDailyPacking = useCallback(async (payload) => {
    const updated = await dailyPackingService.update(payload.id, payload);
    dispatch({ type: "UPDATE_DAILY_PACKING", payload: updated });
    return updated;
  }, []);

  const deleteDailyPacking = useCallback(async (id) => {
    await dailyPackingService.remove(id);
    dispatch({ type: "DELETE_DAILY_PACKING", payload: id });
  }, []);

  // Bank Deposit
  const depositToBank = useCallback(async (amount, notes) => {
    const res = await financeService.depositToBank(amount, notes);
    dispatch({ type: "DEPOSIT_TO_BANK", payload: res });
    return res;
  }, []);

  // Auth actions
  const login = useCallback(
    async (usernameOrEmail, password) => {
      const res = await authService.login(usernameOrEmail, password);
      if (res.success) {
        dispatch({ type: "LOGIN_SUCCESS", payload: res.user });
        showToast(`Welcome back, ${res.user.name}!`, "success");

        // Non-blocking background daily backup check for Super Admin
        if (res.user && res.user.role === "SUPER_ADMIN") {
          backupService.checkAndRunDailyBackup().then((bRes) => {
            if (bRes && bRes.ran) {
              showToast("Automatic daily backup completed successfully.", "success");
            }
          }).catch((err) => {
            if (import.meta.env.DEV) {
              console.error("Daily backup failed:", err);
            }
            showToast("Daily backup failed. Please try again.", "error");
          });
        }
      }
      return res;
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch({ type: "LOGOUT" });
    showToast("Logged out successfully.", "info");
  }, [showToast]);

  const setCurrentUser = useCallback((user) => {
    dispatch({ type: "SET_CURRENT_USER", payload: user });
  }, []);

  const switchUser = useCallback((userId) => {
    const user = state.users.find((u) => u.id === userId || u.username === userId);
    if (user) {
      dispatch({ type: "SET_CURRENT_USER", payload: user });
    }
  }, [state.users]);

  const canAccess = useCallback((pageKey) => {
    if (!state.currentUser) return false;
    return hasPermission(state.currentUser, pageKey);
  }, [state.currentUser]);

  // Data Export & Import
  const exportData = useCallback(async () => {
    try {
      const res = await exportImportService.exportAllData();
      showToast("Data exported successfully!", "success");
      return res;
    } catch (err) {
      showToast(sanitizeErrorMessage(err, "Export failed. Please try again."), "error");
      throw err;
    }
  }, [showToast]);

  const importData = useCallback(async (jsonString) => {
    try {
      await exportImportService.importAllData(jsonString);
      await loadData();
      showToast("Data restored successfully!", "success");
    } catch (err) {
      showToast(sanitizeErrorMessage(err, "Import failed. Please try again."), "error");
      throw err;
    }
  }, [loadData, showToast]);

  const value = useMemo(
    () => ({
      ...state,
      navigate,
      toggleSidebar,
      setLang,
      showToast,
      login,
      logout,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addFishType,
      updateFishType,
      deleteFishType,
      addSale,
      updateSale,
      deleteSale,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addBatch,
      updateBatch,
      deleteBatch,
      addPayment,
      updatePayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addWastage,
      updateWastage,
      deleteWastage,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      changePassword,
      addDailyPacking,
      updateDailyPacking,
      deleteDailyPacking,
      markAttendance,
      addSalaryRecord,
      depositToBank,
      setCurrentUser,
      switchUser,
      canAccess,
      hasPermission,
      exportData,
      importData,
      runManualBackup: backupService.runBackup,
      getBackupLogs: backupService.getBackupLogs,
      downloadLocalBackup: backupService.downloadLocalBackup,
      isLocalBackupAvailable: backupService.isLocalBackupAvailable,
      getDeviceId: backupService.getDeviceId,
      reloadStoreData: loadData,
    }),
    [
      state,
      navigate,
      toggleSidebar,
      setLang,
      showToast,
      login,
      logout,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addFishType,
      updateFishType,
      deleteFishType,
      addSale,
      updateSale,
      deleteSale,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addBatch,
      updateBatch,
      deleteBatch,
      addPayment,
      updatePayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addWastage,
      updateWastage,
      deleteWastage,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      changePassword,
      addDailyPacking,
      updateDailyPacking,
      deleteDailyPacking,
      markAttendance,
      addSalaryRecord,
      depositToBank,
      setCurrentUser,
      switchUser,
      exportData,
      importData,
      loadData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
