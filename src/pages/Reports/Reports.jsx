import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, DateFilter, Btn, fmt, Modal, Badge } from "../../components/common/ui";
import { ShoppingCart, Package, Snowflake, AlertTriangle, DollarSign, FileText, Download, Printer, Filter, X } from "lucide-react";
import { exportReportToPDF } from "../../utils/pdfExport";
import { filterItemsByPeriod, getDateRangeForPeriod, toLocalDateStr } from "../../utils/dateUtils";
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
        if (activeReport.includes("Sales")) {
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

    if (activeReport.includes("Sales")) {
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
      summary = [
        { label: "Total Sales", value: fmt(totalAmount) },
        { label: "Total Paid", value: fmt(totalPaid) },
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
      // Default / Payment / P&L summary
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

  const handleExportPDF = () => {
    if (!activeReport) return;
    exportReportToPDF({
      title: activeReport,
      businessName: "Royalion",
      period: period.toUpperCase(),
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

      {/* Report Preview & Export Modal / Card */}
      {activeReport && (
        <Modal open={Boolean(activeReport)} onClose={() => setActiveReport(null)} title={`Report: ${activeReport}`} size="xl">
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
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

            {/* Dedicated Print Area: Scoped to ONLY report content during print */}
            <div className="report-print-area space-y-4">
              {/* Print-Only Official Report Header */}
              <div className="hidden print:block pb-3 mb-4 border-b border-slate-300">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
                  {summary.map(s => (
                    <div key={s.label} className="bg-white border rounded-xl p-3 text-center print:border-slate-300 print:p-2">
                      <div className="text-xs text-slate-500 font-semibold">{s.label}</div>
                      <div className="text-lg font-bold mono text-slate-800 mt-0.5">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table Preview */}
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

          <div className="flex justify-between items-center mt-6 pt-3 border-t no-print">
            <span className="text-xs text-slate-400">Branded header: Royalion</span>
            <Btn variant="secondary" onClick={() => setActiveReport(null)}>Close Preview</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

