import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, KPICard, fmt, Btn, Modal, Field, Input } from "../../components/common/ui";
import { Wallet, Landmark, Users, Truck, ArrowRightLeft } from "lucide-react";

function DepositModal({ open, onClose }) {
  const { cashBalance, depositToBank, showToast } = useApp();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleDeposit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid deposit amount.", "error");
      return;
    }
    if (amt > cashBalance) {
      showToast(`Deposit amount cannot exceed available Cash In Hand (${fmt(cashBalance)}).`, "error");
      return;
    }
    depositToBank(amt, notes);
    showToast(`Rs. ${amt.toLocaleString()} deposited to bank successfully!`, "success");
    setAmount("");
    setNotes("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Deposit Cash to Bank Account" size="md">
      <div className="space-y-4">
        <div className={`rounded-xl p-3 border text-xs flex justify-between items-center ${cashBalance < 0 ? "bg-red-50 border-red-200 text-red-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
          <span className="font-medium">Available Cash In Hand:</span>
          <span className={`font-bold mono text-sm ${cashBalance < 0 ? "text-red-700" : "text-emerald-700"}`}>{fmt(cashBalance)}</span>
        </div>

        <Field label="Deposit Amount (PKR)" required>
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 50000"
          />
        </Field>

        <Field label="Deposit Details / Reference (Optional)">
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Branch cash deposit slip #104"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleDeposit}>Confirm Deposit</Btn>
      </div>
    </Modal>
  );
}

export default function Accounts() {
  const {
    lang,
    sales,
    purchases,
    customers,
    suppliers,
    payments,
    expenses,
    cashBalance,
    bankBalance,
    bankTransactions,
    navigate
  } = useApp();
  const tr = t[lang];
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const totalDue = (customers || []).reduce((s, c) => s + Math.max(c.due || 0, 0), 0);
  const totalPayable = (suppliers || []).reduce((s, sup) => s + Math.max(sup.payable || 0, 0), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const isCashMethod = (method) => (method || "Cash").trim().toLowerCase() === "cash";

  const ledgerEntries = [
    ...(bankTransactions || []).map((t) => ({
      date: t.date || "",
      desc: t.desc || "Bank Deposit",
      ref: "DEP-BANK",
      debit: 0,
      credit: parseFloat(t.amount) || 0,
      account: "Bank Account"
    })),
    ...(sales || []).filter((s) => (parseFloat(s.paid) || 0) > 0).map((s) => ({
      date: s.date || "",
      desc: `Sale: ${s.invoiceNo || s.id} (${s.customerName || "Customer"})`,
      ref: s.invoiceNo || "SALE",
      debit: 0,
      credit: parseFloat(s.paid) || 0,
      account: isCashMethod(s.paymentMethod) ? "Cash Account" : "Bank Account"
    })),
    ...(purchases || []).filter((p) => (parseFloat(p.paid) || 0) > 0).map((p) => ({
      date: p.date || "",
      desc: `Purchase: ${p.purchaseNo || p.id} (${p.supplierName || "Supplier"})`,
      ref: p.purchaseNo || "PUR",
      debit: parseFloat(p.paid) || 0,
      credit: 0,
      account: isCashMethod(p.paymentMethod) ? "Cash Account" : "Bank Account"
    })),
    ...(payments || []).filter((p) => (parseFloat(p.amount) || 0) > 0).map((p) => {
      const isCust = (p.type || p.partyType || "").toLowerCase() === "customer";
      const amt = parseFloat(p.amount) || 0;
      return {
        date: p.date || "",
        desc: `Payment ${isCust ? "from " + (p.partyName || "Customer") : "to " + (p.partyName || "Supplier")}`,
        ref: p.refNo || p.id,
        debit: isCust ? 0 : amt,
        credit: isCust ? amt : 0,
        account: isCashMethod(p.method) ? "Cash Account" : "Bank Account"
      };
    }),
    ...(expenses || []).filter((e) => (parseFloat(e.amount) || 0) > 0).map((e) => ({
      date: e.date || "",
      desc: e.description || e.category || "Expense",
      ref: e.category || "EXP",
      debit: parseFloat(e.amount) || 0,
      credit: 0,
      account: isCashMethod(e.paymentMethod) ? "Cash Account" : "Bank Account"
    }))
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.accounts}
        subtitle="Business account balances, bank deposits, and transaction ledger"
        actions={
          <Btn
            variant="accent"
            icon={<ArrowRightLeft size={15} />}
            onClick={() => setDepositModalOpen(true)}
          >
            Deposit Cash to Bank
          </Btn>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Cash In Hand"
          value={<span style={{ color: cashBalance < 0 ? "#dc2626" : "inherit" }}>{fmt(cashBalance)}</span>}
          icon={<Wallet size={18} color="white" />}
          iconBg={cashBalance < 0 ? "#dc2626" : "#16a34a"}
          onClick={() => {}}
        />
        <KPICard
          label="Bank Balance"
          value={<span style={{ color: bankBalance < 0 ? "#dc2626" : "inherit" }}>{fmt(bankBalance)}</span>}
          icon={<Landmark size={18} color="white" />}
          iconBg={bankBalance < 0 ? "#dc2626" : "var(--primary)"}
          onClick={() => {}}
        />
        <KPICard label="Customer Receivable" value={fmt(totalDue)} icon={<Users size={18} color="white" />} iconBg="#0ea5e9" onClick={() => navigate("customers")} />
        <KPICard label="Supplier Payable" value={fmt(totalPayable)} icon={<Truck size={18} color="white" />} iconBg="#d97706" onClick={() => navigate("suppliers")} />
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          {
            name: "Cash Account",
            balance: cashBalance,
            type: cashBalance < 0 ? "Overdrawn Balance" : "Positive Cash Balance",
            color: cashBalance < 0 ? "#dc2626" : "#16a34a"
          },
          {
            name: "Bank Account",
            balance: bankBalance,
            type: bankBalance < 0 ? "Overdrawn Balance" : "Positive Bank Balance",
            color: bankBalance < 0 ? "#dc2626" : "#16a34a"
          },
          {
            name: "Customer Receivables",
            balance: totalDue,
            type: "Pending Customer Payments",
            color: "#0ea5e9"
          },
          {
            name: "Supplier Payables",
            balance: totalPayable,
            type: "Pending Supplier Payments",
            color: "#dc2626"
          },
          {
            name: "Total Expenses",
            balance: totalExpenses,
            type: "Total Operating Outflow",
            color: "#d97706"
          }
        ].map((acc) => (
          <div
            key={acc.name}
            className="bg-white rounded-xl border p-4 flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <div className="text-sm font-semibold text-slate-700">{acc.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {acc.type}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold mono" style={{ color: acc.color }}>
                {fmt(acc.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SummaryCard>
        <h2 className="text-base font-bold mb-4" style={{ fontFamily: "Outfit" }}>
          General Ledger — Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Account</th>
                <th>Debit (Out)</th>
                <th>Credit (In)</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((e, i) => (
                <tr key={i}>
                  <td className="text-slate-500">{e.date}</td>
                  <td className="font-medium">{e.desc}</td>
                  <td className="mono text-slate-500">{e.ref}</td>
                  <td>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: e.account === "Bank Account" ? "#eff6ff" : "#f0fdf4",
                        color: e.account === "Bank Account" ? "#1d4ed8" : "#16a34a"
                      }}
                    >
                      {e.account}
                    </span>
                  </td>
                  <td
                    className="mono font-semibold"
                    style={{
                      color: e.debit > 0 ? "#dc2626" : "var(--muted-foreground)"
                    }}
                  >
                    {e.debit > 0 ? fmt(e.debit) : "—"}
                  </td>
                  <td
                    className="mono font-semibold"
                    style={{
                      color: e.credit > 0 ? "#16a34a" : "var(--muted-foreground)"
                    }}
                  >
                    {e.credit > 0 ? fmt(e.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SummaryCard>

      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
}

