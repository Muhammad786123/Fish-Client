import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, Badge, Btn, fmt, SummaryCard, EmptyState, Modal, Field, Input, Select, Confirm } from "../../components/common/ui";
import { Plus, Search, Download, Printer, Pencil, Trash2 } from "lucide-react";
import { exportReportToPDF } from "../../utils/pdfExport";

export function PurchaseModal({
  open,
  onClose,
  purchase = null
}) {
  const {
    fishTypes,
    suppliers,
    addPurchase,
    updatePurchase,
    showToast,
    navigate
  } = useApp();

  const isEdit = Boolean(purchase);

  const [form, setForm] = useState({
    date: purchase?.date || new Date().toISOString().slice(0, 10),
    supplierId: purchase?.supplierId || suppliers[0]?.id || "",
    fishId: purchase?.fishId || fishTypes[0]?.id || "",
    qty: purchase?.qtyKg ? String(purchase.qtyKg) : "250",
    rate: purchase?.ratePerKg ? String(purchase.ratePerKg) : "650",
    transport: purchase?.transportCost ? String(purchase.transportCost) : "0",
    other: purchase?.otherCost ? String(purchase.otherCost) : "0",
    paid: purchase?.paid ? String(purchase.paid) : "0",
    paymentMethod: purchase?.paymentMethod || "Cash",
    notes: purchase?.notes || ""
  });

  useEffect(() => {
    if (purchase) {
      setForm({
        date: purchase.date || new Date().toISOString().slice(0, 10),
        supplierId: purchase.supplierId || "",
        fishId: purchase.fishId || "",
        qty: String(purchase.qtyKg || 0),
        rate: String(purchase.ratePerKg || 0),
        transport: String(purchase.transportCost || 0),
        other: String(purchase.otherCost || 0),
        paid: String(purchase.paid || 0),
        paymentMethod: purchase.paymentMethod || "Cash",
        notes: purchase.notes || ""
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        supplierId: suppliers[0]?.id || "",
        fishId: fishTypes[0]?.id || "",
        qty: "250",
        rate: "650",
        transport: "7500",
        other: "0",
        paid: "100000",
        paymentMethod: "Cash",
        notes: ""
      });
    }
  }, [purchase, open, suppliers, fishTypes]);

  const qty = parseFloat(form.qty) || 0;
  const rate = parseFloat(form.rate) || 0;
  const transport = parseFloat(form.transport) || 0;
  const other = parseFloat(form.other) || 0;
  const totalCost = qty * rate + transport + other;
  const paid = parseFloat(form.paid) || 0;
  const remaining = Math.max(totalCost - paid, 0);

  const handleSubmit = () => {
    if (!form.date) {
      showToast("Please select a date.", "error");
      return;
    }
    if (!form.supplierId) {
      showToast("Please select a supplier. Add a supplier first if list is empty.", "error");
      return;
    }
    if (!form.fishId) {
      showToast("Please select a fish type. Add a fish type first if list is empty.", "error");
      return;
    }
    const fish = fishTypes.find(f => f.id === form.fishId);
    const supplier = suppliers.find(s => s.id === form.supplierId);

    if (isEdit) {
      const updated = {
        ...purchase,
        date: form.date,
        supplierId: form.supplierId,
        supplierName: supplier?.name ?? purchase.supplierName,
        fishId: form.fishId,
        fishName: fish?.name ?? purchase.fishName,
        qtyKg: qty,
        ratePerKg: rate,
        transportCost: transport,
        otherCost: other,
        totalCost,
        paid,
        remaining,
        paymentMethod: form.paymentMethod || "Cash",
        notes: form.notes
      };
      updatePurchase(updated);
      showToast(`Purchase ${purchase.purchaseNo} updated successfully!`, "success");
      onClose();
    } else {
      const newP = {
        id: Math.random().toString(36).slice(2),
        purchaseNo: `PUR-${2026 + Math.floor(Math.random() * 1000)}`,
        date: form.date,
        supplierId: form.supplierId,
        supplierName: supplier?.name ?? "",
        fishId: form.fishId,
        fishName: fish?.name ?? "",
        qtyKg: qty,
        ratePerKg: rate,
        transportCost: transport,
        otherCost: other,
        totalCost,
        paid,
        remaining,
        paymentMethod: form.paymentMethod || "Cash",
        notes: form.notes
      };
      addPurchase(newP);
      showToast("Purchase added successfully!", "success");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Purchase" : "New Purchase"} size="xl">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Supplier" required>
          <Select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
            {suppliers.length === 0 ? <option value="">— No Suppliers (Add Supplier First) —</option> : <option value="">— Select Supplier —</option>}
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Fish Type" required>
          <Select value={form.fishId} onChange={e => setForm(f => ({ ...f, fishId: e.target.value }))}>
            {fishTypes.length === 0 ? <option value="">— No Fish Types (Add Fish Type First) —</option> : <option value="">— Select Fish Type —</option>}
            {fishTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="Quantity (KG)" required>
          <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
        </Field>
        <Field label="Rate per KG" required>
          <Input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
        </Field>

        <Field label="Transport Cost">
          <Input type="number" value={form.transport} onChange={e => setForm(f => ({ ...f, transport: e.target.value }))} />
        </Field>
        <Field label="Other Cost">
          <Input type="number" value={form.other} onChange={e => setForm(f => ({ ...f, other: e.target.value }))} />
        </Field>
        <Field label="Paid Amount">
          <Input type="number" value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} />
        </Field>
        <Field label="Payment Method">
          <Select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online">Online</option>
          </Select>
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
        </Field>
      </div>
      <div className="mt-4 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
        <div><span className="text-slate-500">Fish Cost:</span> <span className="font-bold">{fmt(qty * rate)}</span></div>
        <div><span className="text-slate-500">Total Cost:</span> <span className="font-bold text-blue-800">{fmt(totalCost)}</span></div>
        <div><span className="text-slate-500">Payable:</span> <span className="font-bold" style={{ color: remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(remaining)}</span></div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSubmit}>{isEdit ? "Update Purchase" : "Add Purchase"}</Btn>
      </div>
    </Modal>
  );
}

export default function Purchases() {
  const {
    lang,
    purchases,
    deletePurchase,
    navigate,
    showToast
  } = useApp();
  const tr = t[lang];
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = purchases.filter(p => p.purchaseNo.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase()) || p.fishName.toLowerCase().includes(search.toLowerCase()));

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p, e) => {
    e.stopPropagation();
    setEditTarget(p);
    setModalOpen(true);
  };

  const handleOpenDelete = (p, e) => {
    e.stopPropagation();
    setDeleteTarget(p);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePurchase(deleteTarget.id);
    showToast(`Purchase ${deleteTarget.purchaseNo} deleted.`, "info");
    setDeleteTarget(null);
  };

  const handleExportPDF = () => {
    const columns = ["Purchase #", "Date", "Supplier", "Fish", "Qty (KG)", "Total Cost", "Paid", "Remaining"];
    const data = filtered.map(p => [
      p.purchaseNo,
      p.date,
      p.supplierName,
      p.fishName,
      `${p.qtyKg} KG`,
      fmt(p.totalCost),
      fmt(p.paid),
      fmt(p.remaining)
    ]);
    exportReportToPDF({
      title: "Purchases Report",
      businessName: "Royalion",
      period: "Filtered Transactions",
      columns,
      data,
      summary: [
        { label: "Total Purchase Amount", value: fmt(filtered.reduce((acc, p) => acc + (p.totalCost || 0), 0)) },
        { label: "Total Purchases", value: filtered.length.toString() }
      ]
    });
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.purchases}
        subtitle="Manage fish purchases from suppliers"
        actions={
          <Btn variant="accent" icon={<Plus size={15} />} onClick={handleOpenAdd}>
            {tr.newPurchase}
          </Btn>
        }
      />
      <SummaryCard>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input className="flex-1 text-sm bg-transparent outline-none" placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExportPDF}>{tr.exportPDF}</Btn>
        </div>
        {filtered.length === 0 ? (
          <EmptyState message="No Purchases Found" sub="No purchases match your filters." action="New Purchase" onAction={handleOpenAdd} />
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {filtered.map(p => (
                <div key={p.id} className="border rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: "var(--border)" }} onClick={() => navigate("purchase-detail", p.id)}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{p.purchaseNo}</div>
                      <div className="text-sm font-medium text-slate-800">{p.supplierName}</div>
                      <div className="text-xs text-slate-500">{p.date} · {p.fishName} · {p.qtyKg} KG</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono text-slate-800">{fmt(p.totalCost)}</div>
                      <div className="text-xs" style={{ color: p.remaining > 0 ? "#dc2626" : "#16a34a" }}>Due: {fmt(p.remaining)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-1" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={e => handleOpenEdit(p, e)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><Pencil size={14} /></button>
                      <button onClick={e => handleOpenDelete(p, e)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Purchase #</th><th>Date</th><th>Supplier</th><th>Fish</th>
                    <th>Qty KG</th><th>Total Cost</th><th>Paid</th><th>Remaining</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} onClick={() => navigate("purchase-detail", p.id)} className="cursor-pointer hover:bg-slate-50">
                      <td className="mono font-medium" style={{ color: "var(--accent)" }}>{p.purchaseNo}</td>
                      <td className="text-slate-500">{p.date}</td>
                      <td className="font-medium">{p.supplierName}</td>
                      <td>{p.fishName}</td>
                      <td className="mono">{p.qtyKg} KG</td>
                      <td className="mono font-semibold">{fmt(p.totalCost)}</td>
                      <td className="mono" style={{ color: "#16a34a" }}>{fmt(p.paid)}</td>
                      <td className="mono" style={{ color: p.remaining > 0 ? "#dc2626" : "#16a34a" }}>{fmt(p.remaining)}</td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => handleOpenEdit(p, e)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit Purchase"><Pencil size={15} /></button>
                          <button onClick={e => handleOpenDelete(p, e)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Purchase"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SummaryCard>

      {modalOpen && (
        <PurchaseModal
          open={modalOpen}
          purchase={editTarget}
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
        title="Delete Purchase Record"
        message={`Are you sure you want to delete purchase ${deleteTarget?.purchaseNo}? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
