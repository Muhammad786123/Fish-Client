import { useState } from "react";
import { useApp } from "../../store";
import { PageHeader, SummaryCard, StatRow, fmt, Btn, Confirm } from "../../components/common/ui";
import { Snowflake, Package, Calendar, Tag, Layers, Pencil, Trash2 } from "lucide-react";
import AddBatchModal from "./AddBatchModal";

export default function BatchDetail() {
  const {
    selectedId,
    batches,
    deleteBatch,
    navigate,
    showToast
  } = useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const batch = batches.find((b) => b.id === selectedId) ?? batches[0];
  if (!batch) return null;

  const unitWeight = batch.packagingWeightKg || 1;
  const totalUnits = Math.floor(batch.originalQty / unitWeight);
  const remainingUnits = Math.floor(batch.remaining / unitWeight);
  const soldUnits = Math.floor(batch.sold / unitWeight);

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteBatch(batch.id);
    showToast(`Batch FB-${batch.id.slice(1).padStart(4, "0")} deleted successfully.`, "info");
    navigate("fish-batches");
  };

  const timelineEvents = [
    {
      label: `Purchase Recorded (${batch.purchaseDate})`,
      icon: "📦",
      color: "#0f2d5a"
    },
    {
      label: `Batch Registered: FB-${batch.id.slice(1).padStart(4, "0")}`,
      icon: "🏷️",
      color: "#0d9488"
    },
    {
      label: `Stock Packaged as ${batch.packagingType || "Carton"} (${unitWeight} KG/unit)`,
      icon: "📦",
      color: "#f59e0b"
    },
    {
      label: `Sold to Date: ${batch.sold} KG (${soldUnits} units)`,
      icon: "🛒",
      color: "#16a34a"
    },
    {
      label: `Wastage Recorded: ${batch.wastage} KG`,
      icon: "⚠️",
      color: "#dc2626"
    },
    {
      label: `Remaining Stock: ${batch.remaining} KG (${remainingUnits} units)`,
      icon: "📊",
      color: "#7c3aed"
    }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title={`Batch FB-${batch.id.slice(1).padStart(4, "0")}`}
        subtitle={`${batch.fishName} · ${batch.grade || "Standard"}`}
        back={() => navigate("fish-batches")}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit Batch</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete Batch</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Packaging & Grading Highlight Bar */}
          <div
            className="rounded-2xl p-4 border bg-gradient-to-r from-blue-50 to-teal-50 flex flex-wrap items-center justify-between gap-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "var(--accent)" }}
              >
                <Package size={20} />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Packaging Specification
                </span>
                <div className="text-base font-bold text-slate-800">
                  {batch.packagingType || "Carton"} ({unitWeight} KG / Unit)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Batch Purchase Date
                </span>
                <div className="text-base font-bold text-slate-800 mono">
                  {batch.purchaseDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white">
                <Tag size={20} />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Size / Grade
                </span>
                <div className="text-base font-bold text-slate-800">
                  {batch.grade || "Standard"}
                </div>
              </div>
            </div>
          </div>

          {/* Batch Information */}
          <SummaryCard>
            <h3
              className="font-bold mb-4 text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Batch Specifications & Origin
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <StatRow label="Fish Variety" value={batch.fishName} />
              <StatRow label="Grading / Size" value={batch.grade || "Standard"} />
              <StatRow label="Packaging Type" value={batch.packagingType || "Carton"} />
              <StatRow
                label="Packaging Unit Weight"
                value={`${unitWeight} KG / ${batch.packagingType || "unit"}`}
              />
              <StatRow label="Purchase Date" value={batch.purchaseDate} />
              <StatRow
                label="Purchase Rate"
                value={`${fmt(batch.purchaseRate)} / KG`}
              />
              <StatRow
                label="Unit Cost"
                value={`${fmt(batch.purchaseRate * unitWeight)} / ${batch.packagingType || "unit"}`}
              />
              <StatRow label="Supplier" value={batch.supplierName} />
              <StatRow
                label="Total Units Packaged"
                value={`${totalUnits} ${batch.packagingType || "Units"}`}
              />
              <StatRow
                label="Available Units"
                value={`${remainingUnits} ${batch.packagingType || "Units"} left`}
              />
            </div>
          </SummaryCard>

          {/* Stock Movement */}
          <SummaryCard>
            <h3
              className="font-bold mb-4 text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Stock Movement & Values
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Purchased",
                  value: `${batch.originalQty} KG`,
                  sub: `${totalUnits} ${batch.packagingType || "units"}`,
                  color: "var(--primary)"
                },
                {
                  label: "Sold",
                  value: `${batch.sold} KG`,
                  sub: `${soldUnits} ${batch.packagingType || "units"}`,
                  color: "#16a34a"
                },
                {
                  label: "Wastage",
                  value: `${batch.wastage} KG`,
                  sub: "recorded lost",
                  color: "#dc2626"
                },
                {
                  label: "Remaining Stock",
                  value: `${batch.remaining} KG`,
                  sub: `${remainingUnits} ${batch.packagingType || "units"} in stock`,
                  color: "var(--accent)"
                },
                {
                  label: "Total Value",
                  value: fmt(batch.originalQty * batch.purchaseRate),
                  sub: "at purchase rate",
                  color: "var(--foreground)"
                },
                {
                  label: "Remaining Value",
                  value: fmt(batch.remaining * batch.purchaseRate),
                  sub: "inventory asset",
                  color: "#7c3aed"
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 rounded-xl border"
                  style={{ background: "#f8fafc", borderColor: "var(--border)" }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ fontFamily: "Outfit", color: item.color }}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </SummaryCard>
        </div>

        {/* Timeline */}
        <div>
          <SummaryCard>
            <h3
              className="font-bold mb-5 text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Batch Lifecycle Timeline
            </h3>
            <div className="relative">
              <div
                className="absolute left-4 top-0 bottom-0 w-0.5"
                style={{ background: "var(--border)" }}
              />
              <div className="space-y-5">
                {timelineEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 shrink-0"
                      style={{
                        background: ev.color + "22",
                        minWidth: 32
                      }}
                    >
                      {ev.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-700 pt-1.5 leading-relaxed">
                      {ev.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SummaryCard>
        </div>
      </div>

      {editModalOpen && (
        <AddBatchModal
          open={editModalOpen}
          batch={batch}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Fish Batch"
        message={`Are you sure you want to delete batch FB-${batch.id.slice(1).padStart(4, "0")} (${batch.fishName})?`}
        danger
      />
    </div>
  );
}
