import { AppProvider, useApp } from "./store";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { ToastContainer } from "./components/common/ui";
import { ShieldAlert, Loader2 } from "lucide-react";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sales from "./pages/Sales/Sales";
import SaleDetail from "./pages/Sales/SaleDetail";
import Invoice from "./pages/Sales/Invoice";
import Purchases from "./pages/Purchases/Purchases";
import PurchaseDetail from "./pages/Purchases/PurchaseDetail";
import BatchDetail from "./pages/FishBatches/BatchDetail";
import ColdStore from "./pages/ColdStore/ColdStore";
import FishBatches from "./pages/FishBatches/FishBatches";
import FishDetail from "./pages/FishBatches/FishDetail";
import Customers from "./pages/Customers/Customers";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import Suppliers, { SupplierDetail } from "./pages/Suppliers/Suppliers";
import Payments from "./pages/Payments/Payments";
import Expenses from "./pages/Expenses/Expenses";
import Wastage from "./pages/Wastage/Wastage";
import DailyPacking from "./pages/DailyPacking/DailyPacking";
import Employees, { EmployeeDetail } from "./pages/Employees/Employees";
import Accounts from "./pages/Accounts/Accounts";
import ProfitLoss from "./pages/ProfitLoss/ProfitLoss";
import Reports from "./pages/Reports/Reports";
import UsersRoles from "./pages/UsersRoles/UsersRoles";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";

function PageRouter() {
  const { page, canAccess, currentUser, authStatus, navigate } = useApp();

  // Do not evaluate permissions or route unless auth status is confirmed authenticated
  if (authStatus !== "authenticated" || !currentUser) {
    return null;
  }

  if (canAccess && !canAccess(page)) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Outfit" }}>
          Access Restricted
        </h2>
        <p className="text-slate-500 max-w-md mt-2 mb-6 text-sm">
          You are logged in as <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role}). Your account does not have permission to view the <span className="font-mono font-semibold text-slate-700">{page}</span> module.
        </p>
        <button
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow"
          onClick={() => navigate("dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "sales":
      return <Sales />;
    case "sale-detail":
      return <SaleDetail />;
    case "new-sale":
      return <Sales />;
    case "invoice":
      return <Invoice />;
    case "purchases":
      return <Purchases />;
    case "purchase-detail":
      return <PurchaseDetail />;
    case "new-purchase":
      return <Purchases />;
    case "batch-detail":
      return <BatchDetail />;
    case "stock":
    case "cold-store":
    case "store":
      return <ColdStore />;
    case "fish-batches":
      return <FishBatches />;
    case "fish-detail":
      return <FishDetail />;
    case "customers":
      return <Customers />;
    case "customer-detail":
      return <CustomerDetail />;
    case "suppliers":
      return <Suppliers />;
    case "supplier-detail":
      return <SupplierDetail />;
    case "payments":
      return <Payments />;
    case "expenses":
      return <Expenses />;
    case "wastage":
      return <Wastage />;
    case "daily-packing":
      return <DailyPacking />;
    case "employees":
      return <Employees />;
    case "employee-detail":
      return <EmployeeDetail />;
    case "accounts":
      return <Accounts />;
    case "profit-loss":
      return <ProfitLoss />;
    case "reports":
      return <Reports />;
    case "users-roles":
      return <UsersRoles />;
    default:
      return <Dashboard />;
  }
}

function AppShell() {
  const {
    sidebarOpen,
    toasts,
    lang,
    authStatus,
    toggleSidebar,
    error,
  } = useApp();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">System Error</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-sm transition-colors"
        >
          Retry Reloading
        </button>
      </div>
    );
  }

  // 1. Still verifying session -> Render Centered Loading Screen ONLY
  if (authStatus === "checking") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <img src="/logo.png" alt="Royalion ERP" className="w-52 h-16 object-contain" />
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium">
            <Loader2 size={18} className="animate-spin" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Confirmed Unauthenticated -> Render Login Screen ONLY
  if (authStatus === "unauthenticated") {
    return (
      <>
        <Login />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Desktop Sidebar — permanent, collapses to zero width */}
      <div className="hidden lg:flex flex-col transition-all duration-300 overflow-hidden shrink-0" style={{
        width: sidebarOpen ? 240 : 0,
      }}>
        {sidebarOpen && <Sidebar />}
      </div>

      {/* Mobile/Tablet sidebar — off-canvas drawer with backdrop */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={toggleSidebar}
          />
          {/* Drawer */}
          <div className="relative w-60 h-full flex flex-col" style={{ background: "var(--primary)" }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0" dir={lang === "ur" ? "rtl" : "ltr"}>
          <div className="flex-1">
            <PageRouter />
          </div>
          <Footer />
        </main>
      </div>

      <BottomNav />
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
