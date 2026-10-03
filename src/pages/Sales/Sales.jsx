import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, Badge, Btn, fmt, SummaryCard, EmptyState, Modal, Field, Input, Select, Confirm } from "../../components/common/ui";
import { Plus, Search, Filter, Download, Printer, Pencil, Trash2 } from "lucide-react";
import { normalizeRole } from "../../constants/permissions";
import { SALES_PERSON } from "../../constants/roles";
import { exportReportToPDF } from "../../utils/pdfExport";

export function SaleModal({
  open,
  onClose,
  sale = null
}) {
  const {
    fishTypes,
    batches,
    customers,
    addSale,
    updateSale,
    showToast,
    navigate,
    currentUser
  } = useApp();

  const isEdit = Boolean(sale);

  const [form, setForm] = useState({
    date: sale?.date || new Date().toISOString().slice(0, 10),
    customerId: sale?.customerId || customers[0]?.id || "",
    fishId: sale?.fishId || fishTypes[0]?.id || "",
    qty: sale?.qtyKg ? String(sale.qtyKg) : "50",
    rate: sale?.ratePerKg ? String(sale.ratePerKg) : "850",
    discount: sale?.discount ? String(sale.discount) : "0",
    paid: sale?.paid ? String(sale.paid) : "0",
    paymentMethod: sale?.paymentMethod || "Cash",
    notes: sale?.notes || ""
  });

  useEffect(() => {
    if (sale) {
      setForm({
        date: sale.date || new Date().toISOString().slice(0, 10),
        customerId: sale.customerId || "",
        fishId: sale.fishId || "",
        qty: String(sale.qtyKg || 0),
        rate: String(sale.ratePerKg || 0),
        discount: String(sale.discount || 0),
        paid: String(sale.paid || 0),
        paymentMethod: sale.paymentMethod || "Cash",
        notes: sale.notes || ""
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        customerId: customers[0]?.id || "",
        fishId: fishTypes[0]?.id || "",
        qty: "50",
        rate: "850",
        discount: "0",
        paid: "0",
        paymentMethod: "Cash",
        notes: ""
      });
    }
  }, [sale, open, customers, fishTypes]);

  const fish = fishTypes.find(f => f.id === form.fishId);
  const customer = customers.find(c => c.id === form.customerId);
  const qty = parseFloat(form.qty) || 0;
  const rate = parseFloat(form.rate) || 0;
  const discount = parseFloat(form.discount) || 0;
  const subtotal = qty * rate;
  const grandTotal = Math.max(subtotal - discount, 0);
  const paidAmt = parseFloat(form.paid) || 0;
  const due = Math.max(grandTotal - paidAmt, 0);

  const handleSubmit = () => {
    if (!form.date) {
      showToast("Please select a date.", "error");
      return;
    }
    if (!form.customerId) {
      showToast("Please select a customer. Add a customer first if list is empty.", "error");
      return;
    }
    if (!form.fishId) {
      showToast("Please select a fish type. Add a fish type first if list is empty.", "error");
      return;
    }
    if (paidAmt > grandTotal) {
      showToast("Payment cannot exceed grand total.", "error");
      return;
    }

    if (isEdit) {
      const updated = {
        ...sale,
        date: form.date,
        customerId: form.customerId,
        customerName: customer?.name ?? sale.customerName,
        fishId: form.fishId,
        fishName: fish?.name ?? sale.fishName,
        qtyKg: qty,
        ratePerKg: rate,
        discount,
        subtotal,
        grandTotal,
        paid: paidAmt,
        due,
        status: due === 0 ? "paid" : paidAmt === 0 ? "due" : "partial",
        paymentMethod: form.paymentMethod,
        notes: form.notes
      };
      updateSale(updated);
      showToast(`Sale ${sale.invoiceNo} updated successfully!`, "success");
      onClose();
    } else {
      const newSale = {
        id: Math.random().toString(36).slice(2),
        invoiceNo: `INV-${1026 + Math.floor(Math.random() * 1000)}`,
        date: form.date,
        customerId: form.customerId,
        customerName: customer?.name ?? "",
        fishId: form.fishId,
        fishName: fish?.name ?? "",
        qtyKg: qty,
        ratePerKg: rate,
        discount,
        subtotal,
        grandTotal,
        paid: paidAmt,
        due,
        status: due === 0 ? "paid" : paidAmt === 0 ? "due" : "partial",
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        createdBy: currentUser?.name || "Admin User"
      };
      addSale(newSale);
      showToast("Sale completed successfully!", "success");
      onClose();
      setTimeout(() => navigate("sale-detail", newSale.id), 100);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Sale" : "New Sale"} size="xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Customer" required>
          <Select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
            {customers.length === 0 ? <option value="">— No Customers (Add Customer First) —</option> : <option value="">— Select Customer —</option>}
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Fish Type" required>
          <Select value={form.fishId} onChange={e => setForm(f => ({ ...f, fishId: e.target.value }))}>
            {fishTypes.length === 0 ? <option value="">— No Fish Types (Add Fish Type First) —</option> : <option value="">— Select Fish Type —</option>}
            {fishTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="Quantity (KG)" required>
          <Input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} min="0.1" step="0.5" />
        </Field>
        <Field label="Rate per KG" required>
          <Input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
        </Field>
        <Field label="Discount (Rs.)">
          <Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
        </Field>
        <Field label="Payment Method">
          <Select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
            <option>Cash</option><option>Bank</option><option>Online</option><option>Other</option>
          </Select>
        </Field>
        <Field label="Paid Amount">
          <Input type="number" value={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.value }))} />
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
        </Field>
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-xl p-4 space-y-2" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><span className="text-slate-500">Subtotal:</span> <span className="font-bold">{fmt(subtotal)}</span></div>
          <div><span className="text-slate-500">Discount:</span> <span className="font-bold text-orange-600">-{fmt(discount)}</span></div>
          <div><span className="text-slate-500">Grand Total:</span> <span className="font-bold text-blue-800">{fmt(grandTotal)}</span></div>
          <div><span className="text-slate-500">Paid:</span> <span className="font-bold text-green-700">{fmt(paidAmt)}</span></div>
          <div><span className="text-slate-500">Due:</span> <span className="font-bold" style={{ color: due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(due)}</span></div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSubmit}>{isEdit ? "Update Sale" : "Complete Sale"}</Btn>
      </div>
    </Modal>
  );
}

export default function Sales() {
  const {
    lang,
    sales,
    deleteSale,
    navigate,
    currentUser,
    showToast
  } = useApp();

  const tr = t[lang];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isSalesPerson = normalizeRole(currentUser?.role) === SALES_PERSON;
  const accessibleSales = isSalesPerson
    ? sales.filter(s => s.createdBy === currentUser?.name)
    : sales;

  const filtered = accessibleSales.filter(s => {
    const q = search.toLowerCase();
    return (s.invoiceNo.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q) || s.fishName.toLowerCase().includes(q)) && (statusFilter === "all" || s.status === statusFilter);
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s, e) => {
    e.stopPropagation();
    setEditTarget(s);
    setModalOpen(true);
  };

  const handleOpenDelete = (s, e) => {
    e.stopPropagation();
    setDeleteTarget(s);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSale(deleteTarget.id);
    showToast(`Sale ${deleteTarget.invoiceNo} deleted successfully.`, "info");
    setDeleteTarget(null);
  };

  const handleExportPDF = () => {
    const columns = ["Invoice No", "Date", "Customer", "Fish", "Qty (KG)", "Total Amount", "Paid", "Due", "Status", "Created By"];
    const data = filtered.map(s => [
      s.invoiceNo,
      s.date,
      s.customerName,
      s.fishName,
      `${s.qtyKg} KG`,
      fmt(s.grandTotal),
      fmt(s.paid),
      fmt(s.due),
      s.status.toUpperCase(),
      s.createdBy || "Admin User"
    ]);
    exportReportToPDF({
      title: "Sales Report",
      businessName: "Royalion",
      period: "Filtered Transactions",
      columns,
      data,
      summary: [
        { label: "Total Sales Amount", value: fmt(filtered.reduce((acc, s) => acc + (s.grandTotal || 0), 0)) },
        { label: "Total Invoices", value: filtered.length.toString() }
      ]
    });
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.sales}
        subtitle="Manage all sales transactions and invoices"
        actions={
          <Btn variant="accent" icon={<Plus size={15} />} onClick={handleOpenAdd}>
            {tr.newSale}
          </Btn>
        }
      />

      <SummaryCard>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-0 sm:min-w-48" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input className="flex-1 text-sm bg-transparent outline-none" placeholder={tr.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-3 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--border)", background: "#f8fafc" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="due">Due</option>
          </select>
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExportPDF}>{tr.exportPDF}</Btn>
            <Btn variant="secondary" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>{tr.print}</Btn>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No Sales Found" sub="No sales match your filters." action="Create New Sale" onAction={handleOpenAdd} />
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {filtered.map(s => (
                <div
                  key={s.id}
                  className="border rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => navigate("sale-detail", s.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{s.invoiceNo}</div>
                      <div className="text-sm font-medium text-slate-800">{s.customerName}</div>
                      <div className="text-xs text-slate-500">{s.date} · {s.fishName} · {s.qtyKg} KG</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono" style={{ color: s.due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(s.grandTotal)}</div>
                      <Badge status={s.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">Due: <span className="font-semibold" style={{ color: s.due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(s.due)}</span></div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleOpenEdit(s, e)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={e => handleOpenDelete(s, e)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>{tr.invoiceNo}</th>
                    <th>{tr.date}</th>
                    <th>{tr.customer}</th>
                    <th>{tr.fish}</th>
                    <th>Qty KG</th>
                    <th>{tr.total}</th>
                    <th>{tr.paid}</th>
                    <th>{tr.due}</th>
                    <th>{tr.status}</th>
                    <th>{tr.createdBy}</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} onClick={() => navigate("sale-detail", s.id)} className="cursor-pointer hover:bg-slate-50">
                      <td className="mono font-medium" style={{ color: "var(--accent)" }}>{s.invoiceNo}</td>
                      <td className="text-slate-500">{s.date}</td>
                      <td className="font-medium">{s.customerName}</td>
                      <td>{s.fishName}</td>
                      <td className="mono">{s.qtyKg} KG</td>
                      <td className="mono font-semibold">{fmt(s.grandTotal)}</td>
                      <td className="mono" style={{ color: "#16a34a" }}>{fmt(s.paid)}</td>
                      <td className="mono" style={{ color: s.due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(s.due)}</td>
                      <td><Badge status={s.status} /></td>
                      <td className="text-slate-500">{s.createdBy}</td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => handleOpenEdit(s, e)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit Sale"><Pencil size={15} /></button>
                          <button onClick={e => handleOpenDelete(s, e)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Sale"><Trash2 size={15} /></button>
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
        <SaleModal
          open={modalOpen}
          sale={editTarget}
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
        title="Delete Sale Record"
        message={`Are you sure you want to delete sale ${deleteTarget?.invoiceNo}? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
