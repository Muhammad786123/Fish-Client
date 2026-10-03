import { useState } from "react";
import { useApp } from "../../store";
import { PageHeader, Badge, SummaryCard, StatRow, fmt, Btn, Confirm } from "../../components/common/ui";
import { FileText, Download, Printer, MessageCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { SaleModal } from "./Sales";

export default function SaleDetail() {
  const {
    selectedId,
    sales,
    deleteSale,
    navigate,
    showToast
  } = useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const sale = sales.find(s => s.id === selectedId) ?? sales[0];
  if (!sale) return null;

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteSale(sale.id);
    showToast(`Sale ${sale.invoiceNo} deleted successfully.`, "info");
    navigate("sales");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Sale Detail — ${sale.invoiceNo}`}
        back={() => navigate("sales")}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Btn>
            <Btn variant="secondary" size="sm" icon={<FileText size={13} />} onClick={() => navigate("invoice", sale.id)}>View Invoice</Btn>
            <Btn variant="secondary" size="sm" icon={<Download size={13} />}>Download PDF</Btn>
            <Btn variant="secondary" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>Print</Btn>
            <Btn variant="accent" size="sm" icon={<MessageCircle size={13} />} onClick={() => showToast("Invoice is ready to share on WhatsApp!", "success")}>Send WhatsApp</Btn>
            <Btn variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => navigate("new-sale")}>New Sale</Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          <SummaryCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ fontFamily: "Outfit" }}>Sale Information</h3>
              <Badge status={sale.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <StatRow label="Invoice No" value={sale.invoiceNo} />
              <StatRow label="Date" value={sale.date} />
              <StatRow label="Customer" value={sale.customerName} />
              <StatRow label="Fish" value={sale.fishName} />
              <StatRow label="Quantity" value={`${sale.qtyKg} KG`} />
              <StatRow label="Rate/KG" value={fmt(sale.ratePerKg)} />
              <StatRow label="Discount" value={fmt(sale.discount)} color="#d97706" />
              <StatRow label="Payment Method" value={sale.paymentMethod || "—"} />
              <StatRow label="Created By" value={sale.createdBy} />
            </div>
          </SummaryCard>

          {/* Invoice Preview */}
          <SummaryCard>
            <h3 className="font-bold mb-4" style={{ fontFamily: "Outfit" }}>Invoice Preview</h3>
            <table className="data-table w-full text-sm">
              <thead>
                <tr><th>Fish</th><th>Qty (KG)</th><th>Rate/KG</th><th>Amount</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{sale.fishName}</td>
                  <td className="mono">{sale.qtyKg} KG</td>
                  <td className="mono">{fmt(sale.ratePerKg)}</td>
                  <td className="mono font-semibold">{fmt(sale.subtotal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 space-y-1 text-sm border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="mono">{fmt(sale.subtotal)}</span></div>
              {sale.discount > 0 && <div className="flex justify-between"><span className="text-orange-600">Discount</span><span className="mono text-orange-600">-{fmt(sale.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="mono">{fmt(sale.grandTotal)}</span></div>
              <div className="flex justify-between text-green-700"><span>Paid</span><span className="mono">{fmt(sale.paid)}</span></div>
              <div className="flex justify-between font-bold" style={{ color: sale.due > 0 ? "#dc2626" : "#16a34a" }}><span>Due</span><span className="mono">{fmt(sale.due)}</span></div>
            </div>
          </SummaryCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SummaryCard>
            <h3 className="font-bold mb-3" style={{ fontFamily: "Outfit" }}>Customer</h3>
            <button className="text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }} onClick={() => navigate("customer-detail", sale.customerId)}>
              {sale.customerName}
            </button>
            <div className="mt-3 space-y-2">
              <Btn variant="accent" size="sm" className="w-full justify-center" onClick={() => navigate("payments")}>Receive Payment</Btn>
              <Btn variant="secondary" size="sm" className="w-full justify-center" onClick={() => navigate("customer-detail", sale.customerId)}>View Customer Profile</Btn>
            </div>
          </SummaryCard>
          <SummaryCard>
            <h3 className="font-bold mb-3" style={{ fontFamily: "Outfit" }}>Stock Info</h3>
            <StatRow label="Fish" value={sale.fishName} />
            <StatRow label="Quantity" value={`${sale.qtyKg} KG`} />
          </SummaryCard>
        </div>
      </div>

      {editModalOpen && (
        <SaleModal
          open={editModalOpen}
          sale={sale}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Sale Record"
        message={`Are you sure you want to delete sale ${sale.invoiceNo}? This action cannot be undone.`}
        danger
      />
    </div>
  );
}
