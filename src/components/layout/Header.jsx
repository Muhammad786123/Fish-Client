import { useState } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { Bell, Search, Menu, X, LogOut } from "lucide-react";
const searchData = [{
  label: "INV-1025 — Muhammad Traders",
  page: "invoice",
  id: "sl1"
}, {
  label: "INV-1024 — Fresh Fish Market",
  page: "invoice",
  id: "sl2"
}, {
  label: "Muhammad Traders (Customer)",
  page: "customer-detail",
  id: "c1"
}, {
  label: "Al-Madina Foods (Customer)",
  page: "customer-detail",
  id: "c3"
}, {
  label: "Ali Seafood Supplier",
  page: "supplier-detail",
  id: "s1"
}, {
  label: "FB-1001 — Rohu Batch",
  page: "batch-detail",
  id: "b1"
}, {
  label: "FB-1002 — Surmai Batch",
  page: "batch-detail",
  id: "b2"
}, {
  label: "Freezer #03 (Warning)",
  page: "freezer-detail",
  id: "fz3"
}];
export default function Header() {
  const {
    lang,
    setLang,
    navigate,
    sidebarOpen,
    toggleSidebar,
    currentUser,
    logout
  } = useApp();
  const tr = t[lang];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const filtered = searchQuery.length > 1 ? searchData.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-white border-b" style={{
      borderColor: "var(--border)",
      zIndex: 40,
      position: "sticky",
      top: 0
    }}>
      {/* Sidebar toggle & Brand Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0" onClick={toggleSidebar}>
          {sidebarOpen ? <X size={18} className="text-slate-600" /> : <Menu size={18} className="text-slate-600" />}
        </button>
        <div className="flex items-center gap-2">
          {/* <img src="/logo.png" alt="Royalion Logo" className="h-7 w-auto object-contain max-h-7" /> */}
          <span className="font-bold text-slate-800 text-lg tracking-wide hidden sm:inline-block" style={{ fontFamily: "Outfit" }}>
            Royalion
          </span>
        </div>
      </div>

      {/* Search — hidden on mobile, shown on sm+ */}
      {/* <div className="relative flex-1 max-w-md hidden sm:block">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{
        borderColor: "var(--border)",
        background: "#f8fafc"
      }}>
          <Search size={15} className="text-slate-400 shrink-0" />
          <input className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400" placeholder={tr.search} value={searchQuery} onChange={e => {
          setSearchQuery(e.target.value);
          setSearchOpen(true);
        }} onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 200)} />
        </div>
        {searchOpen && filtered.length > 0 && <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border overflow-hidden z-50" style={{
        borderColor: "var(--border)"
      }}>
            {filtered.map((item, i) => <button key={i} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 border-b last:border-0 flex items-center gap-2" style={{
          borderColor: "var(--border)"
        }} onMouseDown={() => {
          navigate(item.page, item.id);
          setSearchQuery("");
        }}>
                <Search size={13} className="text-slate-400" />
                {item.label}
              </button>)}
          </div>}
      </div> */}

      {/* Mobile Search Icon */}
      {/* <button
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 sm:hidden"
        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
      >
        <Search size={17} className="text-slate-500" />
      </button> */}

      {/* Mobile Search Overlay */}
      {/* {mobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b p-2 z-50 sm:hidden" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", background: "#f8fafc" }}>
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
              placeholder={tr.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => setTimeout(() => { setMobileSearchOpen(false); setSearchQuery(""); }, 200)}
            />
          </div>
          {filtered.length > 0 && (
            <div className="mt-1 bg-white rounded-lg shadow-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {filtered.map((item, i) => (
                <button key={i} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 border-b last:border-0 flex items-center gap-2" style={{ borderColor: "var(--border)" }} onMouseDown={() => { navigate(item.page, item.id); setMobileSearchOpen(false); setSearchQuery(""); }}>
                  <Search size={13} className="text-slate-400" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )} */}

      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* Language switcher */}
        {/* <div className="hidden sm:flex items-center rounded-lg border overflow-hidden text-xs font-medium" style={{
          borderColor: "var(--border)"
        }}>
          <button className="px-3 py-1.5 transition-colors" style={{
            background: lang === "en" ? "var(--primary)" : "transparent",
            color: lang === "en" ? "white" : "var(--muted-foreground)"
          }} onClick={() => setLang("en")}>
            EN
          </button>
          <button className="px-3 py-1.5 transition-colors" style={{
            background: lang === "ur" ? "var(--primary)" : "transparent",
            color: lang === "ur" ? "white" : "var(--muted-foreground)"
          }} onClick={() => setLang("ur")}>
            اردو
          </button>
        </div> */}

        {/* Notifications - hidden on very small screens */}
        {/* <div className="hidden sm:block p-2 text-slate-400">
          <Bell size={18} />
        </div> */}

        {/* Logged in User Badge & Logout */}
        <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
          {/* Full badge on sm+, avatar-only on mobile */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs" style={{ background: "var(--accent)" }}>
              {(currentUser?.name || "A")[0]}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold text-slate-800">{currentUser?.name || "User"}</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{currentUser?.role || "Staff"}</span>
            </div>
          </div>
          {/* Mobile: just the avatar circle */}
          <div className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--accent)" }}>
            {(currentUser?.name || "A")[0]}
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
