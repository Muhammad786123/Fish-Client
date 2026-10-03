import { useApp } from "../../store";
import { t } from "../../translations";
import { LayoutDashboard, ShoppingCart, Package, Snowflake, Fish, Users, Truck, CreditCard, Receipt, AlertTriangle, Box, UserCheck, BookOpen, TrendingUp, BarChart3, Bell, Shield, LogOut, User, ChevronRight, X } from "lucide-react";
import { POWERED_BY } from "../../constants/appConfig";
const navItems = [{
  key: "dashboard",
  page: "dashboard",
  icon: LayoutDashboard
}, {
  key: "sales",
  page: "sales",
  icon: ShoppingCart
}, {
  key: "purchases",
  page: "purchases",
  icon: Package
}, {
  key: "coldStore",
  page: "cold-store",
  icon: Snowflake
}, {
  key: "fishBatches",
  page: "fish-batches",
  icon: Fish
}, {
  key: "customers",
  page: "customers",
  icon: Users
}, {
  key: "suppliers",
  page: "suppliers",
  icon: Truck
}, {
  key: "payments",
  page: "payments",
  icon: CreditCard
}, {
  key: "expenses",
  page: "expenses",
  icon: Receipt
}, {
  key: "wastage",
  page: "wastage",
  icon: AlertTriangle
}, {
  key: "dailyPacking",
  page: "daily-packing",
  icon: Box
}, {
  key: "employees",
  page: "employees",
  icon: UserCheck
}, {
  key: "accounts",
  page: "accounts",
  icon: BookOpen
}, {
  key: "profitLoss",
  page: "profit-loss",
  icon: TrendingUp
}, {
  key: "reports",
  page: "reports",
  icon: BarChart3
}, {
  key: "usersRoles",
  page: "users-roles",
  icon: Shield
}];
export default function Sidebar() {
  const {
    page,
    lang,
    navigate,
    toggleSidebar,
    canAccess,
    currentUser,
    logout,
    sidebarOpen
  } = useApp();
  const tr = t[lang];

  const visibleNavItems = navItems.filter(item => (canAccess ? canAccess(item.page) : true));

  const handleNav = (pageName) => {
    navigate(pageName);
    // Close sidebar on mobile after navigating
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return <aside className="flex flex-col h-full overflow-y-auto" style={{
    background: "var(--primary)",
    width: "240px",
    flexShrink: 0
  }}>
    {/* Logo */}
    <div className="flex items-center justify-between px-4  ">
      <div className="flex items-center ">
        <div className="w-46 h-24 rounded-xl flex items-center justify-center  shadow-sm ">
          <img src="/logo.png" alt="Royalion" className="w-full h-full object-contain rounded-md" />
        </div>
        <div>
          {/* <div className="text-white font-bold text-base leading-tight tracking-wide" style={{
            fontFamily: "Outfit"
          }}>Royalion</div>
            <div className="text-[11px]" style={{
            color: "rgba(226,232,240,0.6)"
          }}>Trading & ERP System</div> */}
        </div>
      </div>
      {/* <button className="text-white/60 hover:text-white" onClick={toggleSidebar}>
        <X size={18} />
      </button> */}
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-3 space-y-0.5">
      {visibleNavItems.map(item => {
        const Icon = item.icon;
        const isActive = page === item.page || item.page === "sales" && (page === "sale-detail" || page === "new-sale" || page === "invoice") || item.page === "purchases" && (page === "purchase-detail" || page === "new-purchase") || item.page === "fish-batches" && (page === "fish-detail" || page === "batch-detail") || item.page === "customers" && page === "customer-detail" || item.page === "suppliers" && page === "supplier-detail" || item.page === "employees" && page === "employee-detail";
        return <button key={item.page} className={`nav-item w-full ${isActive ? "active" : ""}`} style={{
          direction: lang === "ur" ? "rtl" : "ltr"
        }} onClick={() => handleNav(item.page)}>
          <Icon size={16} />
          <span className="flex-1 text-left" style={{
            textAlign: lang === "ur" ? "right" : "left"
          }}>
            {tr[item.key]}
          </span>
        </button>;
      })}
    </nav>

    {/* Profile */}
    <div className="px-3 pb-4 border-t pt-3" style={{
      borderColor: "rgba(255,255,255,0.1)"
    }}>
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{
        background: "rgba(255,255,255,0.06)"
      }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
          background: "var(--accent)",
          color: "white"
        }}>
          {(currentUser?.name || "A")[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">{currentUser?.name || "Admin User"}</div>
          <div className="text-xs truncate" style={{
            color: "rgba(226,232,240,0.55)"
          }}>{currentUser?.role || tr.administrator}</div>
        </div>
        <ChevronRight size={14} style={{
          color: "rgba(226,232,240,0.4)"
        }} />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded flex-1 justify-center hover:bg-white/10 transition-colors"
          style={{ color: "rgba(226,232,240,0.6)" }}
          onClick={() => handleNav("users-roles")}
        >
          <User size={12} /> {tr.profile}
        </button>
        <button
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded flex-1 justify-center hover:bg-red-500/20 hover:text-red-300 transition-colors"
          style={{ color: "rgba(226,232,240,0.6)" }}
          onClick={() => logout()}
          title="Logout of session"
        >
          <LogOut size={12} /> {tr.logout}
        </button>
      </div>
      <div className="text-[10px] text-center pt-2 border-t mt-2" style={{ color: "rgba(226,232,240,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
        {POWERED_BY}
      </div>
    </div>
  </aside>;
}
