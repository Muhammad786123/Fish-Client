import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, Btn, Badge, fmt, EmptyState, Modal, Field, Input, Confirm } from "../../components/common/ui";
import { Plus, Search, Snowflake, Package, Tag, Fish, Pencil, Trash2 } from "lucide-react";
import AddBatchModal from "./AddBatchModal";
import { MAX_FISH_TYPES, MAX_NAME_LENGTH } from "../../constants/limits";

export function FishTypeModal({ open, onClose, fishType = null }) {
  const { fishTypes, addFishType, updateFishType, showToast } = useApp();
  const isEdit = Boolean(fishType);

  const [form, setForm] = useState({
    name: fishType?.name || "",
    urduName: fishType?.urduName || "",
    openingStock: fishType?.openingStock !== undefined ? String(fishType.openingStock) : (fishType?.initialStock !== undefined ? String(fishType.initialStock) : "0"),
    avgPurchaseRate: fishType?.avgPurchaseRate ? String(fishType.avgPurchaseRate) : "500",
    avgSaleRate: fishType?.avgSaleRate ? String(fishType.avgSaleRate) : "700"
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("Fish name is required", "error");
      return;
    }
    if (!isEdit && fishTypes.length >= MAX_FISH_TYPES) {
      showToast(`Maximum fish types limit (${MAX_FISH_TYPES}) reached.`, "error");
      return;
    }

    const openingStockVal = parseFloat(form.openingStock) || 0;

    if (isEdit) {
      updateFishType({
        ...fishType,
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        urduName: form.urduName.trim() || form.name.trim(),
        openingStock: openingStockVal,
        initialStock: openingStockVal,
        avgPurchaseRate: parseFloat(form.avgPurchaseRate) || 0,
        avgSaleRate: parseFloat(form.avgSaleRate) || 0
      });
      showToast(`Fish type "${form.name}" updated successfully!`, "success");
    } else {
      const newFish = {
        id: `f${Date.now()}`,
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        urduName: form.urduName.trim() || form.name.trim(),
        openingStock: openingStockVal,
        initialStock: openingStockVal,
        currentStock: openingStockVal,
        avgPurchaseRate: parseFloat(form.avgPurchaseRate) || 0,
        avgSaleRate: parseFloat(form.avgSaleRate) || 0,
        totalPurchased: 0,
        totalSold: 0,
        totalWastage: 0
      };
      addFishType(newFish);
      showToast(`Fish type "${newFish.name}" added successfully!`, "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Fish Type Master" : "Add Fish Type Master"} size="md">
      <div className="space-y-4">
        <Field label="Fish English Name" required>
          <Input
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Rohu, Surmai, Pomfret"
          />
        </Field>
        <Field label="Fish Urdu Name">
          <Input
            value={form.urduName}
            onChange={e => setForm(f => ({ ...f, urduName: e.target.value }))}
            placeholder="روہو"
          />
        </Field>
        <Field label="Opening Stock (KG)">
          <Input
            type="number"
            value={form.openingStock}
            onChange={e => setForm(f => ({ ...f, openingStock: e.target.value }))}
            placeholder="0"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Default Purchase Rate (Rs.)">
            <Input type="number" value={form.avgPurchaseRate} onChange={e => setForm(f => ({ ...f, avgPurchaseRate: e.target.value }))} />
          </Field>
          <Field label="Default Sale Rate (Rs.)">
            <Input type="number" value={form.avgSaleRate} onChange={e => setForm(f => ({ ...f, avgSaleRate: e.target.value }))} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>{isEdit ? "Update Fish Master" : "Save Fish Master"}</Btn>
      </div>
    </Modal>
  );
}

export default function FishBatches() {
  const {
    lang,
    fishTypes,
    batches,
    sales,
    deleteFishType,
    deleteBatch,
    navigate,
    showToast
  } = useApp();
  const tr = t[lang];

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBatchTarget, setEditBatchTarget] = useState(null);

  const [addFishModalOpen, setAddFishModalOpen] = useState(false);
  const [editFishTarget, setEditFishTarget] = useState(null);

  const [deleteFishTarget, setDeleteFishTarget] = useState(null);
  const [deleteBatchTarget, setDeleteBatchTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFishFilter, setSelectedFishFilter] = useState("all");

  const filteredBatches = batches.filter((b) => {
    const matchesFish = selectedFishFilter === "all" || b.fishId === selectedFishFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      b.fishName.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      (b.grade && b.grade.toLowerCase().includes(query)) ||
      (b.packagingType && b.packagingType.toLowerCase().includes(query)) ||
      b.supplierName.toLowerCase().includes(query);
    return matchesFish && matchesSearch;
  });

  const handleOpenEditFish = (fish, e) => {
    e.stopPropagation();
    setEditFishTarget(fish);
    setAddFishModalOpen(true);
  };

  const handleOpenDeleteFish = (fish, e) => {
    e.stopPropagation();
    const hasBatches = batches.some(b => b.fishId === fish.id);
    const hasSales = sales.some(s => s.fishId === fish.id);
    if (hasBatches || hasSales) {
      showToast(`Cannot delete fish type "${fish.name}": Active batches or sales are linked to this fish type.`, "error");
      return;
    }
    setDeleteFishTarget(fish);
  };

  const confirmDeleteFish = () => {
    if (!deleteFishTarget) return;
    deleteFishType(deleteFishTarget.id);
    showToast(`Fish type "${deleteFishTarget.name}" deleted.`, "info");
    setDeleteFishTarget(null);
  };

  const handleOpenEditBatch = (b, e) => {
    e.stopPropagation();
    setEditBatchTarget(b);
    setAddModalOpen(true);
  };

  const handleOpenDeleteBatch = (b, e) => {
    e.stopPropagation();
    setDeleteBatchTarget(b);
  };

  const confirmDeleteBatch = () => {
    if (!deleteBatchTarget) return;
    deleteBatch(deleteBatchTarget.id);
    showToast(`Batch FB-${deleteBatchTarget.id.slice(1).padStart(4, "0")} deleted.`, "info");
    setDeleteBatchTarget(null);
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.fishBatches}
        subtitle="Fish master data, stock analytics, and batch management"
        actions={
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              icon={<Fish size={16} />}
              onClick={() => {
                setEditFishTarget(null);
                setAddFishModalOpen(true);
              }}
            >
              + Add Fish Master
            </Btn>
            <Btn
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditBatchTarget(null);
                setAddModalOpen(true);
              }}
            >
              {tr.addFishBatch}
            </Btn>
          </div>
        }
      />

      {/* Fish Master Data KPI Grid */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-3 text-slate-800" style={{ fontFamily: "Outfit" }}>
          Fish Master Overview ({fishTypes.length}/{MAX_FISH_TYPES})
        </h2>
        {fishTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {fishTypes.map((fish) => {
              const batchCount = batches.filter((b) => b.fishId === fish.id).length;
              return (
                <div
                  key={fish.id}
                  className="kpi-card bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-shadow relative group"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => navigate("fish-detail", fish.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg" style={{ fontFamily: "Outfit", color: "var(--primary)" }}>
                        {fish.name}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {fish.urduName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => handleOpenEditFish(fish, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Fish Master"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => handleOpenDeleteFish(fish, e)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Fish Master"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-500">Current Stock</div>
                    <div className="text-xl font-bold mono" style={{ color: fish.currentStock < 50 ? "#dc2626" : "var(--accent)" }}>
                      {fish.currentStock}
                      <span className="text-sm font-normal text-slate-400"> KG</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Buy Rate</span>
                      <span className="mono font-medium">{fmt(fish.avgPurchaseRate)}/KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Sale Rate</span>
                      <span className="mono font-medium">{fmt(fish.avgSaleRate)}/KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Sold</span>
                      <span className="mono">{fish.totalSold} KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Batches</span>
                      <span className="font-semibold text-slate-700">{batchCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border text-center border-dashed">
            <p className="text-sm text-slate-500 mb-3">No Fish Types created in master data yet.</p>
            <Btn variant="accent" size="sm" onClick={() => setAddFishModalOpen(true)}>Create First Fish Master</Btn>
          </div>
        )}
      </div>

      {/* Batches Inventory Table */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ fontFamily: "Outfit" }}>
              Batch Records ({filteredBatches.length})
            </h2>
            <p className="text-xs text-slate-500">
              Track packaging specifications, grading, freeze dates, and physical inventory
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batch, grade, pack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border outline-none focus:ring-2"
                style={{ borderColor: "var(--border)", background: "#f8fafc" }}
              />
            </div>
            <select
              value={selectedFishFilter}
              onChange={(e) => setSelectedFishFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border outline-none bg-[#f8fafc]"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="all">All Fish</option>
              {fishTypes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredBatches.length === 0 ? (
          <EmptyState
            message="No Fish Batches Recorded"
            sub="Click 'Add Fish Batch' to record new stock inventory."
            action="Add Fish Batch"
            onAction={() => {
              setEditBatchTarget(null);
              setAddModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {filteredBatches.map((b) => {
                const unitWeight = b.packagingWeightKg || 1;
                const remainingUnits = Math.floor(b.remaining / unitWeight);
                return (
                  <div key={b.id} className="border rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: "var(--border)" }} onClick={() => navigate("batch-detail", b.id)}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>FB-{b.id.slice(1).padStart(4, "0")}</div>
                        <div className="text-sm font-semibold text-slate-800">{b.fishName}</div>
                        <div className="text-xs text-slate-500">{b.supplierName} · {b.purchaseDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold mono">{b.remaining} KG</div>
                        <div className="text-xs">{remainingUnits} units</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Fish & Grade</th>
                  <th>Packaging</th>
                  <th>Units Count</th>
                  <th>Purchase Date</th>
                  <th>Supplier</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => {
                  const unitWeight = b.packagingWeightKg || 1;
                  const totalUnits = Math.floor(b.originalQty / unitWeight);
                  const remainingUnits = Math.floor(b.remaining / unitWeight);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate("batch-detail", b.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="mono font-bold" style={{ color: "var(--accent)" }}>
                        FB-{b.id.slice(1).padStart(4, "0")}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-800">{b.fishName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Tag size={12} className="text-slate-400" />
                          <span>Grade: {b.grade || "Standard"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block bg-sky-50 text-sky-800 border border-sky-200">
                          {b.packagingType || "Carton"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {b.packagingWeightKg ? `${b.packagingWeightKg} KG/unit` : "—"}
                        </div>
                      </td>
                      <td>
                        <div className="mono font-bold text-sm text-slate-700">
                          {b.packagingWeightKg ? `${remainingUnits} / ${totalUnits}` : "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.packagingType || "units"}
                        </div>
                      </td>
                      <td className="text-xs text-slate-600 mono">
                        {b.purchaseDate}
                      </td>
                      <td className="text-xs text-slate-600">
                        {b.supplierName}
                      </td>
                      <td className="mono font-bold text-slate-800">
                        {b.remaining} / {b.originalQty}{" "}
                        <span className="text-xs font-normal text-slate-400">KG</span>
                      </td>
                      <td>
                        <Badge
                          status={
                            b.remaining === 0
                              ? "inactive"
                              : b.remaining < 20
                              ? "warning"
                              : "active"
                          }
                        />
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={e => handleOpenEditBatch(b, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Edit Batch"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={e => handleOpenDeleteBatch(b, e)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Batch"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      <AddBatchModal
        open={addModalOpen}
        batch={editBatchTarget}
        onClose={() => {
          setAddModalOpen(false);
          setEditBatchTarget(null);
        }}
      />

      <FishTypeModal
        open={addFishModalOpen}
        fishType={editFishTarget}
        onClose={() => {
          setAddFishModalOpen(false);
          setEditFishTarget(null);
        }}
      />

      <Confirm
        open={Boolean(deleteFishTarget)}
        onClose={() => setDeleteFishTarget(null)}
        onConfirm={confirmDeleteFish}
        title="Delete Fish Type Master"
        message={`Are you sure you want to delete fish type "${deleteFishTarget?.name}"?`}
        danger
      />

      <Confirm
        open={Boolean(deleteBatchTarget)}
        onClose={() => setDeleteBatchTarget(null)}
        onConfirm={confirmDeleteBatch}
        title="Delete Fish Batch"
        message={`Are you sure you want to delete batch FB-${deleteBatchTarget?.id.slice(1).padStart(4, "0")} (${deleteBatchTarget?.fishName})?`}
        danger
      />
    </div>
  );
}

