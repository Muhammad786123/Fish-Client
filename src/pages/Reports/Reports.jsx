import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, DateFilter, Btn, fmt, Modal, Badge, StatRow } from "../../components/common/ui";
import { ShoppingCart, Package, Snowflake, AlertTriangle, DollarSign, FileText, Download, Printer, Filter, X } from "lucide-react";
import { exportReportToPDF } from "../../utils/pdfExport";
import { filterItemsByPeriod, getDateRangeForPeriod, toLocalDateStr } from "../../utils/dateUtils";
import { calculateProfitLoss, P_L_CATEGORY_COLORS } from "../../utils/profitLossCalc";
import * as saleService from "../../services/saleService";
import * as purchaseService from "../../services/purchaseService";
import * as wastageService from "../../services/wastageService";
import * as expenseService from "../../services/expenseService";
import * as paymentService from "../../services/paymentService";

const reportGroups = [{
  icon: ShoppingCart,
  color: "#0f2d5a",
  label: "Sales Reports",
  reports: ["Daily Sales", "Weekly Sales", "Monthly Sales", "Fish-wise Sales", "Customer-wise Sales"]
}, {
  icon: Package,
  color: "#7c3aed",
  label: "Purchase Reports",
  reports: ["Daily Purchases", "Supplier-wise Purchases", "Fish-wise Purchases"]
}, {
  icon: Snowflake,
  color: "var(--accent)",
  label: "Stock Reports",
  reports: ["Current Stock", "Batch Report", "Stock Movement"]
}, {
  icon: AlertTriangle,
  color: "#dc2626",
  label: "Wastage Reports",
  reports: ["Fish-wise Wastage", "Batch-wise Wastage", "Reason-wise Wastage"]
}, {
  icon: DollarSign,
  color: "#16a34a",
  label: "Financial Reports",
  reports: ["Profit & Loss", "Expenses", "Customer Receivables", "Supplier Payables", "Payment Report"]
}];

export default function Reports() {
  const {
    lang,
    sales,
    purchases,
    batches,
    wastageRecords,
    expenses,
    customers,
    suppliers,
    payments,
    showToast
  } = useApp();
  const tr = t[lang];

  const [activeReport, setActiveReport] = useState(null);
  const [period, setPeriod] = useState("month");
  const todayStr = toLocalDateStr(new Date());

  // Default custom start date to beginning of current month (e.g., 2026-09-01) for broad coverage
  const now = new Date();
  const defaultCustomStart = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1)) || "2026-09-01";
  const [customStart, setCustomStart] = useState(defaultCustomStart);
  const [customEnd, setCustomEnd] = useState(todayStr);

  // Dedicated uncapped report dataset state
  const [reportItems, setReportItems] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch full uncapped report dataset on activeReport or date period change
  useEffect(() => {
    if (!activeReport) {
      setReportItems([]);
      return;
    }

    let isMounted = true;
    setLoadingReport(true);
    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    async function loadReportData() {
      try {
        let fetched = [];
        if (activeReport === "Profit & Loss") {
          fetched = [];
        } else if (activeReport.includes("Sales")) {
          fetched = await saleService.getAllForReport(startDate, endDate, sales);
        } else if (activeReport.includes("Purchase")) {
          fetched = await purchaseService.getAllForReport(startDate, endDate, purchases);
        } else if (activeReport.includes("Wastage")) {
          fetched = await wastageService.getAllForReport(startDate, endDate, wastageRecords);
        } else if (activeReport.includes("Expenses")) {
          fetched = await expenseService.getAllForReport(startDate, endDate, expenses);
        } else if (activeReport.includes("Receivables")) {
          fetched = customers;
        } else if (activeReport.includes("Payables")) {
          fetched = suppliers;
        } else if (activeReport.includes("Stock") || activeReport.includes("Batch")) {
          fetched = batches;
        } else if (activeReport.includes("Payment")) {
          fetched = await paymentService.getAllForReport(startDate, endDate, payments);
        } else {
          fetched = await paymentService.getAllForReport(startDate, endDate, payments);
        }

        if (isMounted) {
          setReportItems(fetched || []);
          setLoadingReport(false);
        }
      } catch (err) {
        if (isMounted) setLoadingReport(false);
      }
    }

    loadReportData();
    return () => { isMounted = false; };
  }, [activeReport, period, customStart, customEnd, sales, purchases, wastageRecords, expenses, payments, customers, suppliers, batches]);

  // Generate dataset, columns, and summary for active report
  const getReportContent = () => {
    if (!activeReport) return { columns: [], data: [], summary: [] };

    let columns = [];
    let data = [];
    let summary = [];

    if (activeReport === "Profit & Loss") {
      const pl = calculateProfitLoss({
        sales,
        purchases,
        expenses,
        wastageRecords,
        period,
        customStart,
        customEnd
      });

      summary = [
        { label: "Total Revenue", value: fmt(pl.totalSales), sub: `${pl.filteredSales.length} Completed Sales` },
        { label: "Cost of Goods (COGS)", value: fmt(pl.fishCost), sub: `${pl.filteredPurchases.length} Fish Purchases` },
        { label: "Operating Expenses", value: fmt(pl.totalOperatingExpenses), sub: `${pl.activeExpenseCategories.length} Active Categories` },
        { label: "Net Profit", value: fmt(pl.netProfit), sub: `Margin: ${pl.profitMargin}%` }
      ];

      columns = ["Line Item / Description", "Category", "Details / Breakdown", "Amount (PKR)"];
      data = [
        ["Total Sales Revenue", "Revenue", `${pl.filteredSales.length} Completed Sales`, fmt(pl.totalSales)],
        ["Cost of Goods Sold (COGS)", "Cost of Goods", `${pl.filteredPurchases.length} Fish Purchases`, `(${fmt(pl.fishCost)})`],
        ["GROSS PROFIT", "Gross Margin", `${pl.totalSales > 0 ? ((pl.grossProfit / pl.totalSales) * 100).toFixed(1) : "0.0"}% Margin`, fmt(pl.grossProfit)],
        ...pl.activeExpenseCategories.map(c => {
          const share = pl.totalOperatingExpenses > 0 ? ((c.amount / pl.totalOperatingExpenses) * 100).toFixed(1) : "0.0";
          return [
            `Operating: ${c.category}`,
            "Operating Expense",
            `${c.count} ${c.count === 1 ? "entry" : "entries"} (${share}%)`,
            `(${fmt(c.amount)})`
          ];
        }),
        ["Total Operating Expenses", "Operating Expenses", `${pl.filteredExpenses.length} Total Entries`, `(${fmt(pl.totalOperatingExpenses)})`],
        ...(pl.wasteLoss > 0 ? [
          ["Wastage Loss", "Losses", `${pl.filteredWastage.length} Records`, `(${fmt(pl.wasteLoss)})`]
        ] : []),
        ["NET PROFIT / (LOSS)", "Net Profit", `Margin: ${pl.profitMargin}%`, fmt(pl.netProfit)]
      ];
    } else if (activeReport.includes("Sales")) {
      const filtered = reportItems;
      columns = ["Invoice No", "Date", "Customer", "Fish", "Qty (KG)", "Total Amount", "Paid", "Due", "Status"];
      data = filtered.map(s => [
        s.invoiceNo,
        s.date,
        s.customerName,
        s.fishName,
        `${s.qtyKg} KG`,
        fmt(s.grandTotal),
        fmt(s.paid),
        fmt(s.due),
        (s.status || "unpaid").toUpperCase()
      ]);
      const totalAmount = filtered.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
      const totalPaid = filtered.reduce((acc, s) => acc + (s.paid || 0), 0);
      const totalKg = filtered.reduce((acc, s) => acc + (parseFloat(s.qtyKg) || 0), 0);
      const roundedKg = Math.round(totalKg * 100) / 100;
      summary = [
        { label: "Total Sales", value: fmt(totalAmount) },
        { label: "Total Paid", value: fmt(totalPaid) },
        { label: "Total Sales (KG)", value: `${roundedKg} KG` },
        { label: "Invoices Count", value: filtered.length.toString() }
      ];
    } else if (activeReport.includes("Purchase")) {
      const filtered = reportItems;
      columns = ["Purchase No", "Date", "Supplier", "Fish", "Qty (KG)", "Rate/KG", "Total Cost", "Paid", "Remaining"];
      data = filtered.map(p => [
        p.purchaseNo,
        p.date,
        p.supplierName,
        p.fishName,
        `${p.qtyKg} KG`,
        fmt(p.ratePerKg),
        fmt(p.totalCost),
        fmt(p.paid),
        fmt(p.remaining)
      ]);
      const totalCost = filtered.reduce((acc, p) => acc + (p.totalCost || 0), 0);
      const totalKg = filtered.reduce((acc, p) => acc + (parseFloat(p.qtyKg) || 0), 0);
      const roundedKg = Math.round(totalKg * 100) / 100;
      summary = [
        { label: "Total Purchase Cost", value: fmt(totalCost) },
        { label: "Total Purchase (KG)", value: `${roundedKg} KG` },
        { label: "Total Purchases Count", value: filtered.length.toString() }
      ];
    } else if (activeReport.includes("Stock") || activeReport.includes("Batch")) {
      columns = ["Batch ID", "Fish Type", "Supplier", "Purchase Date", "Original Qty", "Remaining (KG)"];
      data = batches.map(b => [
        `FB-${(b.id || "").slice(1).padStart(4, "0")}`,
        b.fishName,
        b.supplierName,
        b.purchaseDate,
        `${b.originalQty} KG`,
        `${b.remaining} KG`
      ]);
      const totalStock = batches.reduce((acc, b) => acc + (b.remaining || 0), 0);
      summary = [
        { label: "Total Stock", value: `${totalStock} KG` },
        { label: "Active Batches", value: batches.filter(b => b.remaining > 0).length.toString() }
      ];
    } else if (activeReport.includes("Wastage")) {
      const filtered = reportItems;
      columns = ["ID", "Date", "Fish Name", "Qty (KG)", "Reason", "Loss Amount"];
      data = filtered.map(w => [
        w.id,
        w.date,
        w.fishName || "Unspecified",
        `${w.qtyKg} KG`,
        w.reason,
        fmt(w.totalLoss)
      ]);
      const totalLoss = filtered.reduce((acc, w) => acc + (w.totalLoss || 0), 0);
      const totalKg = filtered.reduce((acc, w) => acc + (w.qtyKg || 0), 0);
      summary = [
        { label: "Total Loss Amount", value: fmt(totalLoss) },
        { label: "Wastage Qty", value: `${totalKg} KG` }
      ];
    } else if (activeReport.includes("Expenses")) {
      const filtered = reportItems;
      columns = ["ID", "Date", "Category", "Description", "Amount", "Payment Method", "Paid By"];
      data = filtered.map(e => [
        e.id,
        e.date,
        e.category,
        e.description,
        fmt(e.amount),
        e.paymentMethod,
        e.paidBy
      ]);
      const totalExp = filtered.reduce((acc, e) => acc + (e.amount || 0), 0);
      summary = [
        { label: "Total Expenses", value: fmt(totalExp) },
        { label: "Entries", value: filtered.length.toString() }
      ];
    } else if (activeReport.includes("Receivables")) {
      columns = ["Customer Name", "Phone", "Total Sales", "Paid Amount", "Due Balance", "Status"];
      data = customers.map(c => [
        c.name,
        c.phone,
        fmt(c.totalSales),
        fmt(c.paid),
        fmt(c.due),
        c.due > 0 ? "DUE" : "CLEAR"
      ]);
      const totalDue = customers.reduce((acc, c) => acc + (c.due || 0), 0);
      summary = [
        { label: "Total Receivables Due", value: fmt(totalDue) },
        { label: "Customers", value: customers.length.toString() }
      ];
    } else if (activeReport.includes("Payables")) {
      columns = ["Supplier Name", "Category", "Phone", "Total Purchases", "Paid Amount", "Payable Balance"];
      data = suppliers.map(s => [
        s.name,
        s.supplierType || "Fish",
        s.phone,
        fmt(s.totalPurchases),
        fmt(s.paid),
        fmt(s.payable)
      ]);
      const totalPayable = suppliers.reduce((acc, s) => acc + (s.payable || 0), 0);
      summary = [
        { label: "Total Payables Balance", value: fmt(totalPayable) },
        { label: "Suppliers", value: suppliers.length.toString() }
      ];
    } else {
      // Payment Report
      const filtered = reportItems;
      columns = ["Payment ID", "Date", "Type", "Party Name", "Ref No", "Amount", "Method"];
      data = filtered.map(p => [
        p.id,
        p.date,
        (p.type || "").toUpperCase(),
        p.partyName,
        p.refNo || "N/A",
        fmt(p.amount),
        p.method
      ]);
      const totalPaid = filtered.reduce((acc, p) => acc + (p.amount || 0), 0);
      summary = [
        { label: "Total Payments", value: fmt(totalPaid) },
        { label: "Transaction Count", value: filtered.length.toString() }
      ];
    }

    return { columns, data, summary };
  };

  const { columns, data, summary } = getReportContent();

  const plData = activeReport === "Profit & Loss"
    ? calculateProfitLoss({ sales, purchases, expenses, wastageRecords, period, customStart, customEnd })
    : null;

  const handleExportPDF = () => {
    if (!activeReport) return;
    const periodLabel = period === "custom" ? `${customStart} to ${customEnd}` : period.toUpperCase();
    exportReportToPDF({
      title: activeReport,
      businessName: "Royalion",
      period: periodLabel,
      columns,
      data,
      summary
    });
    showToast(`PDF Report "${activeReport}" exported successfully!`, "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      {/* Background Reports Selection Page — explicitly hidden during print */}
      <div className="reports-list-page space-y-4 sm:space-y-6">
        <PageHeader
          title={tr.reports}
          subtitle="Generate, preview, and export official PDF business reports"
        />

        {/* Grid of Available Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportGroups.map(group => {
            const Icon = group.icon;
            return (
              <SummaryCard key={group.label}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: group.color }}>
                    <Icon size={18} color="white" />
                  </div>
                  <h3 className="font-bold" style={{ fontFamily: "Outfit", color: "var(--foreground)" }}>
                    {group.label}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.reports.map(r => (
                    <button
                      key={r}
                      className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
                        activeReport === r ? "bg-slate-900 text-white font-medium" : "hover:bg-slate-50 text-slate-700"
                      }`}
                      onClick={() => setActiveReport(r)}
                    >
                      <span className="text-sm">{r}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold transition-all ${
                            activeReport === r ? "bg-amber-400 text-slate-900" : "bg-blue-100 text-blue-800 opacity-80 group-hover:opacity-100"
                          }`}
                        >
                          PDF
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </SummaryCard>
            );
          })}
        </div>
      </div>

      {/* Report Preview & Export Modal / Card */}
      {activeReport && (
        <Modal open={Boolean(activeReport)} onClose={() => setActiveReport(null)} title={`Report: ${activeReport}`} size="xl">
          <div className="space-y-4">
            {/* Header Toolbar — hidden in print */}
            <div className="report-modal-chrome flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
              <div className="flex items-center gap-2 flex-wrap">
                <DateFilter
                  active={period}
                  onChange={setPeriod}
                  labels={[tr.today, tr.thisWeek, tr.thisMonth, tr.custom]}
                  values={["today", "week", "month", "custom"]}
                />
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

              <div className="flex items-center gap-2">
                <Btn variant="secondary" icon={<Printer size={14} />} onClick={handlePrint}>
                  Print
                </Btn>
                <Btn variant="accent" icon={<Download size={14} />} onClick={handleExportPDF}>
                  Export PDF
                </Btn>
              </div>
            </div>

            {/* Dedicated Printable Container */}
            <div className="report-printable report-print-area space-y-4">
              {/* Print-Only Official Report Header */}
              <div className="report-print-header hidden print:block pb-3 mb-4 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{`Report: ${activeReport}`}</h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Period: <span className="font-semibold">{period === "custom" ? `${customStart} to ${customEnd}` : period.toUpperCase()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">Royalion ERP</div>
                    <div className="text-xs text-slate-500">Printed: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Summary Row (KPI Cards) */}
              {summary.length > 0 && (
                <div className={`grid grid-cols-2 ${summary.length === 4 ? "sm:grid-cols-4 print:grid-cols-4" : summary.length === 3 ? "sm:grid-cols-3 print:grid-cols-3" : "sm:grid-cols-2 print:grid-cols-2"} gap-3`}>
                  {summary.map(s => (
                    <div key={s.label} className="bg-white border rounded-xl p-3 text-center print:border-slate-300 print:p-2">
                      <div className="text-xs text-slate-500 font-semibold">{s.label}</div>
                      <div className="text-lg font-bold mono text-slate-800 mt-0.5">{s.value}</div>
                      {s.sub && <div className="text-xs text-slate-400 mt-1">{s.sub}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Profit & Loss Visual Statement & Expense Breakdown */}
              {activeReport === "Profit & Loss" && plData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* P&L Statement */}
                  <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
                    <h3 className="text-sm font-bold mb-3 flex items-center justify-between" style={{ fontFamily: "Outfit" }}>
                      <span>Profit & Loss Statement</span>
                      <span className="text-xs font-normal text-slate-400 uppercase tracking-wide">
                        Period: {period === "custom" ? `${customStart} to ${customEnd}` : period.toUpperCase()}
                      </span>
                    </h3>

                    <div className="mb-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-400">Revenue</div>
                      <StatRow label="Total Sales Revenue" value={fmt(plData.totalSales)} color="#16a34a" />
                    </div>

                    <div className="mb-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-400">Cost of Goods Sold</div>
                      <StatRow label={`Fish Purchase Cost (${plData.filteredPurchases.length} Purchases)`} value={fmt(plData.fishCost)} color="#dc2626" />
                    </div>

                    <div className="rounded-lg p-2.5 mb-3 bg-emerald-50">
                      <StatRow label="Gross Profit" value={fmt(plData.grossProfit)} color="#16a34a" />
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-400">
                        <span>Operating Expenses</span>
                        <span>{fmt(plData.totalOperatingExpenses)}</span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {plData.activeExpenseCategories.length > 0 ? (
                          plData.activeExpenseCategories.map(c => (
                            <StatRow key={c.category} label={c.category} value={fmt(c.amount)} color={P_L_CATEGORY_COLORS[c.category] || "#d97706"} />
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic py-1">No recorded operating expenses for this period</div>
                        )}
                      </div>
                    </div>

                    {plData.wasteLoss > 0 && (
                      <div className="mb-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-400">Losses</div>
                        <StatRow label="Wastage Loss" value={fmt(plData.wasteLoss)} color="#dc2626" />
                      </div>
                    )}

                    <div className={`rounded-lg p-3 ${plData.netProfit >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-base" style={{ fontFamily: "Outfit" }}>Net Profit</span>
                        <span className={`text-xl font-bold mono ${plData.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {fmt(plData.netProfit)}
                        </span>
                      </div>
                      <div className="text-[11px] mt-1 flex justify-between items-center text-slate-500">
                        <span>Profit Margin: {plData.profitMargin}%</span>
                        <span>Formula: Revenue − COGS − Operating Expenses − Wastage</span>
                      </div>
                    </div>
                  </div>

                  {/* Expense Category Breakdown */}
                  <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: "Outfit" }}>Operating Expense Breakdown</h3>
                        <p className="text-[11px] text-slate-500">Categorized expenditure for selected period</p>
                      </div>
                      <div className="text-xs font-bold mono bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                        Total: {fmt(plData.totalOperatingExpenses)}
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
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
                          {plData.expenseBreakdown.map(c => {
                            const share = plData.totalOperatingExpenses > 0 ? ((c.amount / plData.totalOperatingExpenses) * 100).toFixed(1) : "0.0";
                            return (
                              <tr key={c.category} className={c.amount > 0 ? "hover:bg-slate-50" : "opacity-40"}>
                                <td className="py-2 font-medium flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: P_L_CATEGORY_COLORS[c.category] || "#94a3b8" }}></span>
                                  <span className="truncate">{c.category}</span>
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
                  </div>
                </div>
              )}

              {/* Data Table Preview / Official Statement Table */}
              <div className="overflow-x-auto max-h-96 border rounded-xl print:max-h-none print:overflow-visible print:border-none">
                <table className="data-table w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900 text-white print:static print:bg-slate-800">
                    <tr>
                      {columns.map((col, i) => (
                        <th key={i} className="py-2.5 px-3 text-left font-bold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length > 0 ? (
                      data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-3">{cell}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length || 1} className="py-8 text-center text-slate-400 italic">
                          No records available for the selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="report-modal-chrome flex justify-between items-center mt-6 pt-3 border-t no-print">
            <span className="text-xs text-slate-400">Branded header: Royalion</span>
            <Btn variant="secondary" onClick={() => setActiveReport(null)}>Close Preview</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

