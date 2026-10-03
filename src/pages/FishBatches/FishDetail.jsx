import { useState } from "react";
import { useApp } from "../../store";
import { PageHeader, SummaryCard, StatRow, Btn, fmt, Confirm } from "../../components/common/ui";
import { Plus, Snowflake, Package, Tag, Pencil, Trash2 } from "lucide-react";
import AddBatchModal from "./AddBatchModal";
import { FishTypeModal } from "./FishBatches";

export default function FishDetail() {
  const {
    selectedId,
    fishTypes,
    batches,
    sales,
    deleteFishType,
    navigate,
    showToast
  } = useApp();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editFishModalOpen, setEditFishModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fish = fishTypes.find((f) => f.id === selectedId) ?? fishTypes[0];
  if (!fish) return null;

  const fishBatches = batches.filter((b) => b.fishId === fish.id);
  const profit =
    fish.totalSold * fish.avgSaleRate - fish.totalPurchased * fish.avgPurchaseRate;

  const handleDelete = () => {
    const hasBatches = fishBatches.length > 0;
    const hasSales = sales.some(s => s.fishId === fish.id);
    if (hasBatches || hasSales) {
      showToast(`Cannot delete fish type "${fish.name}": Active batches or sales exist.`, "error");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteFishType(fish.id);
    showToast(`Fish type "${fish.name}" deleted successfully.`, "info");
    navigate("fish-batches");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={fish.name}
        subtitle={`${fish.urduName} · Master stock & batch history`}
        back={() => navigate("fish-batches")}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => setEditFishModalOpen(true)}>Edit Master</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>Delete Master</Btn>
            <Btn
              variant="accent"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setAddModalOpen(true)}
            >
              Add {fish.name} Batch
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SummaryCard>
          <h3
            className="font-bold mb-4 text-slate-800"
            style={{ fontFamily: "Outfit" }}
          >
            Fish Analytics
          </h3>
          <StatRow label="Current Stock" value={`${fish.currentStock} KG`} />
          <StatRow label="Total Purchased" value={`${fish.totalPurchased} KG`} />
          <StatRow
            label="Total Sold"
            value={`${fish.totalSold} KG`}
            color="#16a34a"
          />
          <StatRow
            label="Total Wastage"
            value={`${fish.totalWastage} KG`}
            color="#dc2626"
          />
          <StatRow
            label="Avg Purchase Rate"
            value={`${fmt(fish.avgPurchaseRate)} / KG`}
          />
          <StatRow
            label="Avg Sale Rate"
            value={`${fmt(fish.avgSaleRate)} / KG`}
          />
          <StatRow
            label="Gross Profit"
            value={fmt(profit)}
            color={profit > 0 ? "#16a34a" : "#dc2626"}
          />
          <StatRow
            label="Total Batches"
            value={`${fishBatches.length} batches`}
          />
        </SummaryCard>

        <SummaryCard>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-bold text-slate-800"
              style={{ fontFamily: "Outfit" }}
            >
              Batch History ({fishBatches.length})
            </h3>
            <span className="text-xs text-slate-400">Click to view details</span>
          </div>

          <div className="space-y-3">
            {fishBatches.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No batches recorded for this fish yet.
              </p>
            ) : (
              fishBatches.map((b) => {
                const unitWeight = b.packagingWeightKg || 1;
                const remainingUnits = Math.floor(b.remaining / unitWeight);

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => navigate("batch-detail", b.id)}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold mono"
                          style={{ color: "var(--accent)" }}
                        >
                          FB-{b.id.slice(1).padStart(4, "0")}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {b.grade || "Standard"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mono">
                        <Snowflake size={12} className="text-blue-500" />
                        Frozen: {b.freezeDate || b.purchaseDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {b.packagingType || "Carton"}
                        </span>
                        <span>({unitWeight} KG/unit)</span>
                      </div>
                      <div className="mono font-bold text-slate-800">
                        {remainingUnits} pkgs ({b.remaining} KG)
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SummaryCard>
      </div>

      <AddBatchModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultFishId={fish.id}
      />

      <FishTypeModal
        open={editFishModalOpen}
        fishType={fish}
        onClose={() => setEditFishModalOpen(false)}
      />

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Fish Type Master"
        message={`Are you sure you want to delete fish type "${fish.name}"? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
