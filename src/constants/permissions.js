import { SUPER_ADMIN, MANAGER, SALES_PERSON, FREEZER_OPERATOR } from "./roles";

export const ROLE_PERMISSIONS = {
  [SUPER_ADMIN]: ["*"],
  [MANAGER]: [
    "dashboard",
    "sales",
    "sale-detail",
    "new-sale",
    "invoice",
    "purchases",
    "purchase-detail",
    "new-purchase",
    "cold-store",
    "store",
    "stock",
    "fish-batches",
    "fish-detail",
    "batch-detail",
    "customers",
    "customer-detail",
    "suppliers",
    "supplier-detail",
    "payments",
    "expenses",
    "wastage",
    "daily-packing",
    "employees",
    "employee-detail",
    "accounts",
    "profit-loss",
    "reports"
  ],
  [SALES_PERSON]: [
    "dashboard",
    "sales",
    "sale-detail",
    "new-sale",
    "invoice",
    "customers",
    "customer-detail"
  ],
  [FREEZER_OPERATOR]: [
    "dashboard",
    "cold-store",
    "store",
    "stock",
    "fish-batches",
    "fish-detail",
    "batch-detail",
    "wastage",
    "daily-packing"
  ]
};

export const BOTTOM_NAV_ITEMS_BY_ROLE = {
  [SUPER_ADMIN]: ["dashboard", "sales", "purchases", "fish-batches"],
  [MANAGER]: ["dashboard", "sales", "purchases", "fish-batches"],
  [SALES_PERSON]: ["dashboard", "sales", "customers"],
  [FREEZER_OPERATOR]: ["dashboard", "fish-batches", "cold-store", "wastage"]
};

export function normalizeRole(roleStr) {
  if (!roleStr) return SUPER_ADMIN;
  const str = roleStr.toString().toUpperCase().trim();
  if (str.includes("ADMIN") || str === SUPER_ADMIN) return SUPER_ADMIN;
  if (str.includes("MANAGER") || str === MANAGER) return MANAGER;
  if (str.includes("SALES") || str === SALES_PERSON) return SALES_PERSON;
  if (str.includes("FREEZER") || str.includes("STORE") || str.includes("OPERATOR") || str.includes("STAFF") || str === FREEZER_OPERATOR) return FREEZER_OPERATOR;
  if (str.includes("ACCOUNT")) return MANAGER;
  return SUPER_ADMIN;
}

export function hasPermission(userOrRole, pageKey) {
  if (!pageKey) return true;
  const roleStr = typeof userOrRole === "object" ? userOrRole?.role : userOrRole;
  const normalized = normalizeRole(roleStr);

  const allowedPages = ROLE_PERMISSIONS[normalized];
  if (!allowedPages) return true;
  if (allowedPages.includes("*")) return true;
  return allowedPages.includes(pageKey);
}
