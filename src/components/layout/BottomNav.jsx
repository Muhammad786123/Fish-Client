import React from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { SUPER_ADMIN } from "../../constants/roles";
import {
  BOTTOM_NAV_ITEMS_BY_ROLE,
  normalizeRole
} from "../../constants/permissions";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Fish,
  Users,
  Snowflake,
  AlertTriangle,
  Truck,
  CreditCard,
  Receipt,
  UserCheck,
  BookOpen,
  TrendingUp,
  BarChart3,
  Shield,
  Menu
} from "lucide-react";

// Map of page keys to lucide icons and translation keys
const PAGE_CONFIG = {
  dashboard: { icon: LayoutDashboard, labelKey: "dashboard", fallback: "Dashboard" },
  sales: { icon: ShoppingCart, labelKey: "sales", fallback: "Sales" },
  purchases: { icon: Package, labelKey: "purchases", fallback: "Purchases" },
  "fish-batches": { icon: Fish, labelKey: "fishBatches", fallback: "Stock" },
  customers: { icon: Users, labelKey: "customers", fallback: "Customers" },
  suppliers: { icon: Truck, labelKey: "suppliers", fallback: "Suppliers" },
  "cold-store": { icon: Snowflake, labelKey: "coldStore", fallback: "Current Stock" },
  wastage: { icon: AlertTriangle, labelKey: "wastage", fallback: "Wastage" },
  employees: { icon: UserCheck, labelKey: "employees", fallback: "Employees" },
  payments: { icon: CreditCard, labelKey: "payments", fallback: "Payments" },
  expenses: { icon: Receipt, labelKey: "expenses", fallback: "Expenses" },
  accounts: { icon: BookOpen, labelKey: "accounts", fallback: "Accounts" },
  "profit-loss": { icon: TrendingUp, labelKey: "profitLoss", fallback: "Profit & Loss" },
  reports: { icon: BarChart3, labelKey: "reports", fallback: "Reports" },
  "users-roles": { icon: Shield, labelKey: "usersRoles", fallback: "Roles" }
};

export default function BottomNav() {
  const { page, lang, navigate, toggleSidebar, canAccess, currentUser } = useApp();
  const tr = t[lang] || {};

  // If currentUser or permission data isn't available yet, render a safe skeleton
  if (!currentUser) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 text-slate-400 border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-14 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Get per-role candidate items from centralized permissions mapping
  const roleName = normalizeRole(currentUser.role);
  const roleCandidates = BOTTOM_NAV_ITEMS_BY_ROLE[roleName] || BOTTOM_NAV_ITEMS_BY_ROLE[SUPER_ADMIN] || ["dashboard"];

  // Filter against canAccess permission helper (same logic used by Sidebar)
  const allowedPageKeys = roleCandidates.filter((pageKey) => canAccess ? canAccess(pageKey) : true);

  // Build item list, preserving max 4 page items + "More" item
  const pageItems = allowedPageKeys.map((pageKey) => {
    const config = PAGE_CONFIG[pageKey] || { icon: LayoutDashboard, labelKey: pageKey, fallback: pageKey };
    return {
      key: pageKey,
      page: pageKey,
      icon: config.icon,
      label: tr[config.labelKey] || config.fallback
    };
  });

  const navItems = [
    ...pageItems,
    { key: "more", action: "more", icon: Menu, label: tr.more || "More" }
  ];

  const isItemActive = (item) => {
    if (item.action === "more") return false;
    if (page === item.page) return true;
    if (item.page === "sales" && (page === "sale-detail" || page === "new-sale" || page === "invoice")) return true;
    if (item.page === "purchases" && (page === "purchase-detail" || page === "new-purchase")) return true;
    if (item.page === "fish-batches" && (page === "fish-detail" || page === "batch-detail")) return true;
    if (item.page === "cold-store" && (page === "cold-store" || page === "store" || page === "stock")) return true;
    if (item.page === "customers" && page === "customer-detail") return true;
    if (item.page === "suppliers" && page === "supplier-detail") return true;
    if (item.page === "employees" && page === "employee-detail") return true;
    return false;
  };

  const handleClick = (item) => {
    if (item.action === "more") {
      toggleSidebar();
    } else {
      navigate(item.page);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.15)] bg-slate-900 text-slate-300 border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <button
              key={item.key}
              onClick={() => handleClick(item)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg transition-colors active:scale-95 ${
                active
                  ? "text-sky-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon size={18} className={active ? "text-sky-400" : ""} />
              <span className="text-[10px] mt-0.5 leading-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
