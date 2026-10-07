import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, ChevronDown } from "lucide-react";

// ── KPI Card ────────────────────────────────────────────────────────────────

export function KPICard({
  label,
  value,
  sub,
  icon,
  iconBg = "var(--primary)",
  onClick,
  trend
}) {
  return <div className="kpi-card bg-white rounded-xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 border cursor-pointer hover:shadow-md transition-shadow" style={{
    borderColor: "var(--border)"
  }} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{
        background: iconBg
      }}>
          {icon}
        </div>
        {trend && <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{
        background: trend.positive ? "#dcfce7" : "#fee2e2",
        color: trend.positive ? "#15803d" : "#b91c1c"
      }}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>}
      </div>
      <div>
        <div className="text-lg sm:text-2xl font-bold" style={{
        fontFamily: "Outfit",
        color: "var(--foreground)"
      }}>{value}</div>
        <div className="text-xs sm:text-sm font-medium mt-0.5" style={{
        color: "var(--muted-foreground)"
      }}>{label}</div>
        {sub && <div className="text-xs mt-1" style={{
        color: "var(--muted-foreground)"
      }}>{sub}</div>}
      </div>
    </div>;
}

// ── Status Badge ─────────────────────────────────────────────────────────────
export function Badge({
  status = ""
}) {
  const key = (status || "").toLowerCase();
  const cls = {
    paid: "badge-paid",
    partial: "badge-partial",
    due: "badge-due",
    active: "badge-active",
    warning: "badge-warning",
    inactive: "badge-inactive",
    fish: "badge-fish",
    ice: "badge-ice",
    other: "badge-other"
  }[key] ?? "badge-inactive";
  const labels = {
    paid: "Paid",
    partial: "Partial",
    due: "Due",
    active: "Active",
    warning: "Warning",
    inactive: "Inactive",
    fish: "Fish",
    ice: "Ice",
    other: "Other"
  };
  return <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {labels[key] ?? status}
    </span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md"
}) {
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  const widths = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-2xl"
  };
  return <div className="modal-backdrop-root fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 print:static print:p-0" style={{
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(2px)"
  }}>
      <div className={`modal-dialog-content bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:max-w-none`}>
        <div className="modal-header-bar flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 print:hidden" style={{
        borderColor: "var(--border)"
      }}>
          <h2 className="text-base sm:text-lg font-bold" style={{
          fontFamily: "Outfit",
          color: "var(--foreground)"
        }}>{title}</h2>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors no-print" onClick={onClose}>
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="modal-body-container flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 print:overflow-visible print:max-h-none print:p-0">{children}</div>
      </div>
    </div>;
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger
}) {
  return <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-slate-50 transition-colors" style={{
        borderColor: "var(--border)"
      }} onClick={onClose}>
          Cancel
        </button>
        <button className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{
        background: danger ? "#dc2626" : "var(--accent)"
      }} onClick={() => {
        onConfirm();
        onClose();
      }}>
          Confirm
        </button>
      </div>
    </Modal>;
}

// ── Toast Container ────────────────────────────────────────────────────────────

export function ToastContainer({
  toasts
}) {
  return <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => <div key={t.id} className="toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium" style={{
      background: t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#d97706",
      minWidth: 260
    }}>
          {t.type === "success" ? <CheckCircle size={16} /> : t.type === "error" ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
          {t.message}
        </div>)}
    </div>;
}

// ── Page Header ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
  back
}) {
  return <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
      <div>
        {back && <button className="flex items-center gap-1 text-sm mb-2 hover:underline" style={{
        color: "var(--accent)"
      }} onClick={back}>
            ← Back
          </button>}
        <h1 className="text-xl sm:text-2xl font-bold" style={{
        fontFamily: "Outfit",
        color: "var(--foreground)"
      }}>{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm mt-0.5" style={{
        color: "var(--muted-foreground)"
      }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>;
}

// ── Form Field ────────────────────────────────────────────────────────────────

export function Field({
  label,
  children,
  required,
  error
}) {
  return <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{
      color: "var(--muted-foreground)"
    }}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>;
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  ...props
}) {
  return <input className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none focus:ring-2 transition-shadow" style={{
    borderColor: "var(--border)",
    background: "#f8fafc"
  }} {...props} />;
}

// ── Select ─────────────────────────────────────────────────────────────────────
export function Select({
  children,
  ...props
}) {
  return <select className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none appearance-none cursor-pointer" style={{
    borderColor: "var(--border)",
    background: "#f8fafc"
  }} {...props}>
      {children}
    </select>;
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({
  ...props
}) {
  return <textarea className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none resize-none" style={{
    borderColor: "var(--border)",
    background: "#f8fafc"
  }} rows={3} {...props} />;
}

// ── Button ────────────────────────────────────────────────────────────────────

export function Btn({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}) {
  const styles = {
    primary: "text-white",
    secondary: "bg-white border text-slate-700 hover:bg-slate-50",
    danger: "text-white",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    accent: "text-white"
  };
  const bg = {
    primary: "var(--primary)",
    secondary: "transparent",
    danger: "#dc2626",
    ghost: "transparent",
    accent: "var(--accent)"
  };
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return <button className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all ${pad} ${styles[variant]} ${className}`} style={variant !== "secondary" && variant !== "ghost" ? {
    background: bg[variant],
    borderColor: bg[variant]
  } : {
    borderColor: "var(--border)"
  }} {...props}>
      {icon}{children}
    </button>;
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

export function TabBar({
  tabs,
  active,
  onChange
}) {
  return <div className="flex border-b mb-6" style={{
    borderColor: "var(--border)"
  }}>
      {tabs.map((tab, i) => <button key={tab} className="px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px" style={{
      borderColor: active === i ? "var(--accent)" : "transparent",
      color: active === i ? "var(--accent)" : "var(--muted-foreground)"
    }} onClick={() => onChange(i)}>
          {tab}
        </button>)}
    </div>;
}

// ── Date Filter Tabs ──────────────────────────────────────────────────────────

export function DateFilter({
  active,
  onChange,
  labels,
  values
}) {
  return <div className="flex rounded-lg border overflow-hidden overflow-x-auto" style={{
    borderColor: "var(--border)"
  }}>
      {labels.map((label, i) => <button key={values[i]} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap" style={{
      background: active === values[i] ? "var(--primary)" : "white",
      color: active === values[i] ? "white" : "var(--muted-foreground)"
    }} onClick={() => onChange(values[i])}>
          {label}
        </button>)}
    </div>;
}

// ── Stat Row ──────────────────────────────────────────────────────────────────
export function StatRow({
  label,
  value,
  color
}) {
  return <div className="flex items-center justify-between py-3 border-b last:border-0" style={{
    borderColor: "var(--border)"
  }}>
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold mono" style={{
      color: color ?? "var(--foreground)"
    }}>{value}</span>
    </div>;
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({
  message,
  sub,
  action,
  onAction
}) {
  return <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{
      background: "var(--muted)"
    }}>
        <AlertCircle size={28} style={{
        color: "var(--muted-foreground)"
      }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{
      fontFamily: "Outfit",
      color: "var(--foreground)"
    }}>{message}</h3>
      {sub && <p className="text-sm mb-4" style={{
      color: "var(--muted-foreground)"
    }}>{sub}</p>}
      {action && onAction && <button className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{
      background: "var(--accent)"
    }} onClick={onAction}>
          {action}
        </button>}
    </div>;
}

// ── Summary Card ──────────────────────────────────────────────────────────────
export function SummaryCard({
  children,
  className = ""
}) {
  return <div className={`bg-white rounded-xl border p-5 ${className}`} style={{
    borderColor: "var(--border)"
  }}>
      {children}
    </div>;
}
export function fmt(n) {
  const num = parseFloat(n) || 0;
  if (num < 0) {
    return `-Rs. ${Math.abs(num).toLocaleString("en-PK")}`;
  }
  return "Rs. " + num.toLocaleString("en-PK");
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
export function SkeletonKpiGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 animate-pulse">
      <div className="h-8 w-1/4 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-5 flex-1 bg-slate-100 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

