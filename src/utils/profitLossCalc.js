import { filterItemsByPeriod } from "./dateUtils";
import { EXPENSE_CATEGORIES } from "../pages/Expenses/Expenses";

export const P_L_CATEGORY_COLORS = {
  Electricity: "#f59e0b",
  "Generator Fuel": "#d97706",
  "Plant Maintenance": "#0284c7",
  "Labour Wages": "#7c3aed",
  "Phone/Utilities": "#0d9488",
  Transport: "#2563eb",
  Rent: "#dc2626",
  Water: "#0891b2",
  "Water Tanker Bill": "#0891b2",
  Ice: "#06b6d4",
  Packaging: "#8b5cf6",
  "Employee Salary": "#4f46e5",
  Fuel: "#ea580c",
  "Loading/Unloading": "#65a30d",
  Repairs: "#c026d3",
  Other: "#64748b"
};

/**
 * Shared Profit & Loss calculation logic mirroring ProfitLoss.jsx
 * Computes:
 * - Total Revenue (from completed sales)
 * - Cost of Goods Sold / COGS (from fish purchases)
 * - Operating Expenses (grouped by category)
 * - Wastage Loss
 * - Gross Profit & Net Profit
 */
export function calculateProfitLoss({
  sales = [],
  purchases = [],
  expenses = [],
  wastageRecords = [],
  period = "month",
  customStart = "",
  customEnd = ""
}) {
  const filteredSales = filterItemsByPeriod(sales, period, customStart, customEnd, "date");
  const filteredPurchases = filterItemsByPeriod(purchases, period, customStart, customEnd, "date");
  const filteredExpenses = filterItemsByPeriod(expenses, period, customStart, customEnd, "date");
  const filteredWastage = filterItemsByPeriod(wastageRecords, period, customStart, customEnd, "date");

  const totalSales = filteredSales.reduce((s, x) => s + (parseFloat(x.grandTotal) || 0), 0);
  const fishCost = filteredPurchases.reduce((s, x) => s + (parseFloat(x.totalCost) || 0), 0);
  const wasteLoss = filteredWastage.reduce((s, w) => s + (parseFloat(w.totalLoss) || 0), 0);

  // Group expenses by category (consistent with ProfitLoss.jsx)
  const expenseBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const catExpenses = filteredExpenses.filter((e) => e.category === cat);
    const amount = catExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return {
      category: cat,
      amount,
      count: catExpenses.length
    };
  });

  // Include any extra unlisted categories present in the filtered expenses
  const recognizedCategories = new Set(EXPENSE_CATEGORIES);
  const unlistedCategories = {};
  filteredExpenses.forEach((e) => {
    if (e.category && !recognizedCategories.has(e.category)) {
      if (!unlistedCategories[e.category]) {
        unlistedCategories[e.category] = { category: e.category, amount: 0, count: 0 };
      }
      unlistedCategories[e.category].amount += (parseFloat(e.amount) || 0);
      unlistedCategories[e.category].count += 1;
    }
  });
  Object.values(unlistedCategories).forEach((item) => {
    expenseBreakdown.push(item);
  });

  const totalOperatingExpenses = expenseBreakdown.reduce((s, c) => s + c.amount, 0);
  const grossProfit = totalSales - fishCost;
  const netProfit = grossProfit - totalOperatingExpenses - wasteLoss;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0.0";
  const activeExpenseCategories = expenseBreakdown.filter((c) => c.amount > 0);

  return {
    filteredSales,
    filteredPurchases,
    filteredExpenses,
    filteredWastage,
    totalSales,
    fishCost,
    wasteLoss,
    expenseBreakdown,
    totalOperatingExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    activeExpenseCategories
  };
}
