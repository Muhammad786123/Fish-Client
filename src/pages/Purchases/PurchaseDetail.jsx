import { useState } from "react";
import { useApp } from "../../store";
import { PageHeader, SummaryCard, StatRow, fmt, Btn, Confirm } from "../../components/common/ui";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { PurchaseModal } from "./Purchases";

export default function PurchaseDetail() {
  const {
    selectedId,
    purchases,
    deletePurchase,
    navigate,
    showToast
  } = useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const p = purchases.find(x => x.id === selectedId) ?? purchases[0];
  if (!p) return null;

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deletePurchase(p.id);
    showToast(`Purchase ${p.purchaseNo} deleted.`, "info");
    navigate("purchases");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={`Purchase — ${p.purchaseNo}`}
        back={() => navigate("purchases")}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Btn>
            <Btn variant="secondary" size="sm" onClick={() => navigate("supplier-detail", p.supplierId)}>View Supplier</Btn>
            <Btn variant="accent" size="sm" onClick={() => navigate("payments")}>Record Payment</Btn>
            <Btn variant="ghost" size="sm" icon={<MessageCircle size={13} />} onClick={() => showToast("Supplier contacted on WhatsApp!", "success")}>WhatsApp</Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SummaryCard>
          <h3 className="font-bold mb-4" style={{ fontFamily: "Outfit" }}>Purchase Details</h3>
          <StatRow label="Purchase No" value={p.purchaseNo} />
          <StatRow label="Date" value={p.date} />
          <StatRow label="Supplier" value={p.supplierName} />
          <StatRow label="Fish" value={p.fishName} />
          <StatRow label="Quantity" value={`${p.qtyKg} KG`} />
          <StatRow label="Rate/KG" value={fmt(p.ratePerKg)} />
        </SummaryCard>
        <SummaryCard>
          <h3 className="font-bold mb-4" style={{ fontFamily: "Outfit" }}>Cost Breakdown</h3>
          <StatRow label="Fish Cost" value={fmt(p.qtyKg * p.ratePerKg)} />
          <StatRow label="Transport Cost" value={fmt(p.transportCost)} color="#d97706" />
          <StatRow label="Other Cost" value={fmt(p.otherCost)} color="#d97706" />
          <StatRow label="Total Cost" value={fmt(p.totalCost)} />
          <StatRow label="Paid" value={fmt(p.paid)} color="#16a34a" />
          <StatRow label="Remaining Payable" value={fmt(p.remaining)} color={p.remaining > 0 ? "#dc2626" : "#16a34a"} />
        </SummaryCard>
      </div>

      {editModalOpen && (
        <PurchaseModal
          open={editModalOpen}
          purchase={p}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Purchase Record"
        message={`Are you sure you want to delete purchase ${p.purchaseNo}? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
