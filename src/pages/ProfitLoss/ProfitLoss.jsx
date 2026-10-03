import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, DateFilter, StatRow, fmt } from "../../components/common/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { EXPENSE_CATEGORIES } from "../Expenses/Expenses";
import { DollarSign, TrendingUp, TrendingDown, Receipt, PieChart as PieIcon, AlertCircle } from "lucide-react";
import { filterItemsByPeriod, toLocalDateStr } from "../../utils/dateUtils";

const CATEGORY_COLORS = {
  Electricity: "#f59e0b",
  "Generator Fuel": "#d97706",
  "Plant Maintenance": "#0284c7",
  "Labour Wages": "#7c3aed",
  "Phone/Utilities": "#0d9488",
  Transport: "#2563eb",
  Rent: "#dc2626",
  Water: "#0891b2",
  Ice: "#06b6d4",
  Packaging: "#8b5cf6",
  "Employee Salary": "#4f46e5",
  Fuel: "#ea580c",
  "Loading/Unloading": "#65a30d",
  Repairs: "#c026d3",
  Other: "#64748b"
};

export default function ProfitLoss() {
  const {
    lang,
    sales,
    purchases,
    expenses,
    wastageRecords
  } = useApp();
  const tr = t[lang];
  const [period, setPeriod] = useState("month");

  const todayStr = toLocalDateStr(new Date());
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  // Dynamic Monthly Trend Chart Data built from real transactions
  const monthlyTrendData = (() => {
    const monthsMap = {};

    (sales || []).forEach(s => {
      if (s.date) {
        const m = s.date.slice(0, 7);
        if (!monthsMap[m]) monthsMap[m] = { month: m, revenue: 0, cost: 0, profit: 0 };
        monthsMap[m].revenue += (parseFloat(s.grandTotal) || 0);
      }
    });

    (purchases || []).forEach(p => {
      if (p.date) {
        const m = p.date.slice(0, 7);
        if (!monthsMap[m]) monthsMap[m] = { month: m, revenue: 0, cost: 0, profit: 0 };
        monthsMap[m].cost += (parseFloat(p.totalCost) || 0);
      }
    });

    (expenses || []).forEach(e => {
      if (e.date) {
        const m = e.date.slice(0, 7);
        if (!monthsMap[m]) monthsMap[m] = { month: m, revenue: 0, cost: 0, profit: 0 };
        monthsMap[m].cost += (parseFloat(e.amount) || 0);
      }
    });

    (wastageRecords || []).forEach(w => {
      if (w.date) {
        const m = w.date.slice(0, 7);
        if (!monthsMap[m]) monthsMap[m] = { month: m, revenue: 0, cost: 0, profit: 0 };
        monthsMap[m].cost += (parseFloat(w.totalLoss) || 0);
      }
    });

    const sortedMonths = Object.keys(monthsMap).sort();
    if (sortedMonths.length === 0) {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      return [{ month: currentMonthStr, revenue: 0, cost: 0, profit: 0 }];
    }

    return sortedMonths.map(m => {
      const item = monthsMap[m];
      const dateObj = new Date(m + "-01");
      const monthLabel = isNaN(dateObj.getTime())
        ? m
        : dateObj.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return {
        month: monthLabel,
        revenue: item.revenue,
        cost: item.cost,
        profit: item.revenue - item.cost
      };
    });
  })();

  // Filter collections using shared date range resolver
  const filteredSales = filterItemsByPeriod(sales, period, customStart, customEnd, "date");
  const filteredPurchases = filterItemsByPeriod(purchases, period, customStart, customEnd, "date");
  const filteredExpenses = filterItemsByPeriod(expenses, period, customStart, customEnd, "date");
  const filteredWastage = filterItemsByPeriod(wastageRecords, period, customStart, customEnd, "date");

  const totalSales = filteredSales.reduce((s, x) => s + (parseFloat(x.grandTotal) || 0), 0);
  const fishCost = filteredPurchases.reduce((s, x) => s + (parseFloat(x.totalCost) || 0), 0);
  const wasteLoss = filteredWastage.reduce((s, w) => s + (parseFloat(w.totalLoss) || 0), 0);

  // Group expenses by category
  const expenseBreakdown = EXPENSE_CATEGORIES.map(cat => {
    const catExpenses = filteredExpenses.filter(e => e.category === cat);
    const amount = catExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return {
      category: cat,
      amount,
      count: catExpenses.length
    };
  });

  const totalOperatingExpenses = expenseBreakdown.reduce((s, c) => s + c.amount, 0);
  const grossProfit = totalSales - fishCost;
  const netProfit = grossProfit - totalOperatingExpenses - wasteLoss;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales * 100).toFixed(1) : "0.0";

  // Filter non-zero categories for breakdown visual
  const activeExpenseCategories = expenseBreakdown.filter(c => c.amount > 0);

  return <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.profitLoss}
        subtitle="Comprehensive financial performance & expense breakdown"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <DateFilter active={period} onChange={setPeriod} labels={[tr.today, tr.thisWeek, tr.thisMonth, tr.custom]} values={["today", "week", "month", "custom"]} />
            {period === "custom" && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:ring-1 focus:ring-slate-400"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            )}
          </div>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>TOTAL REVENUE</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold mono text-emerald-600">{fmt(totalSales)}</div>
          <div className="text-xs text-slate-400 mt-1">{filteredSales.length} Completed Sales</div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>COST OF GOODS (COGS)</span>
            <Receipt size={16} className="text-rose-600" />
          </div>
          <div className="text-xl font-bold mono text-rose-600">{fmt(fishCost)}</div>
          <div className="text-xs text-slate-400 mt-1">{filteredPurchases.length} Fish Purchases</div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>OPERATING EXPENSES</span>
            <PieIcon size={16} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold mono text-amber-600">{fmt(totalOperatingExpenses)}</div>
          <div className="text-xs text-slate-400 mt-1">{activeExpenseCategories.length} Active Categories</div>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>NET PROFIT</span>
            {netProfit >= 0 ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-rose-600" />}
          </div>
          <div className={`text-xl font-bold mono ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(netProfit)}</div>
          <div className="text-xs text-slate-400 mt-1">Margin: {profitMargin}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Statement */}
        <SummaryCard>
          <h2 className="text-base font-bold mb-4 flex items-center justify-between" style={{ fontFamily: "Outfit" }}>
            <span>Profit & Loss Statement</span>
            <span className="text-xs font-normal text-slate-400 uppercase tracking-wide">Period: {period}</span>
          </h2>

          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Revenue</div>
            <StatRow label="Total Sales Revenue" value={fmt(totalSales)} color="#16a34a" />
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Cost of Goods Sold</div>
            <StatRow label="Fish Purchase Cost" value={fmt(fishCost)} color="#dc2626" />
          </div>

          <div className="rounded-xl p-3 mb-4" style={{ background: "#f0fdf4" }}>
            <StatRow label="Gross Profit" value={fmt(grossProfit)} color="#16a34a" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>
              <span>Operating Expenses (Category Breakdown)</span>
              <span>{fmt(totalOperatingExpenses)}</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {activeExpenseCategories.length > 0 ? (
                activeExpenseCategories.map(c => (
                  <StatRow key={c.category} label={c.category} value={fmt(c.amount)} color={CATEGORY_COLORS[c.category] || "#d97706"} />
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-1">No recorded operating expenses for this period</div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Losses</div>
            <StatRow label="Wastage Loss" value={fmt(wasteLoss)} color="#dc2626" />
          </div>

          <div className="rounded-xl p-4" style={{ background: netProfit >= 0 ? "#f0fdf4" : "#fee2e2" }}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg" style={{ fontFamily: "Outfit" }}>Net Profit</span>
              <span className="text-2xl font-bold mono" style={{ color: netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                {fmt(netProfit)}
              </span>
            </div>
            <div className="text-xs mt-1 flex justify-between items-center" style={{ color: "var(--muted-foreground)" }}>
              <span>Profit Margin: {profitMargin}%</span>
              <span>Formula: Revenue − COGS − Operating Expenses − Wastage</span>
            </div>
          </div>
        </SummaryCard>

        {/* Expense Category Breakdown Chart & Table */}
        <SummaryCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ fontFamily: "Outfit" }}>Operating Expense Breakdown</h2>
              <p className="text-xs text-slate-500">Categorized expenditure breakdown for selected period</p>
            </div>
            <div className="text-xs font-bold mono bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
              Total: {fmt(totalOperatingExpenses)}
            </div>
          </div>

          {/* Bar Chart of Expense Categories */}
          {activeExpenseCategories.length > 0 ? (
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeExpenseCategories} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={v => `Rs. ${Number(v).toLocaleString()}`} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {activeExpenseCategories.map(entry => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "var(--accent)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 border border-dashed rounded-xl mb-4">
              <AlertCircle size={24} className="mb-1" />
              <span className="text-xs">No expenses recorded for this period</span>
            </div>
          )}

          {/* Category Breakdown Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-center">Entries</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenseBreakdown.map(c => {
                  const share = totalOperatingExpenses > 0 ? (c.amount / totalOperatingExpenses * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={c.category} className={c.amount > 0 ? "hover:bg-slate-50" : "opacity-40"}>
                      <td className="py-2 font-medium flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.category] || "#94a3b8" }}></span>
                        <span>{c.category}</span>
                      </td>
                      <td className="py-2 text-center text-slate-500">{c.count}</td>
                      <td className="py-2 text-right font-bold mono text-slate-800">{fmt(c.amount)}</td>
                      <td className="py-2 text-right font-medium text-slate-500">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SummaryCard>
      </div>

      {/* Monthly Trend Chart */}
      <SummaryCard>
        <h2 className="text-base font-bold mb-4" style={{ fontFamily: "Outfit" }}>
          Revenue vs Cost vs Profit Trend
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyTrendData} barGap={6}>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `Rs. ${Number(v).toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" name="Cost of Goods" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Net Profit" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SummaryCard>
    </div>;
}

