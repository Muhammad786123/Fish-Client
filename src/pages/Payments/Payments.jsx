import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, TabBar, SummaryCard, fmt, Btn, Modal, Field, Input, Select, Confirm } from "../../components/common/ui";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";

export function PaymentModal({
  open,
  onClose,
  type,
  payment = null
}) {
  const {
    customers,
    suppliers,
    sales,
    purchases,
    payments,
    addPayment,
    updatePayment,
    showToast
  } = useApp();

  const isEdit = Boolean(payment);

  const [form, setForm] = useState({
    date: payment?.date || new Date().toISOString().slice(0, 10),
    partyId: payment?.partyId || "",
    paymentType: payment?.paymentType || "Against Invoice",
    refId: payment?.refId || "",
    amount: payment?.amount ? String(payment.amount) : "",
    method: payment?.method || "Cash",
    notes: payment?.notes || ""
  });

  useEffect(() => {
    if (payment) {
      setForm({
        date: payment.date || new Date().toISOString().slice(0, 10),
        partyId: payment.partyId || "",
        paymentType: payment.paymentType || "Against Invoice",
        refId: payment.refId || "",
        amount: String(payment.amount || ""),
        method: payment.method || "Cash",
        notes: payment.notes || ""
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        partyId: "",
        paymentType: "Against Invoice",
        refId: "",
        amount: "",
        method: "Cash",
        notes: ""
      });
    }
  }, [payment, open]);

  const activeType = payment ? payment.type : type;
  const parties = activeType === "customer" ? customers : suppliers;

  const refs = activeType === "customer"
    ? sales.filter(s => s.customerId === form.partyId && (s.due > 0 || s.id === form.refId))
    : purchases.filter(p => p.supplierId === form.partyId && (p.remaining > 0 || p.id === form.refId));

  let maxAmt = null;
  if (form.paymentType !== "Advance") {
    if (activeType === "customer") {
      maxAmt = sales.find(s => s.id === form.refId)?.due;
    } else {
      if (form.refId) {
        maxAmt = purchases.find(p => p.id === form.refId)?.remaining;
      }
    }
  }

  const handleSave = () => {
    if (!form.date) {
      showToast("Please select a date", "error");
      return;
    }
    if (!form.partyId) {
      showToast("Please select a " + (activeType === "customer" ? "customer" : "supplier"), "error");
      return;
    }
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      showToast("Enter valid amount", "error");
      return;
    }

    const party = parties.find(p => p.id === form.partyId);
    const ref = activeType === "customer" ? sales.find(s => s.id === form.refId) : purchases.find(p => p.id === form.refId);

    let refNo = "";
    if (form.paymentType === "Advance") {
      refNo = "Advance Payment";
    } else if (activeType === "customer") {
      refNo = ref?.invoiceNo ?? "On Account";
    } else {
      refNo = ref?.purchaseNo ?? "Weekly Running Balance";
    }

    if (isEdit) {
      const updatedP = {
        ...payment,
        date: form.date,
        paymentType: form.paymentType || "Against Invoice",
        partyId: form.partyId,
        partyName: party?.name ?? payment.partyName,
        refId: form.paymentType === "Advance" ? "" : form.refId || "",
        refNo,
        amount: amt,
        method: form.method,
        notes: form.notes
      };
      updatePayment(updatedP);
      showToast("Payment record updated successfully!", "success");
    } else {
      const newP = {
        id: Math.random().toString(36).slice(2),
        type: activeType,
        paymentType: form.paymentType || "Against Invoice",
        partyId: form.partyId,
        partyName: party?.name ?? "",
        refId: form.paymentType === "Advance" ? "" : form.refId || "",
        refNo,
        amount: amt,
        date: form.date,
        method: form.method,
        person: "Admin User",
        notes: form.notes
      };
      addPayment(newP);
      showToast(`${form.paymentType === "Advance" ? "Advance payment" : "Payment"} recorded successfully!`, "success");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Payment Record" : (activeType === "customer" ? "Receive Customer Payment" : "Pay Supplier / Weekly Balance")}
      size="md"
    >
      <div className="space-y-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label={activeType === "customer" ? "Customer" : "Supplier"} required>
          <Select
            value={form.partyId}
            onChange={e => setForm(f => ({
              ...f,
              partyId: e.target.value,
              refId: ""
            }))}
          >
            <option value="">— Select —</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>

        <Field label="Payment Type" required>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, paymentType: "Against Invoice" }))}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                form.paymentType === "Against Invoice"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>📄</span> Against Invoice / Bill
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, paymentType: "Advance", refId: "" }))}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                form.paymentType === "Advance"
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>⚡</span> Advance Payment
            </button>
          </div>
        </Field>

        {form.paymentType === "Advance" && (
          <div className="rounded-xl p-3 bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
            <span className="text-purple-600 font-bold text-sm leading-none mt-0.5">ℹ</span>
            <div>
              <strong>Advance Payment:</strong> No invoice selection required. This payment will directly credit the account and reduce running balance owed.
            </div>
          </div>
        )}

        {form.paymentType === "Against Invoice" && (
          <Field label={activeType === "customer" ? "Invoice (Optional)" : "Single Purchase Bill (Optional)"}>
            <Select
              value={form.refId}
              onChange={e => {
                const rId = e.target.value;
                setForm(f => ({
                  ...f,
                  refId: rId
                }));
              }}
            >
              <option value="">— {activeType === "customer" ? "All Invoices / Account" : "Weekly Running Balance / All Bills"} —</option>
              {refs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.invoiceNo ?? r.purchaseNo} (Due: {fmt(r.due ?? r.remaining)})
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Amount" required>
          <Input
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({
              ...f,
              amount: e.target.value
            }))}
            placeholder="0"
          />
          {maxAmt && <p className="text-xs text-slate-400 mt-1">Maximum: {fmt(maxAmt)}</p>}
        </Field>

        <Field label="Payment Method">
          <Select
            value={form.method}
            onChange={e => setForm(f => ({
              ...f,
              method: e.target.value
            }))}
          >
            <option>Cash</option>
            <option>Bank</option>
            <option>Online</option>
            <option>Other</option>
          </Select>
        </Field>

        <Field label="Notes / Payment Details">
          <Input
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. Weekly settlement or advance payment"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>{isEdit ? "Update Payment" : "Record Payment"}</Btn>
      </div>
    </Modal>
  );
}

export default function Payments() {
  const {
    lang,
    payments,
    deletePayment,
    showToast
  } = useApp();
  const tr = t[lang];
  const [tab, setTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalKey, setModalKey] = useState(0);

  const custPay = payments.filter(p => p.type === "customer");
  const suppPay = payments.filter(p => p.type === "supplier");

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalKey(k => k + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditTarget(p);
    setModalOpen(true);
  };

  const handleOpenDelete = (p) => {
    setDeleteTarget(p);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePayment(deleteTarget.id);
    showToast("Payment record deleted successfully.", "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.payments}
        subtitle="Customer receipts, supplier payments, advances, and container installment tracking"
        actions={
          <Btn
            variant="accent"
            icon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            {tab === 0 ? "Receive Payment" : "Pay Supplier / Advance"}
          </Btn>
        }
      />

      <SummaryCard>
        <TabBar tabs={["Customer Payments", "Supplier Payments"]} active={tab} onChange={setTab} />
        {[custPay, suppPay][tab].length === 0 ? (
          <div className="py-10 text-center text-slate-400">No payments found.</div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {[custPay, suppPay][tab].map(p => (
                <div key={p.id} className="border rounded-xl p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{p.partyName}</div>
                      <div className="text-xs text-slate-500">{p.date} · {p.method}</div>
                      <div className="text-xs text-slate-500">{p.refNo || "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono" style={{ color: "#16a34a" }}>{fmt(p.amount)}</div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.paymentType === "Advance" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {p.paymentType}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleOpenDelete(p)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>{tab === 0 ? "Customer" : "Supplier"}</th>
                    <th>Payment Type</th>
                    <th>Reference / Bill No</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>{tab === 0 ? "Received By" : "Paid By"}</th>
                    <th>Notes</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[custPay, suppPay][tab].map(p => (
                    <tr key={p.id}>
                      <td className="text-slate-500">{p.date}</td>
                      <td className="font-semibold">{p.partyName}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${p.paymentType === "Advance" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {p.paymentType === "Advance" ? "⚡ Advance" : "📄 Against Invoice"}
                        </span>
                      </td>
                      <td>
                        <div className="mono text-slate-700 font-medium">{p.refNo || "—"}</div>
                      </td>
                      <td className="mono font-bold" style={{ color: "#16a34a" }}>{fmt(p.amount)}</td>
                      <td>{p.method}</td>
                      <td className="text-slate-500">{p.person}</td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">{p.notes || "—"}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit Payment"><Pencil size={15} /></button>
                          <button onClick={() => handleOpenDelete(p)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Payment"><Trash2 size={15} /></button>
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
        <PaymentModal
          key={editTarget ? `edit-${editTarget.id}` : `new-${modalKey}`}
          open={modalOpen}
          payment={editTarget}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
          type={tab === 0 ? "customer" : "supplier"}
        />
      )}

      <Confirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Payment Record"
        message={`Are you sure you want to delete payment record of ${fmt(deleteTarget?.amount || 0)} for ${deleteTarget?.partyName}?`}
        danger
      />
    </div>
  );
}
