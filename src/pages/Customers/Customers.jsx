import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, Badge, SummaryCard, fmt, Btn, Modal, Field, Input, Select, EmptyState, Confirm } from "../../components/common/ui";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { MAX_CUSTOMERS, MAX_NAME_LENGTH, MAX_PHONE_LENGTH, MAX_ADDRESS_LENGTH } from "../../constants/limits";

export function CustomerModal({ open, onClose, customer = null }) {
  const { addCustomer, updateCustomer, customers, showToast } = useApp();
  const isEdit = Boolean(customer);

  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    opening: customer?.openingBalance ? String(customer.openingBalance) : "0",
    status: customer?.status || "active"
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        opening: customer.openingBalance !== undefined ? String(customer.openingBalance) : "0",
        status: customer.status || "active"
      });
    } else {
      setForm({
        name: "",
        phone: "",
        address: "",
        opening: "0",
        status: "active"
      });
    }
  }, [customer, open]);

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("Customer name is required", "error");
      return;
    }
    if (!isEdit && customers.length >= MAX_CUSTOMERS) {
      showToast(`Maximum customer limit (${MAX_CUSTOMERS}) reached.`, "error");
      return;
    }

    const openingVal = parseFloat(form.opening) || 0;

    if (isEdit) {
      updateCustomer({
        ...customer,
        name: form.name.slice(0, MAX_NAME_LENGTH),
        phone: form.phone.slice(0, MAX_PHONE_LENGTH),
        address: form.address.slice(0, MAX_ADDRESS_LENGTH),
        openingBalance: openingVal,
        status: form.status
      });
      showToast("Customer updated successfully!", "success");
    } else {
      const c = {
        id: Math.random().toString(36).slice(2),
        name: form.name.slice(0, MAX_NAME_LENGTH),
        phone: form.phone.slice(0, MAX_PHONE_LENGTH),
        address: form.address.slice(0, MAX_ADDRESS_LENGTH),
        openingBalance: openingVal,
        totalSales: 0,
        paid: 0,
        due: openingVal,
        lastPurchase: "—",
        status: "active"
      };
      addCustomer(c);
      showToast("Customer added successfully!", "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Customer" : "Add Customer"} size="md">
      <div className="space-y-4">
        <Field label="Customer Name" required>
          <Input
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Muhammad Traders"
          />
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
            placeholder="Shop 12, Fish Market, Karachi"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Opening Balance">
            <Input
              type="number"
              value={form.opening}
              onChange={e => setForm(f => ({ ...f, opening: e.target.value }))}
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
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>{isEdit ? "Update Customer" : "Save Customer"}</Btn>
      </div>
    </Modal>
  );
}

export default function Customers() {
  const { lang, customers, sales, payments, deleteCustomer, navigate, showToast } = useApp();
  const tr = t[lang];
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );
  const totalReceivable = customers.reduce((s, c) => s + (c.due || 0), 0);

  const handleOpenAdd = () => {
    setEditCustomer(null);
    setModalKey(k => k + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (c, e) => {
    e.stopPropagation();
    setEditCustomer(c);
    setModalOpen(true);
  };

  const handleOpenDelete = (c, e) => {
    e.stopPropagation();
    const hasSales = sales.some(s => s.customerId === c.id);
    const hasPayments = payments.some(p => p.partyId === c.id);
    if (hasSales || hasPayments) {
      showToast(`Cannot delete customer "${c.name}": Sales or payment records are linked to this customer.`, "error");
      return;
    }
    setDeleteTarget(c);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCustomer(deleteTarget.id);
    showToast(`Customer "${deleteTarget.name}" deleted successfully.`, "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.customers}
        subtitle={`${customers.length} customers · Total Receivable: ${fmt(totalReceivable)}`}
        actions={
          <Btn variant="accent" icon={<Plus size={15} />} onClick={handleOpenAdd}>
            {tr.addCustomer}
          </Btn>
        }
      />

      <SummaryCard>
        <div className="flex gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              className="flex-1 text-sm bg-transparent outline-none"
              placeholder={tr.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message="No Customers Found"
            sub="No customers exist yet. Click 'Add Customer' to register a new customer."
            action="Add Customer"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {filtered.map(c => (
                <div
                  key={c.id}
                  className="border rounded-xl p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => navigate("customer-detail", c.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{c.name}</div>
                      <div className="text-xs text-slate-500">{c.phone || "No phone"}</div>
                    </div>
                    <Badge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-slate-500">
                      Sales: <span className="font-semibold text-slate-700">{fmt(c.totalSales)}</span>{" "}
                      Due: <span className="font-semibold" style={{ color: c.due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(c.due)}</span>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleOpenEdit(c, e)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={e => handleOpenDelete(c, e)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={15} /></button>
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
                    <th>{tr.name}</th>
                    <th>{tr.phone}</th>
                    <th>{tr.totalSales}</th>
                    <th>{tr.paid}</th>
                    <th>{tr.due}</th>
                    <th>{tr.lastPurchase}</th>
                    <th>{tr.status}</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} onClick={() => navigate("customer-detail", c.id)} className="cursor-pointer hover:bg-slate-50">
                      <td className="font-semibold" style={{ color: "var(--primary)" }}>{c.name}</td>
                      <td className="mono text-slate-500">{c.phone}</td>
                      <td className="mono font-medium">{fmt(c.totalSales)}</td>
                      <td className="mono" style={{ color: "#16a34a" }}>{fmt(c.paid)}</td>
                      <td className="mono font-semibold" style={{ color: c.due > 0 ? "#dc2626" : "#16a34a" }}>
                        {fmt(c.due)}
                      </td>
                      <td className="text-slate-500">{c.lastPurchase}</td>
                      <td><Badge status={c.status} /></td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={e => handleOpenEdit(c, e)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit Customer"><Pencil size={15} /></button>
                          <button onClick={e => handleOpenDelete(c, e)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Customer"><Trash2 size={15} /></button>
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
        <CustomerModal
          key={editCustomer ? `edit-${editCustomer.id}` : `new-${modalKey}`}
          open={modalOpen}
          customer={editCustomer}
          onClose={() => {
            setModalOpen(false);
            setEditCustomer(null);
          }}
        />
      )}

      <Confirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deleteTarget?.name}"? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
