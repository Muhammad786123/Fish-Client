import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { KPICard, DateFilter, SummaryCard, fmt, Btn, EmptyState, SkeletonKpiGrid, SkeletonTable } from "../../components/common/ui";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, ShoppingCart, Snowflake, AlertTriangle, Users, Truck, Wallet, DollarSign, Plus, Package } from "lucide-react";
import { getDateRangeForPeriod, getPeriodLabel, toLocalDateStr } from "../../utils/dateUtils";

const COLORS = ["#0f2d5a", "#0d9488", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"];

export default function Dashboard() {
  const {
    lang,
    navigate,
    sales,
    purchases,
    batches,
    fishTypes,
    customers,
    suppliers,
    expenses,
    cashBalance,
    wastageRecords,
    isLoading
  } = useApp();
  const tr = t[lang];
  const [period, setPeriod] = useState("today");

  const todayStr = toLocalDateStr(new Date());
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  if (isLoading && (!sales?.length && !purchases?.length && !customers?.length && !suppliers?.length)) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <SkeletonKpiGrid count={4} />
        <SkeletonTable rows={4} cols={5} />
      </div>
    );
  }

  // Shared Date Range Resolver for all period-based metrics
  const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

  // Period-filtered collections
  const filteredSales = (sales || []).filter(s => {
    const d = (s.date || "").slice(0, 10);
    return d && d >= startDate && d <= endDate;
  });

  const filteredPurchases = (purchases || []).filter(p => {
    const d = (p.date || "").slice(0, 10);
    return d && d >= startDate && d <= endDate;
  });

  const filteredExpenses = (expenses || []).filter(e => {
    const d = (e.date || "").slice(0, 10);
    return d && d >= startDate && d <= endDate;
  });

  const filteredWastage = (wastageRecords || []).filter(w => {
    const d = (w.date || "").slice(0, 10);
    return d && d >= startDate && d <= endDate;
  });

  // Period KPI Metrics
  const periodSalesAmt = filteredSales.reduce((s, x) => s + (parseFloat(x.grandTotal) || 0), 0);
  const periodPurchasesAmt = filteredPurchases.reduce((s, x) => s + (parseFloat(x.totalCost) || 0), 0);
  const periodExpensesAmt = filteredExpenses.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const periodWastageKg = filteredWastage.reduce((s, w) => s + (parseFloat(w.qtyKg) || 0), 0);
  const periodWasteLoss = filteredWastage.reduce((s, w) => s + (parseFloat(w.totalLoss) || 0), 0);

  // Period Net Profit (Sales - Purchases - Expenses - Wastage Loss)
  const periodNetProfit = periodSalesAmt - periodPurchasesAmt - periodExpensesAmt - periodWasteLoss;

  // Snapshot KPI Metrics (Point-in-time running totals / balances — unaffected by period filter)
  const totalStockKg = (fishTypes || []).reduce((s, f) => s + (parseFloat(f.currentStock) || 0), 0);
  const totalReceivables = (customers || []).reduce((s, c) => s + (parseFloat(c.due) || 0), 0);
  const totalPayables = (suppliers || []).reduce((s, sp) => s + (parseFloat(sp.payable) || 0), 0);

  // Dynamic Stock Distribution for Pie Chart
  const stockDistMap = {};
  (fishTypes || []).forEach(f => {
    if ((f.currentStock || 0) > 0) {
      stockDistMap[f.name || "Other"] = (stockDistMap[f.name || "Other"] || 0) + f.currentStock;
    }
  });
  const stockDistributionData = Object.entries(stockDistMap).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length]
  }));

  // Dynamic Wastage Data
  const wastageMap = {};
  filteredWastage.forEach(w => {
    const key = w.fishName || "Fish";
    wastageMap[key] = (wastageMap[key] || 0) + (w.qtyKg || 0);
  });
  const wastageChartData = Object.entries(wastageMap).map(([fish, kg]) => ({
    fish,
    kg
  }));

  // Dynamic Sales & Purchases Weekly Chart Data
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyChartData = daysOfWeek.map((day) => ({
    day,
    sales: 0,
    purchases: 0
  }));

  filteredSales.forEach(s => {
    if (s.date) {
      const d = new Date(s.date);
      const dayIdx = (d.getDay() + 6) % 7;
      if (weeklyChartData[dayIdx]) {
        weeklyChartData[dayIdx].sales += (parseFloat(s.grandTotal) || 0);
      }
    }
  });

  filteredPurchases.forEach(p => {
    if (p.date) {
      const d = new Date(p.date);
      const dayIdx = (d.getDay() + 6) % 7;
      if (weeklyChartData[dayIdx]) {
        weeklyChartData[dayIdx].purchases += (parseFloat(p.totalCost) || 0);
      }
    }
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "Outfit" }}>
            {tr.goodMorning}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {tr.businessOverview}
          </p>
        </div>
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
      </div>

      {/* KPI Grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <KPICard
          label={getPeriodLabel(period, "Sales", "سیل", lang, true)}
          value={fmt(periodSalesAmt)}
          icon={<ShoppingCart size={20} color="white" />}
          iconBg="var(--primary)"
          onClick={() => navigate("sales")}
        />
        <KPICard
          label={getPeriodLabel(period, "Purchases", "خریداری", lang, true)}
          value={fmt(periodPurchasesAmt)}
          icon={<Package size={20} color="white" />}
          iconBg="#7c3aed"
          onClick={() => navigate("purchases")}
        />
        <KPICard
          label={tr.frozenStockKg}
          value={`${totalStockKg.toLocaleString()} KG`}
          icon={<Snowflake size={20} color="white" />}
          iconBg="var(--accent)"
          onClick={() => navigate("cold-store")}
        />
        <KPICard
          label={getPeriodLabel(period, "Wastage", "ضیاع", lang, false)}
          value={`${periodWastageKg} KG`}
          icon={<AlertTriangle size={20} color="white" />}
          iconBg="#dc2626"
          onClick={() => navigate("wastage")}
        />
        <KPICard
          label={tr.customerReceivable}
          value={fmt(totalReceivables)}
          icon={<Users size={20} color="white" />}
          iconBg="#0ea5e9"
          onClick={() => navigate("customers")}
        />
        <KPICard
          label={tr.supplierPayable}
          value={fmt(totalPayables)}
          icon={<Truck size={20} color="white" />}
          iconBg="#f59e0b"
          onClick={() => navigate("suppliers")}
        />
        <KPICard
          label={tr.cashInHand}
          value={<span style={{ color: cashBalance < 0 ? "#dc2626" : "inherit" }}>{fmt(cashBalance || 0)}</span>}
          icon={<Wallet size={20} color="white" />}
          iconBg={cashBalance < 0 ? "#dc2626" : "#16a34a"}
          onClick={() => navigate("accounts")}
        />
        <KPICard
          label={getPeriodLabel(period, "Net Profit", "خالص منافع", lang, false)}
          value={fmt(periodNetProfit)}
          icon={<DollarSign size={20} color="white" />}
          iconBg="#8b5cf6"
          onClick={() => navigate("profit-loss")}
        />
      </div>

      {/* Quick Actions */}
      <SummaryCard>
        <h2 className="text-sm sm:text-base font-bold mb-3" style={{ fontFamily: "Outfit" }}>
          {tr.quickActions}
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: tr.newSale, page: "new-sale", color: "var(--primary)" },
            { label: tr.newPurchase, page: "new-purchase", color: "#7c3aed" },
            { label: tr.addCustomer, page: "customers", color: "#0ea5e9" },
            { label: tr.receivePayment, page: "payments", color: "#16a34a" },
            { label: tr.addExpense, page: "expenses", color: "#f59e0b" },
            { label: tr.recordWastage, page: "wastage", color: "#dc2626" },
            { label: tr.addFishBatch, page: "fish-batches", color: "var(--accent)" }
          ].map(a => (
            <button
              key={a.page}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: a.color }}
              onClick={() => navigate(a.page)}
            >
              <Plus size={13} />
              {a.label}
            </button>
          ))}
        </div>
      </SummaryCard>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* <SummaryCard>
          <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4" style={{ fontFamily: "Outfit" }}>
            {tr.salesOverview}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyChartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`Rs. ${Number(v).toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2.5} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </SummaryCard> */}

        {/* <SummaryCard>
          <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4" style={{ fontFamily: "Outfit" }}>
            {tr.purchaseVsSales}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyChartData} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `Rs. ${Number(v).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sales" name="Sales" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="Purchases" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SummaryCard> */}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* <SummaryCard>
          <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4" style={{ fontFamily: "Outfit" }}>
            {tr.fishStockDistribution}
          </h2>
          {stockDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stockDistributionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name">
                  {stockDistributionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v} KG`, ""]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs italic border border-dashed rounded-xl">
              No active stock recorded yet
            </div>
          )}
        </SummaryCard> */}

        {/* <SummaryCard>
          <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4" style={{ fontFamily: "Outfit" }}>
            {tr.wastageOverview}
          </h2>
          {wastageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={wastageChartData} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="fish" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={v => [`${v} KG`, "Wastage"]} />
                <Bar dataKey="kg" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs italic border border-dashed rounded-xl">
              No wastage records yet
            </div>
          )}
        </SummaryCard> */}

        {/* Recent Transactions */}
        {/* <SummaryCard>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-bold" style={{ fontFamily: "Outfit" }}>
              {tr.recentSales}
            </h2>
            <button className="text-xs font-medium" style={{ color: "var(--accent)" }} onClick={() => navigate("sales")}>
              {tr.viewAll}
            </button>
          </div>
          {sales.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {sales.slice(0, 5).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => navigate("sale-detail", s.id)}
                >
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">{s.invoiceNo}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {s.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold mono" style={{ color: s.due > 0 ? "#dc2626" : "#16a34a" }}>
                      {fmt(s.grandTotal)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {s.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs italic border border-dashed rounded-xl">
              No recent sales transactions
            </div>
          )}
        </SummaryCard> */}
      </div>
    </div>
  );
}
