import { useState } from "react";
import { useApp } from "../../store";
import { PageHeader, SummaryCard, StatRow, Badge, TabBar, fmt, Btn, Confirm } from "../../components/common/ui";
import { Plus, CreditCard, MessageCircle, BookOpen, Pencil, Trash2 } from "lucide-react";
import { CustomerModal } from "./Customers";

export default function CustomerDetail() {
  const {
    selectedId,
    customers,
    sales,
    payments,
    deleteCustomer,
    navigate,
    showToast
  } = useApp();

  const [tab, setTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const customer = customers.find(c => c.id === selectedId) ?? customers[0];
  if (!customer) return null;

  const cSales = sales.filter(s => s.customerId === customer.id);
  const cPayments = payments.filter(p => p.type === "customer" && p.partyId === customer.id);
  const ledger = [...cSales.map(s => ({
    date: s.date,
    desc: `Sale ${s.invoiceNo}`,
    debit: s.grandTotal,
    credit: 0,
    type: "sale",
    id: s.id
  })), ...cPayments.map(p => ({
    date: p.date,
    desc: `Payment ${p.refNo}`,
    debit: 0,
    credit: p.amount,
    type: "payment",
    id: p.id
  }))].sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = () => {
    if (cSales.length > 0 || cPayments.length > 0) {
      showToast(`Cannot delete customer "${customer.name}": Sales or payment records exist.`, "error");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteCustomer(customer.id);
    showToast(`Customer "${customer.name}" deleted successfully.`, "info");
    navigate("customers");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title={customer.name}
        subtitle={customer.phone + " · " + customer.address}
        back={() => navigate("customers")}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Btn>
            <Btn variant="accent" size="sm" icon={<Plus size={13} />} onClick={() => navigate("new-sale")}>New Sale</Btn>
            <Btn variant="primary" size="sm" icon={<CreditCard size={13} />} onClick={() => navigate("payments")}>Receive Payment</Btn>
            <Btn variant="secondary" size="sm" icon={<MessageCircle size={13} />} onClick={() => showToast("Opening WhatsApp for " + customer.name, "success")}>WhatsApp</Btn>
            <Btn variant="secondary" size="sm" icon={<BookOpen size={13} />}>View Ledger</Btn>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[{
          label: "Total Sales",
          value: fmt(customer.totalSales),
          color: "var(--primary)"
        }, {
          label: "Paid",
          value: fmt(customer.paid),
          color: "#16a34a"
        }, {
          label: "Outstanding",
          value: fmt(customer.due),
          color: customer.due > 0 ? "#dc2626" : "#16a34a"
        }, {
          label: "Last Purchase",
          value: customer.lastPurchase,
          color: "var(--foreground)"
        }].map(item => (
          <div key={item.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-xl font-bold mono" style={{ fontFamily: "Outfit", color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <SummaryCard>
        <TabBar tabs={["Overview", "Sales", "Payments", "Ledger"]} active={tab} onChange={setTab} />
        {tab === 0 && (
          <div className="grid grid-cols-2 gap-x-6 max-w-md">
            <StatRow label="Name" value={customer.name} />
            <StatRow label="Phone" value={customer.phone} />
            <StatRow label="Address" value={customer.address || "—"} />
            <StatRow label="Status" value={customer.status} />
            <StatRow label="Opening Balance" value={fmt(customer.openingBalance)} />
          </div>
        )}
        {tab === 1 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Invoice #</th><th>Date</th><th>Fish</th><th>Qty</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {cSales.map(s => (
                  <tr key={s.id} onClick={() => navigate("sale-detail", s.id)}>
                    <td className="mono font-medium" style={{ color: "var(--accent)" }}>{s.invoiceNo}</td>
                    <td className="text-slate-500">{s.date}</td>
                    <td>{s.fishName}</td>
                    <td className="mono">{s.qtyKg} KG</td>
                    <td className="mono font-semibold">{fmt(s.grandTotal)}</td>
                    <td className="mono" style={{ color: "#16a34a" }}>{fmt(s.paid)}</td>
                    <td className="mono" style={{ color: s.due > 0 ? "#dc2626" : "#16a34a" }}>{fmt(s.due)}</td>
                    <td><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 2 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Payment ID</th><th>Date</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Received By</th></tr>
              </thead>
              <tbody>
                {cPayments.map(p => (
                  <tr key={p.id}>
                    <td className="mono font-medium" style={{ color: "var(--accent)" }}>{p.id.toUpperCase()}</td>
                    <td className="text-slate-500">{p.date}</td>
                    <td>
                      <span className="mono font-medium">{p.refNo}</span>
                      {p.paymentType && (
                        <span
                          className={`ml-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${
                            p.paymentType === "Advance"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.paymentType === "Advance" ? "⚡ Advance" : "📄 Invoice"}
                        </span>
                      )}
                    </td>
                    <td className="mono font-bold" style={{ color: "#16a34a" }}>{fmt(p.amount)}</td>
                    <td>{p.method}</td>
                    <td className="text-slate-500">{p.person}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 3 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {(() => {
                  let bal = customer.openingBalance;
                  return ledger.map(row => {
                    bal += row.debit - row.credit;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => row.type === "sale" ? navigate("sale-detail", row.id) : undefined}
                        style={{ cursor: row.type === "sale" ? "pointer" : "default" }}
                      >
                        <td className="text-slate-500">{row.date}</td>
                        <td className="font-medium">{row.desc}</td>
                        <td className="mono" style={{ color: row.debit > 0 ? "#dc2626" : "var(--muted-foreground)" }}>
                          {row.debit > 0 ? fmt(row.debit) : "—"}
                        </td>
                        <td className="mono" style={{ color: row.credit > 0 ? "#16a34a" : "var(--muted-foreground)" }}>
                          {row.credit > 0 ? fmt(row.credit) : "—"}
                        </td>
                        <td className="mono font-bold" style={{ color: bal > 0 ? "#dc2626" : "#16a34a" }}>
                          {fmt(Math.abs(bal))}{bal > 0 ? " Dr" : " Cr"}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </SummaryCard>

      {editModalOpen && (
        <CustomerModal
          open={editModalOpen}
          customer={customer}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
