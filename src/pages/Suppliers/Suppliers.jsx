import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, Badge, SummaryCard, fmt, Btn, Modal, Field, Input, Select, StatRow, TabBar, Confirm } from "../../components/common/ui";
import { Plus, Search, MessageCircle, Package, Pencil, Trash2 } from "lucide-react";
import { MAX_SUPPLIERS, MAX_NAME_LENGTH, MAX_PHONE_LENGTH, MAX_ADDRESS_LENGTH } from "../../constants/limits";

export function SupplierModal({
  open,
  onClose,
  supplier = null
}) {
  const {
    addSupplier,
    updateSupplier,
    suppliers,
    showToast
  } = useApp();

  const isEdit = Boolean(supplier);

  const [form, setForm] = useState({
    name: supplier?.name || "",
    supplierType: supplier?.supplierType || "Fish",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    status: supplier?.status || "active"
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("Please enter a supplier name.", "error");
      return;
    }
    if (!isEdit && suppliers.length >= MAX_SUPPLIERS) {
      showToast(`Maximum supplier limit (${MAX_SUPPLIERS}) reached.`, "error");
      return;
    }

    if (isEdit) {
      updateSupplier({
        ...supplier,
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        supplierType: form.supplierType || "Fish",
        phone: form.phone.trim().slice(0, MAX_PHONE_LENGTH),
        address: form.address.trim().slice(0, MAX_ADDRESS_LENGTH),
        status: form.status
      });
      showToast(`Supplier "${form.name}" updated successfully!`, "success");
    } else {
      const s = {
        id: Math.random().toString(36).slice(2),
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        supplierType: form.supplierType || "Fish",
        phone: form.phone.trim().slice(0, MAX_PHONE_LENGTH),
        address: form.address.trim().slice(0, MAX_ADDRESS_LENGTH),
        totalPurchases: 0,
        paid: 0,
        payable: 0,
        lastPurchase: "—",
        status: "active"
      };
      addSupplier(s);
      showToast(`${s.name} (${s.supplierType}) added successfully!`, "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Supplier" : "Add Supplier"} size="md">
      <div className="space-y-4">
        <Field label="Supplier Name" required>
          <Input
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ali Seafood Supplier or Kemari Ice Works"
          />
        </Field>

        <Field label="Supplier Category / Type" required>
          <Select
            value={form.supplierType}
            onChange={e => setForm(f => ({ ...f, supplierType: e.target.value }))}
          >
            <option value="Fish">Fish</option>
            <option value="Ice">Ice</option>
            <option value="Other">Other</option>
          </Select>
        </Field>

        <Field label="Phone">
          <Input
            value={form.phone}
            maxLength={MAX_PHONE_LENGTH}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0300-1234567"
          />
        </Field>

        <Field label="Address">
          <Input
            value={form.address}
            maxLength={MAX_ADDRESS_LENGTH}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="e.g. Fish Harbour, Karachi"
          />
        </Field>

        {isEdit && (
          <Field label="Status">
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>{isEdit ? "Update Supplier" : "Save Supplier"}</Btn>
      </div>
    </Modal>
  );
}

export function SupplierDetail() {
  const {
    selectedId,
    suppliers,
    purchases,
    payments,
    deleteSupplier,
    navigate,
    showToast
  } = useApp();

  const [tab, setTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const supplier = suppliers.find(s => s.id === selectedId) ?? suppliers[0];
  if (!supplier) return null;

  const sPurchases = purchases.filter(p => p.supplierId === supplier.id);
  const sPayments = payments.filter(p => p.type === "supplier" && p.partyId === supplier.id);

  const totalPurchasesAmt = supplier.totalPurchases ?? sPurchases.reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalPaidAmt = supplier.paid ?? sPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const payableAmt = supplier.payable !== undefined ? supplier.payable : Math.max(totalPurchasesAmt - totalPaidAmt, 0);

  const tabList = ["Overview", "Purchases", "Payments", "Ledger Statement"];

  const handleDelete = () => {
    if (sPurchases.length > 0 || sPayments.length > 0) {
      showToast(`Cannot delete supplier "${supplier.name}": Linked purchases or payments exist.`, "error");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteSupplier(supplier.id);
    showToast(`Supplier "${supplier.name}" deleted successfully.`, "info");
    navigate("suppliers");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title={supplier.name}
        subtitle={`${supplier.supplierType || "Fish"} Supplier · ${supplier.phone}`}
        back={() => navigate("suppliers")}
        actions={
          <div className="flex items-center gap-2">
            <Badge status={supplier.supplierType || "Fish"} />
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Btn>
            <Btn variant="accent" size="sm" onClick={() => navigate("new-purchase")}>New Purchase</Btn>
            <Btn variant="primary" size="sm" onClick={() => navigate("payments")}>Pay Supplier</Btn>
            <Btn
              variant="secondary"
              size="sm"
              icon={<MessageCircle size={13} />}
              onClick={() => showToast("Contacting supplier on WhatsApp!", "success")}
            >
              WhatsApp
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Purchases",
            value: fmt(totalPurchasesAmt),
            color: "var(--primary)"
          },
          {
            label: "Paid",
            value: fmt(totalPaidAmt),
            color: "#16a34a"
          },
          {
            label: "Payable",
            value: fmt(payableAmt),
            color: payableAmt > 0 ? "#dc2626" : "#16a34a"
          }
        ].map(item => (
          <div
            key={item.label}
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="text-xl font-bold mono"
              style={{ fontFamily: "Outfit", color: item.color }}
            >
              {item.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <SummaryCard>
        <TabBar tabs={tabList} active={tab} onChange={setTab} />

        {/* TAB 0: OVERVIEW */}
        {tab === 0 && (
          <div>
            <div className="max-w-md space-y-1">
              <StatRow label="Name" value={supplier.name} />
              <StatRow label="Supplier Type" value={<Badge status={supplier.supplierType || "Fish"} />} />
              <StatRow label="Phone" value={supplier.phone} />
              <StatRow label="Address" value={supplier.address || "—"} />
              <StatRow label="Status" value={<Badge status={supplier.status} />} />
              <StatRow label="Last Purchase" value={supplier.lastPurchase} />
            </div>
          </div>
        )}

        {/* TAB 1: PURCHASES */}
        {tab === 1 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Date</th>
                  <th>Fish</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Shipment</th>
                </tr>
              </thead>
              <tbody>
                {sPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400 text-sm">
                      No purchase records for this supplier.
                    </td>
                  </tr>
                ) : (
                  sPurchases.map(p => (
                    <tr key={p.id} onClick={() => navigate("purchase-detail", p.id)}>
                      <td className="mono font-medium" style={{ color: "var(--accent)" }}>
                        {p.purchaseNo}
                      </td>
                      <td className="text-slate-500">{p.date}</td>
                      <td>{p.fishName}</td>
                      <td className="mono">{p.qtyKg} KG</td>
                      <td className="mono font-semibold">{fmt(p.totalCost)}</td>
                      <td className="mono" style={{ color: "#16a34a" }}>
                        {fmt(p.paid)}
                      </td>
                      <td className="mono" style={{ color: p.remaining > 0 ? "#dc2626" : "#16a34a" }}>
                        {fmt(p.remaining)}
                      </td>
                      <td className="mono text-xs">
                        {p.containerId ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            📦 {p.containerId}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PAYMENTS */}
        {tab === 2 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Shipment</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Paid By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400 text-sm">
                      No payment records for this supplier.
                    </td>
                  </tr>
                ) : (
                  sPayments.map(p => (
                    <tr key={p.id}>
                      <td className="text-slate-500">{p.date}</td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            p.paymentType === "Advance"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.paymentType === "Advance" ? "⚡ Advance" : "📄 Against Invoice"}
                        </span>
                      </td>
                      <td className="mono font-medium">{p.refNo}</td>
                      <td>
                        {p.containerId ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            📦 {p.containerId}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="mono font-bold" style={{ color: "#16a34a" }}>
                        {fmt(p.amount)}
                      </td>
                      <td>{p.method}</td>
                      <td className="text-slate-500">{p.person}</td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">{p.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: LEDGER VIEW */}
        {tab === 3 && (
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 mt-4" style={{ fontFamily: "Outfit" }}>
              Supplier Account Ledger Statement
            </h4>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference / Container</th>
                    <th>Paid Amount (Debit)</th>
                    <th>Bill Amount (Credit)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...sPurchases.map(p => ({
                      date: p.date,
                      type: "Purchase",
                      paymentType: null,
                      ref: p.purchaseNo,
                      containerId: p.containerId,
                      debit: 0,
                      credit: p.totalCost,
                      notes: `${p.fishName} (${p.qtyKg} KG)`
                    })),
                    ...sPayments.map(pay => ({
                      date: pay.date,
                      type: pay.paymentType === "Advance" ? "Advance Payment" : "Payment",
                      paymentType: pay.paymentType || "Against Invoice",
                      ref: pay.refNo,
                      containerId: pay.containerId,
                      debit: pay.amount,
                      credit: 0,
                      notes: `${pay.method}${pay.notes ? ` · ${pay.notes}` : ""}`
                    }))
                  ]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-slate-500 mono">{item.date}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            item.type === "Purchase"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : item.paymentType === "Advance"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}>
                            {item.paymentType === "Advance" ? "⚡ Advance Payment" : item.type}
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-800 mono">{item.ref}</span>
                          {item.containerId && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              📦 {item.containerId}
                            </span>
                          )}
                          <div className="text-[11px] text-slate-400">{item.notes}</div>
                        </td>
                        <td className="mono font-bold text-red-700">
                          {item.debit > 0 ? fmt(item.debit) : "—"}
                        </td>
                        <td className="mono font-bold text-slate-900">
                          {item.credit > 0 ? fmt(item.credit) : "—"}
                        </td>
                        <td>
                          <Badge status={item.type === "Purchase" ? "active" : "paid"} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SummaryCard>

      {editModalOpen && (
        <SupplierModal
          open={editModalOpen}
          supplier={supplier}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`}
        danger
      />
    </div>
  );
}

export default function Suppliers() {
  const {
    lang,
    suppliers,
    purchases,
    payments,
    deleteSupplier,
    navigate,
    showToast
  } = useApp();

  const tr = t[lang];

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");

  const typeOptions = ["All", "Fish", "Ice", "Other"];

  const filtered = suppliers.filter(s => {
    const sType = s.supplierType || "Fish";
    const matchesType = typeFilter === "All" || sType === typeFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditSupplier(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (s, e) => {
    e.stopPropagation();
    setEditSupplier(s);
    setModalOpen(true);
  };

  const handleOpenDelete = (s, e) => {
    e.stopPropagation();
    const hasPurchases = purchases.some(p => p.supplierId === s.id);
    const hasPayments = payments.some(p => p.type === "supplier" && p.partyId === s.id);
    if (hasPurchases || hasPayments) {
      showToast(`Cannot delete supplier "${s.name}": Linked purchase or payment records exist.`, "error");
      return;
    }
    setDeleteTarget(s);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSupplier(deleteTarget.id);
    showToast(`Supplier "${deleteTarget.name}" deleted successfully.`, "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.suppliers}
        subtitle={`${suppliers.length} suppliers · Total Payable: ${fmt(suppliers.reduce((s, x) => s + (x.payable || 0), 0))}`}
        actions={
          <Btn
            variant="accent"
            icon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            Add Supplier
          </Btn>
        }
      />

      <SummaryCard>
        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 border-b pb-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center gap-2">
            {typeOptions.map(type => {
              const count = type === "All"
                ? suppliers.length
                : suppliers.filter(s => (s.supplierType || "Fish") === type).length;
              const isActive = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  style={isActive ? { background: "var(--primary)" } : {}}
                >
                  <span>{type === "All" ? "All Suppliers" : `${type} Suppliers`}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border w-full md:w-64"
            style={{
              borderColor: "var(--border)",
              background: "#f8fafc"
            }}
          >
            <Search size={14} className="text-slate-400" />
            <input
              className="flex-1 text-sm bg-transparent outline-none"
              placeholder={tr.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Total Purchases</th>
                <th>Paid</th>
                <th>Payable</th>
                <th>Last Purchase</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 text-sm">
                    No suppliers found matching "{typeFilter}" category or search term.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => navigate("supplier-detail", s.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="font-semibold" style={{ color: "var(--primary)" }}>
                      {s.name}
                    </td>
                    <td>
                      <Badge status={s.supplierType || "Fish"} />
                    </td>
                    <td className="mono text-slate-500">{s.phone}</td>
                    <td className="mono font-medium">{fmt(s.totalPurchases)}</td>
                    <td className="mono" style={{ color: "#16a34a" }}>
                      {fmt(s.paid)}
                    </td>
                    <td
                      className="mono font-semibold"
                      style={{
                        color: s.payable > 0 ? "#dc2626" : "#16a34a"
                      }}
                    >
                      {fmt(s.payable)}
                    </td>
                    <td className="text-slate-500">{s.lastPurchase}</td>
                    <td>
                      <Badge status={s.status} />
                    </td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={e => handleOpenEdit(s, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Edit Supplier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={e => handleOpenDelete(s, e)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Supplier"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SummaryCard>

      {modalOpen && (
        <SupplierModal
          open={modalOpen}
          supplier={editSupplier}
          onClose={() => {
            setModalOpen(false);
            setEditSupplier(null);
          }}
        />
      )}

      <Confirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${deleteTarget?.name}"? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
