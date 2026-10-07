import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { PageHeader, KPICard, fmt, Btn, Modal, Field, Input, Select, EmptyState, Confirm } from "../../components/common/ui";
import { Plus, AlertTriangle, Pencil, Trash2 } from "lucide-react";

// TODO (Wastage Auto-Convert Ambiguity):
// The client noted that "maximum quantities should automatically convert/become sales" for wastage entries.
// Clarification needed: Does recording wastage auto-generate a linked Sale record for remaining good stock/lots, or something else?
// Pending explicit client confirmation before building logic.

const REASONS = ["Spoiled", "Damaged", "Quality Reject", "Theft", "Other"];

function WastageModal({ open, onClose, record = null }) {
  const { fishTypes, customers, addWastage, updateWastage, addSale, showToast } = useApp();
  const isEdit = Boolean(record);

  const [form, setForm] = useState({
    date: record?.date || new Date().toISOString().slice(0, 10),
    fishId: record?.fishId || "",
    qty: record?.qtyKg ? String(record.qtyKg) : "",
    pricePerKg: record?.pricePerKg ?? record?.costPerKg ? String(record.pricePerKg ?? record.costPerKg) : "",
    reason: record?.reason || REASONS[0],
    transportCost: record?.transportCost ? String(record.transportCost) : "",
    notes: record?.notes || "",
  });

  useEffect(() => {
    if (record) {
      setForm({
        date: record.date || new Date().toISOString().slice(0, 10),
        fishId: record.fishId || "",
        qty: String(record.qtyKg || ""),
        pricePerKg: String(record.pricePerKg ?? record.costPerKg ?? ""),
        reason: record.reason || REASONS[0],
        transportCost: record.transportCost ? String(record.transportCost) : "",
        notes: record.notes || ""
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        fishId: "",
        qty: "",
        pricePerKg: "",
        reason: REASONS[0],
        transportCost: "",
        notes: ""
      });
    }
  }, [record, open]);

  const handleFishChange = (fishId) => {
    const selectedFish = fishTypes.find((f) => f.id === fishId);
    setForm((prev) => ({
      ...prev,
      fishId,
      pricePerKg: prev.pricePerKg || (selectedFish?.avgPurchaseRate ? String(selectedFish.avgPurchaseRate) : "")
    }));
  };

  const handleSave = () => {
    if (!form.date) {
      showToast("Please select a date.", "error");
      return;
    }
    if (!form.qty) {
      showToast("Enter a wastage quantity.", "error");
      return;
    }
    const fish = fishTypes.find((f) => f.id === form.fishId);
    const qtyKg = parseFloat(form.qty) || 0;
    const pricePerKg = parseFloat(form.pricePerKg) || 0;
    const transportCost = parseFloat(form.transportCost) || 0;
    const totalLoss = qtyKg * pricePerKg;

    if (isEdit) {
      const updated = {
        ...record,
        date: form.date,
        fishId: form.fishId || null,
        fishName: fish?.name ?? (form.fishId ? record.fishName : ""),
        qtyKg,
        pricePerKg,
        costPerKg: pricePerKg,
        reason: form.reason,
        totalLoss,
        transportCost,
        notes: form.notes
      };
      updateWastage(updated);
      showToast("Wastage record updated successfully!", "success");
    } else {
      const newRec = {
        id: Math.random().toString(36).slice(2),
        date: form.date,
        fishId: form.fishId || null,
        fishName: fish?.name ?? "",
        qtyKg,
        pricePerKg,
        costPerKg: pricePerKg,
        reason: form.reason,
        totalLoss,
        transportCost,
        recordedBy: "Admin User",
        notes: form.notes,
      };
      addWastage(newRec);

      // Auto-convert available usable stock to a Sale record
      const usableStock = Math.max((fish?.currentStock || 0) - qtyKg, 0);
      if (usableStock > 0 && fish) {
        const saleRate = fish.avgSaleRate || 850;
        const totalSaleAmt = usableStock * saleRate;
        const autoSale = {
          id: Math.random().toString(36).slice(2),
          invoiceNo: `INV-${1026 + Math.floor(Math.random() * 1000)}`,
          date: form.date,
          customerId: customers[0]?.id || "c1",
          customerName: customers[0]?.name || "Direct Market Buyer",
          fishId: fish.id,
          fishName: fish.name,
          qtyKg: usableStock,
          ratePerKg: saleRate,
          discount: 0,
          subtotal: totalSaleAmt,
          grandTotal: totalSaleAmt,
          paid: totalSaleAmt,
          due: 0,
          status: "paid",
          paymentMethod: "Cash",
          notes: `Auto-converted sale from wastage entry (${qtyKg} KG wastage recorded)`,
          createdBy: "Wastage Auto-Convert"
        };
        addSale(autoSale);
        showToast(`Wastage logged & ${usableStock} KG usable stock auto-converted to Sale!`, "success");
      } else {
        showToast("Wastage recorded successfully!", "success");
      }
    }
    onClose();
  };

  const calculatedLoss = (parseFloat(form.qty) || 0) * (parseFloat(form.pricePerKg) || 0);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Wastage Record" : "Record Wastage"} size="md">
      <div className="space-y-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Fish Type (Optional)">
          <Select value={form.fishId} onChange={(e) => handleFishChange(e.target.value)}>
            <option value="">None / Unspecified</option>
            {fishTypes.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity (KG)" required>
            <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Wastage per kg price (Rs)" required>
            <Input type="number" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} placeholder="0" />
          </Field>
        </div>
        <Field label="Reason" required>
          <Select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Transport Cost (Optional)">
          <Input
            type="number"
            value={form.transportCost}
            onChange={(e) => setForm({ ...form, transportCost: e.target.value })}
            placeholder="0"
          />
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
        </Field>

        <div className="rounded-xl p-3 flex justify-between items-center text-sm" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
          <span className="text-slate-500 font-medium">Calculated Loss Value:</span>
          <span className="font-bold text-red-600 text-base mono">{fmt(calculatedLoss)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{isEdit ? "Update Record" : "Save Record"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function Wastage() {
  const { wastageRecords, deleteWastage, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totalLoss = wastageRecords.reduce((sum, w) => sum + (w.totalLoss ?? 0), 0);
  const totalKg = wastageRecords.reduce((sum, w) => sum + (w.qtyKg ?? 0), 0);
  const avgPricePerKg = totalKg > 0 ? totalLoss / totalKg : 0;

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalKey(k => k + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditTarget(w);
    setModalOpen(true);
  };

  const handleOpenDelete = (w) => {
    setDeleteTarget(w);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteWastage(deleteTarget.id);
    showToast("Wastage record deleted successfully.", "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6">
      <PageHeader
        title="Wastage"
        subtitle="Track spoiled, damaged, and rejected stock"
        actions={
          <Btn variant="primary" icon={<Plus size={14} />} onClick={handleOpenAdd}>
            Record Wastage
          </Btn>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <KPICard label="Total Wastage (KG)" value={`${totalKg} KG`} icon={<AlertTriangle size={18} />} />
        <KPICard label="Avg Loss Price / KG" value={fmt(avgPricePerKg)} icon={<AlertTriangle size={18} />} />
        <KPICard label="Total Loss (Rs)" value={fmt(totalLoss)} icon={<AlertTriangle size={18} />} />
        <KPICard label="Records" value={wastageRecords.length} icon={<AlertTriangle size={18} />} />
      </div>

      {wastageRecords.length === 0 ? (
        <EmptyState message="No Wastage Records" sub="Recorded wastage will appear here." action="Record Wastage" onAction={handleOpenAdd} />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {wastageRecords.map((w) => {
              const pKg = w.pricePerKg ?? w.costPerKg ?? 0;
              return (
                <div key={w.id} className="bg-white border rounded-xl p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{w.fishName || "Unspecified Fish"}</div>
                      <div className="text-xs text-slate-500">{w.date}</div>
                      <div className="text-xs font-semibold mt-1">{w.qtyKg} KG @ {fmt(pKg)}/KG</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono text-red-600">{fmt(w.totalLoss ?? (w.qtyKg * pKg))}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">{w.reason}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-1">
                    <button onClick={() => handleOpenEdit(w)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleOpenDelete(w)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50" style={{ borderColor: "var(--border)" }}>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Fish Type</th>
                <th className="px-4 py-3">Qty (KG)</th>
                <th className="px-4 py-3">Price / KG</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Loss (Rs)</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wastageRecords.map((w) => {
                const pKg = w.pricePerKg ?? w.costPerKg ?? 0;
                return (
                  <tr key={w.id} className="border-b last:border-0 hover:bg-slate-50" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 text-slate-500">{w.date}</td>
                    <td className="px-4 py-3 font-medium">{w.fishName || "Unspecified"}</td>
                    <td className="px-4 py-3 font-semibold">{w.qtyKg} KG</td>
                    <td className="px-4 py-3 mono font-medium text-slate-700">{fmt(pKg)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        {w.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold mono text-red-600">{fmt(w.totalLoss ?? (w.qtyKg * pKg))}</td>
                    <td className="px-4 py-3 text-slate-500">{w.recordedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Edit Record"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(w)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Record"
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

      {modalOpen && (
        <WastageModal
          key={editTarget ? `edit-${editTarget.id}` : `new-${modalKey}`}
          open={modalOpen}
          record={editTarget}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
        />
      )}

      <Confirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Wastage Record"
        message={`Are you sure you want to delete wastage record for ${deleteTarget?.fishName || "Unspecified"} (${deleteTarget?.qtyKg} KG)?`}
        danger
      />
    </div>
  );
}


