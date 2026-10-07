import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, fmt, Btn, Modal, Field, Input, Select, EmptyState, Confirm } from "../../components/common/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MAX_NOTES_LENGTH, MAX_NAME_LENGTH, MAX_EXPENSE_CATEGORIES } from "../../constants/limits";

export const EXPENSE_CATEGORIES = [
  "Water",
  "Water Tanker Bill",
  "Electricity",
  "Generator Fuel",
  "Plant Maintenance",
  "Labour Wages",
  "Phone/Utilities",
  "Transport",
  "Rent",
  "Ice",
  "Packaging",
  "Employee Salary",
  "Fuel",
  "Loading/Unloading",
  "Repairs",
  "Other"
];

const CATEGORIES = EXPENSE_CATEGORIES;

function ExpenseModal({ open, onClose, expense = null }) {
  const { addExpense, updateExpense, showToast, currentUser } = useApp();
  const isEdit = Boolean(expense);

  const [form, setForm] = useState({
    date: expense?.date || new Date().toISOString().slice(0, 10),
    category: expense?.category || "Transport",
    desc: expense?.description || "",
    amount: expense?.amount ? String(expense.amount) : "",
    method: expense?.paymentMethod || "Cash",
    paidBy: expense?.paidBy || currentUser?.name || "Admin User"
  });

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date || new Date().toISOString().slice(0, 10),
        category: expense.category || "Transport",
        desc: expense.description || "",
        amount: String(expense.amount || ""),
        method: expense.paymentMethod || "Cash",
        paidBy: expense.paidBy || currentUser?.name || "Admin User"
      });
    } else {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        category: "Transport",
        desc: "",
        amount: "",
        method: "Cash",
        paidBy: currentUser?.name || "Admin User"
      });
    }
  }, [expense, open, currentUser]);

  const handleSave = () => {
    if (!form.date) {
      showToast("Date is required", "error");
      return;
    }
    if (!form.desc.trim() || !form.amount) {
      showToast("Description and amount are required", "error");
      return;
    }

    if (isEdit) {
      updateExpense({
        ...expense,
        date: form.date,
        category: form.category,
        description: form.desc.trim().slice(0, MAX_NOTES_LENGTH),
        amount: parseFloat(form.amount) || 0,
        paidBy: form.paidBy.slice(0, MAX_NAME_LENGTH),
        paymentMethod: form.method
      });
      showToast("Expense updated successfully!", "success");
    } else {
      const e = {
        id: Math.random().toString(36).slice(2),
        date: form.date,
        category: form.category,
        description: form.desc.trim().slice(0, MAX_NOTES_LENGTH),
        amount: parseFloat(form.amount) || 0,
        paidBy: form.paidBy.slice(0, MAX_NAME_LENGTH),
        paymentMethod: form.method,
        notes: ""
      };
      addExpense(e);
      showToast("Expense added successfully!", "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Expense" : "Add Expense"} size="md">
      <div className="space-y-4">
        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Category" required>
          <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.slice(0, MAX_EXPENSE_CATEGORIES).map(c => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Description" required>
          <Input
            value={form.desc}
            maxLength={MAX_NOTES_LENGTH}
            onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
            placeholder="Describe the expense"
          />
        </Field>
        <Field label="Amount" required>
          <Input
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </Field>
        <Field label="Paid By">
          <Input
            value={form.paidBy}
            maxLength={MAX_NAME_LENGTH}
            onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))}
          />
        </Field>
        <Field label="Payment Method">
          <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
            <option>Cash</option>
            <option>Bank</option>
            <option>Online</option>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>{isEdit ? "Update Expense" : "Save Expense"}</Btn>
      </div>
    </Modal>
  );
}

export default function Expenses() {
  const { lang, expenses, deleteExpense, showToast } = useApp();
  const tr = t[lang];
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [catFilter, setCatFilter] = useState("All");

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const filtered = catFilter === "All" ? expenses : expenses.filter(e => e.category === catFilter);

  const byCat = {};
  expenses.forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0);
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalKey(k => k + 1);
    setModalOpen(true);
  };

  const handleOpenEdit = (e) => {
    setEditTarget(e);
    setModalOpen(true);
  };

  const handleOpenDelete = (e) => {
    setDeleteTarget(e);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExpense(deleteTarget.id);
    showToast("Expense record deleted successfully.", "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.expenses}
        subtitle={`Total expenses: ${fmt(total)}`}
        actions={
          <Btn variant="accent" icon={<Plus size={15} />} onClick={handleOpenAdd}>
            Add Expense
          </Btn>
        }
      />

      {/* Category summary */}
      {Object.keys(byCat).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {Object.entries(byCat).slice(0, 5).map(([cat, amt]) => (
            <div
              key={cat}
              className="bg-white rounded-xl border p-3 cursor-pointer hover:border-teal-400 transition-colors"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setCatFilter(cat)}
            >
              <div className="text-sm sm:text-base font-bold mono" style={{ color: "var(--primary)" }}>
                {fmt(amt)}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {cat}
              </div>
            </div>
          ))}
        </div>
      )}

      <SummaryCard>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option>All</option>
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message="No Expenses Recorded"
            sub="No expenses recorded yet. Click 'Add Expense' to log an operational expense."
            action="Add Expense"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(e => (
                <div key={e.id} className="border rounded-xl p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{e.category}</span>
                      <div className="text-sm font-medium text-slate-800 mt-1">{e.description}</div>
                      <div className="text-xs text-slate-500">{e.date} · {e.paymentMethod} · {e.paidBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono" style={{ color: "#dc2626" }}>{fmt(e.amount)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleOpenEdit(e)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleOpenDelete(e)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
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
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Paid By</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td className="text-slate-500">{e.date}</td>
                      <td>
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{e.category}</span>
                      </td>
                      <td className="font-medium">{e.description}</td>
                      <td className="mono font-bold" style={{ color: "#dc2626" }}>{fmt(e.amount)}</td>
                      <td>{e.paymentMethod}</td>
                      <td className="text-slate-500">{e.paidBy}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEdit(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Edit Expense"><Pencil size={15} /></button>
                          <button onClick={() => handleOpenDelete(e)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Expense"><Trash2 size={15} /></button>
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
        <ExpenseModal
          key={editTarget ? `edit-${editTarget.id}` : `new-${modalKey}`}
          open={modalOpen}
          expense={editTarget}
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
        title="Delete Expense Record"
        message={`Are you sure you want to delete expense "${deleteTarget?.description}" (${fmt(deleteTarget?.amount || 0)})?`}
        danger
      />
    </div>
  );
}
