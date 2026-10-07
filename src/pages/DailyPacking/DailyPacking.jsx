import React, { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, KPICard, SummaryCard, Modal, Confirm, Field, Input, Select, Btn, Badge } from "../../components/common/ui";
import { Box, Plus, Trash2, Edit, Eye, Printer, Download, Search, Calendar, Check, AlertCircle, PackageCheck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Standard Count/Size options for quick selection or user typing
const STANDARD_COUNT_SIZES = [
  "10/12",
  "12/15",
  "16/20",
  "21/25",
  "26/30",
  "30/40",
  "40/50",
  "50/60",
  "60/70",
  "70/80"
];

// Color palettes for fish type section header bands (mirroring the Excel sheet look)
const SECTION_HEADER_COLORS = [
  { bg: "#0f2d5a", text: "#ffffff", border: "#1e3a8a", sub: "#dbeafe" }, // Deep Blue
  { bg: "#0d9488", text: "#ffffff", border: "#0f766e", sub: "#ccfbf1" }, // Teal
  { bg: "#7c3aed", text: "#ffffff", border: "#6d28d9", sub: "#ede9fe" }, // Violet
  { bg: "#b45309", text: "#ffffff", border: "#92400e", sub: "#fef3c7" }, // Amber
  { bg: "#0369a1", text: "#ffffff", border: "#075985", sub: "#e0f2fe" }  // Sky
];

export default function DailyPacking() {
  const {
    lang,
    dailyPackingRecords = [],
    fishTypes = [],
    addDailyPacking,
    updateDailyPacking,
    deleteDailyPacking,
    currentUser,
    showToast
  } = useApp();

  const tr = t[lang] || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editingRecord, setEditingRecord] = useState(null);

  const [detailRecord, setDetailRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filter records by search and date
  const filteredRecords = dailyPackingRecords.filter((rec) => {
    const matchesSearch =
      !searchTerm ||
      rec.date.includes(searchTerm) ||
      (rec.createdBy && rec.createdBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rec.sections.some((s) => s.fishName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate = !dateFilter || rec.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Overall metrics
  const totalDaysPacked = dailyPackingRecords.length;
  const totalGrandCartons = dailyPackingRecords.reduce((acc, rec) => {
    return (
      acc +
      (rec.sections || []).reduce((secAcc, sec) => {
        return (
          secAcc +
          (sec.rows || []).reduce((rowAcc, r) => rowAcc + (Number(r.gradeA) || 0) + (Number(r.gradeB) || 0), 0)
        );
      }, 0)
    );
  }, 0);

  const totalGrandKg = dailyPackingRecords.reduce((acc, rec) => {
    return (
      acc +
      (rec.sections || []).reduce((secAcc, sec) => {
        const kgCtn = Number(sec.kgPerCarton) || 0;
        return (
          secAcc +
          (sec.rows || []).reduce(
            (rowAcc, r) => rowAcc + ((Number(r.gradeA) || 0) + (Number(r.gradeB) || 0)) * kgCtn,
            0
          )
        );
      }, 0)
    );
  }, 0);

  const handleOpenNew = () => {
    setEditingRecord(null);
    setModalKey((k) => k + 1);
    setIsFormOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteDailyPacking(deleteId);
      showToast("Daily Packing record deleted successfully", "info");
      setDeleteId(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      {/* Header */}
      <PageHeader
        title={tr.dailyPacking || "Daily Packing"}
        subtitle="Record & track daily carton packing by fish type, count/size grade, and quality tier (A / B)"
        actions={
          <Btn variant="primary" onClick={handleOpenNew} className="flex items-center gap-2">
            <Plus size={16} />
            <span>+ Add Daily Packing</span>
          </Btn>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KPICard
          label="Total Packing Days"
          value={totalDaysPacked.toLocaleString()}
          icon={<Calendar size={22} color="white" />}
          iconBg="var(--primary)"
        />
        <KPICard
          label="Total Cartons Packed"
          value={`${totalGrandCartons.toLocaleString()} Ctns`}
          icon={<Box size={22} color="white" />}
          iconBg="#7c3aed"
        />
        <KPICard
          label="Total Weight Packed"
          value={`${totalGrandKg.toLocaleString()} KG`}
          icon={<PackageCheck size={22} color="white" />}
          iconBg="var(--accent)"
        />
      </div>

      {/* Filter Bar & History List */}
      <SummaryCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit" }}>
            Daily Packing Records
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by fish, date, staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-36 text-xs sm:text-sm"
            />
            {dateFilter && (
              <button
                className="text-xs font-semibold text-red-600 hover:underline px-2"
                onClick={() => setDateFilter("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fish Types Packed</th>
                <th>Total Cartons</th>
                <th>Total Weight (KG)</th>
                <th>Recorded By</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                    No Daily Packing records found. Click "+ Add Daily Packing" to create one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const dayCtns = (rec.sections || []).reduce((sum, sec) => {
                    return (
                      sum +
                      (sec.rows || []).reduce(
                        (rSum, r) => rSum + (Number(r.gradeA) || 0) + (Number(r.gradeB) || 0),
                        0
                      )
                    );
                  }, 0);

                  const dayKg = (rec.sections || []).reduce((sum, sec) => {
                    const kgCtn = Number(sec.kgPerCarton) || 0;
                    return (
                      sum +
                      (sec.rows || []).reduce(
                        (rSum, r) =>
                          rSum + ((Number(r.gradeA) || 0) + (Number(r.gradeB) || 0)) * kgCtn,
                        0
                      )
                    );
                  }, 0);

                  const fishNames = (rec.sections || []).map((s) => s.fishName).filter(Boolean).join(", ");

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-semibold text-slate-800">{rec.date}</td>
                      <td>
                        <span className="font-medium text-slate-700">{fishNames || "None"}</span>
                        <span className="text-xs text-slate-400 block font-mono">
                          {rec.sections?.length || 0} fish type(s)
                        </span>
                      </td>
                      <td className="font-mono font-semibold text-slate-700">
                        {dayCtns.toLocaleString()} Ctns
                      </td>
                      <td className="font-mono font-bold text-teal-700">
                        {dayKg.toLocaleString()} KG
                      </td>
                      <td className="text-slate-500 text-xs font-medium">{rec.createdBy || "System"}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="View Sheet Details"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            onClick={() => setDetailRecord(rec)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            title="Edit Record"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => handleEdit(rec)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            title="Delete Record"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
                            onClick={() => setDeleteId(rec.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SummaryCard>

      {/* Entry/Edit Form Modal */}
      {isFormOpen && (
        <DailyPackingFormModal
          key={editingRecord ? `edit-${editingRecord.id}` : `new-${modalKey}`}
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingRecord={editingRecord}
          fishTypes={fishTypes}
          onSave={(recordData) => {
            if (editingRecord) {
              updateDailyPacking(recordData);
              showToast("Daily Packing record updated", "success");
            } else {
              addDailyPacking(recordData);
              showToast("Daily Packing record saved successfully", "success");
            }
            setIsFormOpen(false);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Details / Print Modal */}
      {detailRecord && (
        <DailyPackingDetailModal
          open={Boolean(detailRecord)}
          onClose={() => setDetailRecord(null)}
          record={detailRecord}
        />
      )}

      {/* Delete Confirmation */}
      <Confirm
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Daily Packing Record"
        message="Are you sure you want to delete this packing record? This action cannot be undone."
        danger
      />
    </div>
  );
}

// ── Daily Packing Entry / Edit Form Modal Component ─────────────────────────────

function DailyPackingFormModal({ open, onClose, editingRecord, fishTypes, onSave, currentUser }) {
  const [date, setDate] = useState(
    editingRecord?.date || new Date().toISOString().slice(0, 10)
  );
  const [createdBy, setCreatedBy] = useState(
    editingRecord?.createdBy || currentUser?.name || "Admin"
  );

  // Initialize sections state
  const [sections, setSections] = useState(() => {
    if (editingRecord?.sections && editingRecord.sections.length > 0) {
      return JSON.parse(JSON.stringify(editingRecord.sections));
    }
    // Default initial section
    const defaultFish = fishTypes[0] || { id: "f1", name: "Sardine" };
    return [
      {
        fishTypeId: defaultFish.id,
        fishName: defaultFish.name,
        kgPerCarton: 10,
        rows: [
          { countSize: "12/15", gradeA: 0, gradeB: 0 },
          { countSize: "16/20", gradeA: 0, gradeB: 0 }
        ]
      }
    ];
  });

  // Handle adding a new fish type section
  const handleAddSection = () => {
    const usedIds = sections.map((s) => s.fishTypeId);
    const available = fishTypes.find((f) => !usedIds.includes(f.id)) || fishTypes[0] || { id: "f1", name: "Fish" };
    setSections((prev) => [
      ...prev,
      {
        fishTypeId: available.id,
        fishName: available.name,
        kgPerCarton: 10,
        rows: [{ countSize: "12/15", gradeA: 0, gradeB: 0 }]
      }
    ]);
  };

  // Handle removing a fish type section
  const handleRemoveSection = (secIndex) => {
    if (sections.length <= 1) {
      alert("At least one fish type section is required for a packing record.");
      return;
    }
    setSections((prev) => prev.filter((_, idx) => idx !== secIndex));
  };

  // Handle fish type selection change
  const handleFishTypeChange = (secIndex, fishTypeId) => {
    const selected = fishTypes.find((f) => f.id === fishTypeId);
    if (!selected) return;

    setSections((prev) => {
      const updated = [...prev];
      updated[secIndex] = {
        ...updated[secIndex],
        fishTypeId: selected.id,
        fishName: selected.name
      };
      return updated;
    });
  };

  // Handle kgPerCarton change
  const handleKgPerCartonChange = (secIndex, value) => {
    const val = parseFloat(value) || 0;
    setSections((prev) => {
      const updated = [...prev];
      updated[secIndex] = {
        ...updated[secIndex],
        kgPerCarton: val
      };
      return updated;
    });
  };

  // Handle adding a grade row to a section
  const handleAddRow = (secIndex) => {
    setSections((prev) => {
      const updated = [...prev];
      const secRows = updated[secIndex].rows || [];
      const nextDefaultSize = STANDARD_COUNT_SIZES[secRows.length % STANDARD_COUNT_SIZES.length] || "12/15";
      updated[secIndex] = {
        ...updated[secIndex],
        rows: [...secRows, { countSize: nextDefaultSize, gradeA: 0, gradeB: 0 }]
      };
      return updated;
    });
  };

  // Handle removing a row from a section
  const handleRemoveRow = (secIndex, rowIndex) => {
    setSections((prev) => {
      const updated = [...prev];
      const secRows = updated[secIndex].rows.filter((_, rIdx) => rIdx !== rowIndex);
      updated[secIndex] = {
        ...updated[secIndex],
        rows: secRows
      };
      return updated;
    });
  };

  // Handle row input change
  const handleRowChange = (secIndex, rowIndex, field, value) => {
    setSections((prev) => {
      const updated = [...prev];
      const secRows = [...updated[secIndex].rows];
      secRows[rowIndex] = {
        ...secRows[rowIndex],
        [field]: field === "countSize" ? value : Math.max(0, parseInt(value, 10) || 0)
      };
      updated[secIndex] = {
        ...updated[secIndex],
        rows: secRows
      };
      return updated;
    });
  };

  // Summary Computations
  const summaryList = sections.map((sec) => {
    const kgCtn = Number(sec.kgPerCarton) || 0;
    const totalCtns = (sec.rows || []).reduce(
      (sum, r) => sum + (Number(r.gradeA) || 0) + (Number(r.gradeB) || 0),
      0
    );
    const totalKg = totalCtns * kgCtn;
    return {
      fishName: sec.fishName || "Unspecified",
      kgPerCarton: kgCtn,
      totalCtns,
      totalKg
    };
  });

  const grandTotalCtns = summaryList.reduce((acc, s) => acc + s.totalCtns, 0);
  const grandTotalKg = summaryList.reduce((acc, s) => acc + s.totalKg, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) {
      alert("Please select a date.");
      return;
    }

    if (sections.length === 0) {
      alert("Please add at least one fish section.");
      return;
    }

    const payload = {
      id: editingRecord ? editingRecord.id : `dp_${Date.now()}`,
      date,
      createdBy,
      sections: sections.map((sec) => ({
        fishTypeId: sec.fishTypeId,
        fishName: sec.fishName,
        kgPerCarton: Number(sec.kgPerCarton) || 0,
        rows: (sec.rows || []).map((r) => ({
          countSize: r.countSize || "Standard",
          gradeA: Number(r.gradeA) || 0,
          gradeB: Number(r.gradeB) || 0
        }))
      }))
    };

    onSave(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingRecord ? "Edit Daily Packing Record" : "New Daily Packing Record"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Controls: Date & Operator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <Field label="Packing Date" required>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Recorded By Staff / Operator">
            <Input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="Operator name"
            />
          </Field>
        </div>

        {/* Fish Type Sections */}
        <div className="space-y-6">
          {sections.map((sec, secIdx) => {
            const colorScheme = SECTION_HEADER_COLORS[secIdx % SECTION_HEADER_COLORS.length];
            const kgCtn = Number(sec.kgPerCarton) || 0;

            const secGradeATotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeA) || 0), 0);
            const secGradeBTotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeB) || 0), 0);
            const secCtnsTotal = secGradeATotal + secGradeBTotal;
            const secKgTotal = secCtnsTotal * kgCtn;

            return (
              <div
                key={secIdx}
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Section Color Header Band (Matching Excel Sheet Design) */}
                <div
                  className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{ background: colorScheme.bg, color: colorScheme.text }}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="font-bold text-sm tracking-wide uppercase font-mono px-2 py-0.5 rounded bg-white/20">
                      Fish #{secIdx + 1}
                    </span>
                    <select
                      className="px-3 py-1.5 text-sm font-bold rounded-lg border-0 bg-white text-slate-800 outline-none cursor-pointer"
                      value={sec.fishTypeId}
                      onChange={(e) => handleFishTypeChange(secIdx, e.target.value)}
                    >
                      {fishTypes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span>Standard Carton Size:</span>
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={sec.kgPerCarton}
                          onChange={(e) => handleKgPerCartonChange(secIdx, e.target.value)}
                          className="w-12 bg-white text-slate-900 font-bold text-center text-xs rounded outline-none px-1"
                        />
                        <span className="text-white">KG P/Ctn</span>
                      </div>
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(secIdx)}
                        className="text-xs bg-red-600/80 hover:bg-red-600 text-white font-semibold px-2.5 py-1 rounded transition-colors"
                      >
                        Remove Section
                      </button>
                    )}
                  </div>
                </div>

                {/* Grade Rows Table */}
                <div className="p-3 sm:p-4 bg-white overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b text-slate-500 font-semibold uppercase text-2xs tracking-wider">
                        <th className="py-2 px-2 text-left w-36">Count / Size Grade</th>
                        <th className="py-2 px-2 text-center w-28">Grade A (Ctns)</th>
                        <th className="py-2 px-2 text-center w-28">Grade B (Ctns)</th>
                        <th className="py-2 px-2 text-center w-32 bg-slate-50">Total (Ctns)</th>
                        <th className="py-2 px-2 text-right w-36 bg-slate-50">Total (KG)</th>
                        <th className="py-2 px-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(sec.rows || []).map((row, rIdx) => {
                        const rGradeA = Number(row.gradeA) || 0;
                        const rGradeB = Number(row.gradeB) || 0;
                        const rTotalCtn = rGradeA + rGradeB;
                        const rTotalKg = rTotalCtn * kgCtn;

                        return (
                          <tr key={rIdx} className="hover:bg-slate-50/70">
                            {/* Count/Size Grade */}
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                list={`sizes-list-${secIdx}`}
                                value={row.countSize}
                                onChange={(e) =>
                                  handleRowChange(secIdx, rIdx, "countSize", e.target.value)
                                }
                                placeholder="e.g. 12/15"
                                className="w-full px-2 py-1 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-blue-500"
                              />
                              <datalist id={`sizes-list-${secIdx}`}>
                                {STANDARD_COUNT_SIZES.map((sz) => (
                                  <option key={sz} value={sz} />
                                ))}
                              </datalist>
                            </td>

                            {/* Grade A cartons */}
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.gradeA}
                                onChange={(e) =>
                                  handleRowChange(secIdx, rIdx, "gradeA", e.target.value)
                                }
                                className="w-20 px-2 py-1 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-blue-500"
                              />
                            </td>

                            {/* Grade B cartons */}
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.gradeB}
                                onChange={(e) =>
                                  handleRowChange(secIdx, rIdx, "gradeB", e.target.value)
                                }
                                className="w-20 px-2 py-1 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:border-blue-500"
                              />
                            </td>

                            {/* Auto-calculated Total Cartons */}
                            <td className="py-1.5 px-2 text-center bg-slate-50 font-bold font-mono text-slate-800">
                              {rTotalCtn}
                            </td>

                            {/* Auto-calculated Total KG */}
                            <td className="py-1.5 px-2 text-right bg-slate-50 font-bold font-mono text-teal-700">
                              {rTotalKg.toLocaleString()} KG
                            </td>

                            {/* Action: Delete Row */}
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(secIdx, rIdx)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Highlighted Section Total Row (Matching Excel Sheet Total Row) */}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td className="py-2.5 px-2 uppercase text-xs">
                          TOTAL ({sec.fishName})
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{secGradeATotal}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{secGradeBTotal}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-blue-900 bg-blue-100/60">
                          {secCtnsTotal} Ctns
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-teal-900 bg-teal-100/60">
                          {secKgTotal.toLocaleString()} KG
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Add Row Button */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleAddRow(secIdx)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add Grade / Count Row</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Section Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add Fish Type Section</span>
          </button>
        </div>

        {/* Bottom Summary Table (Matching Excel Sheet Grey Summary Section) */}
        <div className="bg-slate-800 text-white rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              SUMMARY — DAY'S PACKING TOTALS
            </h3>
            <span className="text-xs text-slate-400 font-mono">{date}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700 text-left uppercase text-2xs">
                  <th className="py-1 px-2">Fish Name</th>
                  <th className="py-1 px-2 text-center">Carton Size</th>
                  <th className="py-1 px-2 text-center">Total Cartons</th>
                  <th className="py-1 px-2 text-right">Total Weight (KG)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {summaryList.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="py-1.5 px-2 font-bold text-amber-400">{item.fishName}</td>
                    <td className="py-1.5 px-2 text-center text-slate-300">{item.kgPerCarton} KG P/Ctn</td>
                    <td className="py-1.5 px-2 text-center text-slate-200 font-bold">{item.totalCtns}</td>
                    <td className="py-1.5 px-2 text-right text-teal-300 font-bold">
                      {item.totalKg.toLocaleString()} KG
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="border-t-2 border-slate-500 bg-slate-900 text-white font-bold text-sm">
                  <td colSpan={2} className="py-2.5 px-2 uppercase tracking-wide text-amber-300">
                    GRAND TOTAL PACKED
                  </td>
                  <td className="py-2.5 px-2 text-center text-blue-300 text-base">
                    {grandTotalCtns.toLocaleString()} Ctns
                  </td>
                  <td className="py-2.5 px-2 text-right text-teal-400 text-base">
                    {grandTotalKg.toLocaleString()} KG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <Btn variant="primary" type="submit" className="px-6 py-2.5 text-sm font-bold">
            Save Daily Packing Record
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ── Daily Packing Detail / Printable Sheet Modal ─────────────────────────────────

function DailyPackingDetailModal({ open, onClose, record }) {
  if (!record) return null;

  const dateStr = record.date;
  const createdBy = record.createdBy || "System";

  // Calculate section totals
  const summaryList = (record.sections || []).map((sec) => {
    const kgCtn = Number(sec.kgPerCarton) || 0;
    const secGradeATotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeA) || 0), 0);
    const secGradeBTotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeB) || 0), 0);
    const totalCtns = secGradeATotal + secGradeBTotal;
    const totalKg = totalCtns * kgCtn;
    return {
      fishName: sec.fishName || "Unspecified",
      kgPerCarton: kgCtn,
      gradeA: secGradeATotal,
      gradeB: secGradeBTotal,
      totalCtns,
      totalKg
    };
  });

  const grandTotalCtns = summaryList.reduce((acc, s) => acc + s.totalCtns, 0);
  const grandTotalKg = summaryList.reduce((acc, s) => acc + s.totalKg, 0);

  const handlePrint = () => {
    window.print();
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(15, 45, 90);
    doc.rect(0, 0, 210, 16, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ROYAL N TRADING SYSTEM", 14, 11);

    doc.setFontSize(16);
    doc.setTextColor(15, 45, 90);
    doc.text("DAILY PACKING REPORT", 14, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${dateStr}   |   Recorded By: ${createdBy}`, 14, 35);

    let currentY = 42;

    // Loop through fish sections
    (record.sections || []).forEach((sec, idx) => {
      const kgCtn = Number(sec.kgPerCarton) || 0;

      // Section Title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 45, 90);
      doc.text(`${sec.fishName} (${kgCtn} KG P/Ctn)`, 14, currentY);
      currentY += 4;

      const tableRows = (sec.rows || []).map((r) => {
        const gA = Number(r.gradeA) || 0;
        const gB = Number(r.gradeB) || 0;
        const totCtn = gA + gB;
        const totKg = totCtn * kgCtn;
        return [r.countSize, gA, gB, totCtn, `${totKg.toLocaleString()} KG`];
      });

      const secGradeATotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeA) || 0), 0);
      const secGradeBTotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeB) || 0), 0);
      const secTotCtn = secGradeATotal + secGradeBTotal;
      const secTotKg = secTotCtn * kgCtn;

      tableRows.push([
        `TOTAL (${sec.fishName})`,
        secGradeATotal,
        secGradeBTotal,
        `${secTotCtn} Ctns`,
        `${secTotKg.toLocaleString()} KG`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Count / Size", "Grade A", "Grade B", "Total (Ctn)", "Total (KG)"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillStyle: "F", fillColor: [15, 45, 90], textColor: [255, 255, 255], fontStyle: "bold" },
        didParseCell: (data) => {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [226, 232, 240];
            data.cell.styles.textColor = [15, 45, 90];
          }
        },
        margin: { left: 14, right: 14 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    // Summary Table at bottom
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 45, 90);
    doc.text("SUMMARY — DAY'S PACKING TOTALS", 14, currentY);
    currentY += 4;

    const summaryRows = summaryList.map((s) => [
      s.fishName,
      `${s.kgPerCarton} KG P/Ctn`,
      s.totalCtns,
      `${s.totalKg.toLocaleString()} KG`
    ]);

    summaryRows.push([
      "GRAND TOTAL",
      "-",
      `${grandTotalCtns} Ctns`,
      `${grandTotalKg.toLocaleString()} KG`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Fish Type", "Carton Size", "Total Cartons", "Total Weight (KG)"]],
      body: summaryRows,
      theme: "grid",
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.row.index === summaryRows.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [15, 23, 42];
          data.cell.styles.textColor = [255, 255, 255];
        }
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Daily_Packing_${dateStr}.pdf`);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Daily Packing Sheet — ${dateStr}`} size="xl">
      <div className="space-y-6">
        {/* Printable Action Buttons */}
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl">
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            Recorded By: <strong className="text-slate-900">{createdBy}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={handlePrint} className="flex items-center gap-1.5 text-xs">
              <Printer size={15} />
              <span>Print Sheet</span>
            </Btn>
            <Btn variant="primary" onClick={handlePDFExport} className="flex items-center gap-1.5 text-xs">
              <Download size={15} />
              <span>Export PDF</span>
            </Btn>
          </div>
        </div>

        {/* Excel Sheet Mirror Layout */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm font-sans">
          {/* Top Banner */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-wide uppercase font-mono text-amber-400">
                DAILY PACKING RECORD
              </h2>
              <p className="text-xs text-slate-300">ROYAL N TRADING SYSTEM — PROCESSING & PACKING</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-teal-300">{dateStr}</div>
              <div className="text-2xs text-slate-400">Sheet ID: {record.id}</div>
            </div>
          </div>

          {/* Fish Sections */}
          <div className="p-4 space-y-6">
            {(record.sections || []).map((sec, secIdx) => {
              const colorScheme = SECTION_HEADER_COLORS[secIdx % SECTION_HEADER_COLORS.length];
              const kgCtn = Number(sec.kgPerCarton) || 0;

              const secGradeATotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeA) || 0), 0);
              const secGradeBTotal = (sec.rows || []).reduce((sum, r) => sum + (Number(r.gradeB) || 0), 0);
              const secCtnsTotal = secGradeATotal + secGradeBTotal;
              const secKgTotal = secCtnsTotal * kgCtn;

              return (
                <div key={secIdx} className="border border-slate-300 rounded-lg overflow-hidden">
                  {/* Fish Section Color Band */}
                  <div
                    className="px-4 py-2.5 flex items-center justify-between font-bold text-sm"
                    style={{ background: colorScheme.bg, color: colorScheme.text }}
                  >
                    <span className="uppercase tracking-wide font-mono text-base">{sec.fishName}</span>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded font-mono">
                      {kgCtn} KG P/Ctn
                    </span>
                  </div>

                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-2xs">
                        <th className="py-2 px-3 text-left">Count / Size</th>
                        <th className="py-2 px-3 text-center">Grade A (Ctns)</th>
                        <th className="py-2 px-3 text-center">Grade B (Ctns)</th>
                        <th className="py-2 px-3 text-center bg-slate-200/60">Total (Ctns)</th>
                        <th className="py-2 px-3 text-right bg-slate-200/60">Total (KG)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(sec.rows || []).map((row, rIdx) => {
                        const gA = Number(row.gradeA) || 0;
                        const gB = Number(row.gradeB) || 0;
                        const totCtn = gA + gB;
                        const totKg = totCtn * kgCtn;

                        return (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{row.countSize}</td>
                            <td className="py-2 px-3 text-center text-slate-700">{gA}</td>
                            <td className="py-2 px-3 text-center text-slate-700">{gB}</td>
                            <td className="py-2 px-3 text-center bg-slate-50 font-bold text-slate-900">
                              {totCtn}
                            </td>
                            <td className="py-2 px-3 text-right bg-slate-50 font-bold text-teal-800">
                              {totKg.toLocaleString()} KG
                            </td>
                          </tr>
                        );
                      })}

                      {/* Section Total Row */}
                      <tr className="bg-slate-200 font-bold text-slate-900 text-sm border-t-2 border-slate-400">
                        <td className="py-2.5 px-3 uppercase">TOTAL ({sec.fishName})</td>
                        <td className="py-2.5 px-3 text-center">{secGradeATotal}</td>
                        <td className="py-2.5 px-3 text-center">{secGradeBTotal}</td>
                        <td className="py-2.5 px-3 text-center bg-blue-100 text-blue-900">
                          {secCtnsTotal} Ctns
                        </td>
                        <td className="py-2.5 px-3 text-right bg-teal-100 text-teal-900">
                          {secKgTotal.toLocaleString()} KG
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Bottom Summary Table */}
            <div className="bg-slate-800 text-white rounded-lg p-4 font-mono space-y-3">
              <div className="text-xs uppercase font-bold tracking-wider text-amber-400 border-b border-slate-700 pb-2">
                SUMMARY — DAY'S PACKING TOTALS
              </div>
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-left uppercase text-2xs">
                    <th className="py-1 px-2">Fish Name</th>
                    <th className="py-1 px-2 text-center">Carton Size</th>
                    <th className="py-1 px-2 text-center">Total Cartons</th>
                    <th className="py-1 px-2 text-right">Total Weight (KG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {summaryList.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2 font-bold text-amber-300">{item.fishName}</td>
                      <td className="py-2 px-2 text-center text-slate-300">{item.kgPerCarton} KG P/Ctn</td>
                      <td className="py-2 px-2 text-center font-bold">{item.totalCtns}</td>
                      <td className="py-2 px-2 text-right text-teal-300 font-bold">
                        {item.totalKg.toLocaleString()} KG
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-500 bg-slate-900 text-white font-bold text-sm">
                    <td colSpan={2} className="py-2.5 px-2 uppercase tracking-wide text-amber-400">
                      GRAND TOTAL PACKED
                    </td>
                    <td className="py-2.5 px-2 text-center text-blue-300 text-base">
                      {grandTotalCtns.toLocaleString()} Ctns
                    </td>
                    <td className="py-2.5 px-2 text-right text-teal-300 text-base">
                      {grandTotalKg.toLocaleString()} KG
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
