import { useApp } from "../../store";
import { Btn, fmt } from "../../components/common/ui";
import { Download, Printer, MessageCircle, Fish } from "lucide-react";
import { POWERED_BY } from "../../constants/appConfig";
export default function Invoice() {
  const {
    selectedId,
    sales,
    navigate,
    showToast
  } = useApp();
  const sale = sales.find(s => s.id === selectedId) ?? sales[0];
  if (!sale) return null;
  return <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 no-print">
        <button className="text-sm font-medium hover:underline" style={{
        color: "var(--accent)"
      }} onClick={() => navigate("sale-detail", sale.id)}>
          ← Back to Sale
        </button>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>Print</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={13} />}>Download PDF</Btn>
          <Btn variant="accent" size="sm" icon={<MessageCircle size={13} />} onClick={() => showToast("Invoice is ready to share on WhatsApp!", "success")}>Send Invoice</Btn>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{
      borderColor: "var(--border)"
    }}>
        {/* Invoice Header */}
        <div className="px-8 py-6 flex items-start justify-between" style={{
        background: "var(--primary)"
      }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 p-1 shadow-sm border border-white/20">
              <img src="/logo.png" alt="Royalion Logo" className="w-full h-full object-contain rounded-md" />
            </div>
            <div>
              <div className="text-white font-bold text-xl" style={{
              fontFamily: "Outfit"
            }}>Royalion</div>
              <div className="text-white/70 text-sm">Fish Harbour, Karachi · 0300-0000000</div>
              <div className="text-white/60 text-xs">info@royalion.com</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-xs uppercase tracking-widest">Invoice</div>
            <div className="text-white text-2xl font-bold mono" style={{
            fontFamily: "Outfit"
          }}>{sale.invoiceNo}</div>
            <div className="text-white/70 text-sm">{sale.date}</div>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b" style={{
        borderColor: "var(--border)",
        background: "#f8fafc"
      }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{
            color: "var(--muted-foreground)"
          }}>Bill To</div>
            <div className="font-semibold text-slate-800">{sale.customerName}</div>
            <div className="text-sm text-slate-500">Karachi, Pakistan</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{
            color: "var(--muted-foreground)"
          }}>Payment</div>
            <div className="text-sm text-slate-600">Method: {sale.paymentMethod || "—"}</div>
            <div className="text-sm font-semibold" style={{
            color: sale.due > 0 ? "#dc2626" : "#16a34a"
          }}>
              Status: {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{
              borderColor: "var(--border)"
            }}>
                <th className="text-left py-2 font-semibold text-slate-500 text-xs uppercase">Fish</th>
                <th className="text-right py-2 font-semibold text-slate-500 text-xs uppercase">KG</th>
                <th className="text-right py-2 font-semibold text-slate-500 text-xs uppercase">Rate/KG</th>
                <th className="text-right py-2 font-semibold text-slate-500 text-xs uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3">{sale.fishName}</td>
                <td className="text-right mono">{sale.qtyKg}</td>
                <td className="text-right mono">{fmt(sale.ratePerKg)}</td>
                <td className="text-right mono font-semibold">{fmt(sale.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-8">
          <div className="ml-auto max-w-xs space-y-2 text-sm border-t pt-4" style={{
          borderColor: "var(--border)"
        }}>
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="mono">{fmt(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-orange-600"><span>Discount</span><span className="mono">-{fmt(sale.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2" style={{
            borderColor: "var(--border)"
          }}><span>Grand Total</span><span className="mono">{fmt(sale.grandTotal)}</span></div>
            <div className="flex justify-between text-green-700"><span>Paid</span><span className="mono">{fmt(sale.paid)}</span></div>
            <div className="flex justify-between font-bold text-base" style={{
            color: sale.due > 0 ? "#dc2626" : "#16a34a"
          }}>
              <span>Balance Due</span><span className="mono">{fmt(sale.due)}</span>
            </div>
          </div>

          {sale.due > 0 && <div className="mt-6 rounded-xl p-4 text-sm text-center" style={{
          background: "#fee2e2",
          color: "#b91c1c"
        }}>
              <strong>Payment Reminder:</strong> Rs. {sale.due.toLocaleString()} is outstanding. Please settle at your earliest convenience.
            </div>}

          <div className="mt-8 pt-6 border-t text-center text-xs text-slate-400 space-y-1" style={{
          borderColor: "var(--border)"
        }}>
            <div>Thank you for your business! · Royalion · info@royalion.com</div>
            <div className="text-[10px] text-slate-400">{POWERED_BY}</div>
          </div>
        </div>
      </div>
    </div>;
}
