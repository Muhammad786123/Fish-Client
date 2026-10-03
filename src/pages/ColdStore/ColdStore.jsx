import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, KPICard, SummaryCard, fmt, Btn } from "../../components/common/ui";
import { Snowflake, Package, Search, Download, Printer, Box } from "lucide-react";
import { exportReportToPDF } from "../../utils/pdfExport";

export default function ColdStore() {
  const { lang, fishTypes, showToast } = useApp();
  const tr = t[lang];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculate instant cold store summary metrics
  const totalStockKg = fishTypes.reduce((acc, f) => acc + (f.currentStock || 0), 0);
  const totalStockValue = fishTypes.reduce((acc, f) => acc + ((f.currentStock || 0) * (f.avgPurchaseRate || 0)), 0);
  const activeTypesCount = fishTypes.filter((f) => (f.currentStock || 0) > 0).length;

  // Map packaging / carton sizes per fish type
  const stockItems = fishTypes.map((fish) => {
    const stockKg = fish.currentStock || 0;
    // Derive carton sizes based on stock or mock batches
    let cartonSize = "10 KG Carton";
    let cartonCount = Math.floor(stockKg / 10);
    if (fish.name === "Surmai" || fish.name === "King Fish") {
      cartonSize = "15 KG Box";
      cartonCount = Math.floor(stockKg / 15);
    } else if (fish.name === "Rohu" || fish.name === "Tilapia") {
      cartonSize = "20 KG Crate";
      cartonCount = Math.floor(stockKg / 20);
    } else if (fish.name === "Pomfret" || fish.name === "Trout") {
      cartonSize = "7 KG Carton";
      cartonCount = Math.floor(stockKg / 7);
    }

    const stockValue = stockKg * (fish.avgPurchaseRate || 0);
    let stockStatus = "Optimal";
    if (stockKg === 0) {
      stockStatus = "Out of Stock";
    } else if (stockKg < 50) {
      stockStatus = "Low Stock";
    }

    return {
      ...fish,
      stockKg,
      cartonSize,
      cartonCount,
      stockValue,
      stockStatus,
    };
  });

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || (item.urduName && item.urduName.includes(search));
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "in-stock"
        ? item.stockKg > 0
        : statusFilter === "low"
        ? item.stockStatus === "Low Stock"
        : item.stockStatus === "Out of Stock";
    return matchesSearch && matchesStatus;
  });

  const handleExportPDF = () => {
    const columns = ["Fish Type", "Available Stock (KG)", "Carton / Packing Size", "Cartons in Stock", "Avg Purchase Rate", "Avg Sale Rate", "Stock Value", "Status"];
    const data = filteredItems.map((item) => [
      item.name,
      `${item.stockKg} KG`,
      item.cartonSize,
      `${item.cartonCount} units`,
      fmt(item.avgPurchaseRate || 0),
      fmt(item.avgSaleRate || 0),
      fmt(item.stockValue),
      item.stockStatus.toUpperCase(),
    ]);

    exportReportToPDF({
      title: "Current Stock Inventory Report",
      businessName: "Royalion",
      period: "Instant Stock Snapshot",
      columns,
      data,
      summary: [
        { label: "Total Current Stock", value: `${totalStockKg} KG` },
        { label: "Total Stock Value", value: fmt(totalStockValue) },
        { label: "Active Fish Types", value: activeTypesCount.toString() },
      ],
    });
    showToast("Current Stock inventory PDF exported!", "success");
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title="Current Stock Inventory"
        subtitle="Real-time overview of available fish stock, carton sizes, and inventory valuations"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportPDF}>
              Export Stock PDF
            </Btn>
            <Btn variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
              Print
            </Btn>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <KPICard label="Total Current Stock" value={`${totalStockKg} KG`} icon={<Snowflake size={18} />} />
        <KPICard label="Total Stock Value" value={fmt(totalStockValue)} icon={<Package size={18} />} />
        <KPICard label="Active Fish Varieties" value={activeTypesCount} icon={<Box size={18} />} />
      </div>

      {/* Inventory Table & Filters */}
      <SummaryCard>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-0 max-w-md" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              className="flex-1 text-sm bg-transparent outline-none"
              placeholder="Search fish type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm rounded-lg border"
            style={{ borderColor: "var(--border)", background: "#f8fafc" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Stock Status</option>
            <option value="in-stock">Available Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">No cold store inventory items match your search filter.</div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {filteredItems.map((item) => (
                <div key={item.id} className="border rounded-xl p-3 bg-white space-y-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-base">{item.name}</div>
                      {item.urduName && <div className="text-xs text-slate-500">{item.urduName}</div>}
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        item.stockStatus === "Optimal"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.stockStatus === "Low Stock"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {item.stockStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <span className="text-slate-500">Available Stock:</span>
                      <div className="font-bold text-slate-800 text-sm mono">{item.stockKg} KG</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Carton Size:</span>
                      <div className="font-medium text-slate-700">{item.cartonSize}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Cartons in Stock:</span>
                      <div className="font-semibold text-blue-700">{item.cartonCount} units</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Stock Valuation:</span>
                      <div className="font-bold text-emerald-700 mono">{fmt(item.stockValue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Fish Type</th>
                    <th>Available Stock (KG)</th>
                    <th>Carton / Packing Size</th>
                    <th>Est. Cartons</th>
                    <th>Avg Purchase Rate</th>
                    <th>Avg Sale Rate</th>
                    <th>Stock Value (Rs)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        {item.urduName && <div className="text-xs text-slate-400">{item.urduName}</div>}
                      </td>
                      <td className="mono font-bold text-slate-800 text-base">{item.stockKg} KG</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold text-xs border border-blue-200">
                          <Box size={13} /> {item.cartonSize}
                        </span>
                      </td>
                      <td className="mono font-semibold text-slate-700">{item.cartonCount} units</td>
                      <td className="mono text-slate-600">{fmt(item.avgPurchaseRate || 0)}</td>
                      <td className="mono text-slate-600">{fmt(item.avgSaleRate || 0)}</td>
                      <td className="mono font-bold text-emerald-700">{fmt(item.stockValue)}</td>
                      <td>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.stockStatus === "Optimal"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.stockStatus === "Low Stock"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SummaryCard>
    </div>
  );
}
