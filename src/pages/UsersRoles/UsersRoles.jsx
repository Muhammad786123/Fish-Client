import { useState, useEffect, useCallback } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, Badge, TabBar, Btn, Modal, Confirm, Field, Input, Select } from "../../components/common/ui";
import { Shield, CheckCircle, Download, Upload, Database, Edit2, UserX, UserCheck, Plus, Key, Loader2, RefreshCw, Clock, ShieldAlert, HardDrive } from "lucide-react";
import { ROLES, SUPER_ADMIN, MANAGER, SALES_PERSON, FREEZER_OPERATOR } from "../../constants/roles";
import { ROLE_PERMISSIONS } from "../../constants/permissions";
import { sanitizeErrorMessage } from "../../utils/errorMessages";

const ROLE_LABELS = {
  [SUPER_ADMIN]: "Super Admin",
  [MANAGER]: "Manager",
  [SALES_PERSON]: "Sales Person",
  [FREEZER_OPERATOR]: "Store / Freezer Operator",
};

const PAGE_LABELS = {
  dashboard: "Dashboard Overview",
  sales: "Sales Transactions",
  "sale-detail": "Sale Order Details",
  "new-sale": "Create Sale Invoice",
  invoice: "Invoice Printing",
  purchases: "Purchase Orders",
  "purchase-detail": "Purchase Order Details",
  "new-purchase": "Create Purchase Order",
  "cold-store": "Cold Store Inventory",
  store: "Stock Management",
  stock: "Stock Overview",
  "fish-batches": "Fish Batches & Lots",
  "fish-detail": "Fish Type Details",
  "batch-detail": "Batch Details",
  customers: "Customer Accounts",
  "customer-detail": "Customer Details",
  suppliers: "Supplier Accounts",
  "supplier-detail": "Supplier Details",
  payments: "Payment Vouchers",
  expenses: "Expense Management",
  wastage: "Wastage Records",
  "daily-packing": "Daily Packing Records",
  employees: "Employee HR & Attendance",
  "employee-detail": "Employee Profile",
  accounts: "General Ledger",
  "profit-loss": "Profit & Loss",
  reports: "System Reports",
  "users-roles": "Users & System Permissions",
};

export default function UsersRoles() {
  const {
    lang,
    users,
    currentUser,
    addUser,
    updateUser,
    toggleUserStatus,
    changePassword,
    exportData,
    importData,
    runManualBackup,
    getBackupLogs,
    downloadLocalBackup,
    getDeviceId,
    showToast,
  } = useApp();
  const tr = t[lang];
  const [tab, setTab] = useState(0);

  // Backup System State
  const [backupLogs, setBackupLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const currentDeviceId = getDeviceId ? getDeviceId() : "";

  const handleDownloadLocal = async (logId) => {
    if (!downloadLocalBackup) return;
    const ok = await downloadLocalBackup(logId);
    if (ok) {
      showToast("Backup JSON file downloaded successfully!", "success");
    } else {
      showToast("Backup file is not present in this browser's local memory. (Created on another device).", "error");
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!getBackupLogs) return;
    setIsLoadingLogs(true);
    try {
      const logs = await getBackupLogs();
      setBackupLogs(logs || []);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to load backup logs:", err);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [getBackupLogs]);

  useEffect(() => {
    if (tab === 2) {
      fetchLogs();
    }
  }, [tab, fetchLogs]);

  // User Add/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: MANAGER,
    status: "active",
  });

  // Change Password Modal State
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [changePwData, setChangePwData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Confirm Status Toggle Dialog State
  const [confirmUser, setConfirmUser] = useState(null);

  // Backup/Export State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role: MANAGER,
      status: "active",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      role: user.role || MANAGER,
      status: user.status || "active",
    });
    setModalOpen(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      showToast("Name and Username are required.", "error");
      return;
    }

    if (!editingUser && (!formData.password || formData.password.trim().length < 8)) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    if (editingUser && formData.password && formData.password.trim().length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }

    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, ...formData });
        showToast(`User "${formData.name}" updated successfully!`, "success");
      } else {
        await addUser(formData);
        showToast(`User "${formData.name}" added successfully!`, "success");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(sanitizeErrorMessage(err, "Failed to save user."), "error");
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!changePwData.currentPassword) {
      showToast("Please enter your current password.", "error");
      return;
    }
    if (!changePwData.newPassword || changePwData.newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", "error");
      return;
    }
    if (changePwData.newPassword !== changePwData.confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }

    try {
      await changePassword(currentUser.id, changePwData.currentPassword, changePwData.newPassword);
      showToast("Your password has been changed successfully!", "success");
      setChangePwModalOpen(false);
      setChangePwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(sanitizeErrorMessage(err, "Failed to change password."), "error");
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmUser) return;
    try {
      await toggleUserStatus(confirmUser.id);
      const actionText = confirmUser.status === "active" ? "disabled" : "enabled";
      showToast(`User "${confirmUser.name}" has been ${actionText}.`, "info");
    } catch (err) {
      showToast("Failed to change user status.", "error");
    } finally {
      setConfirmUser(null);
    }
  };

  const handleTriggerManualBackup = async () => {
    if (!runManualBackup) return;
    setIsBackingUp(true);
    try {
      const newLog = await runManualBackup();
      showToast("Manual backup completed successfully!", "success");
      await fetchLogs();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Manual backup error:", err);
      }
      showToast(sanitizeErrorMessage(err, "Failed to create backup. Please try again."), "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData();
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error(e);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonContent = evt.target.result;
        await importData(jsonContent);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(err);
        }
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const isSuperAdmin = currentUser?.role === SUPER_ADMIN;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBackup = backupLogs.find((l) => l.date === todayStr && l.status === "success");
  const lastBackup = backupLogs[0];

  return (
    <div className="p-3 sm:p-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.usersRoles}
        subtitle="Manage system users, access control, and database backups"
        actions={
          <div className="flex gap-2">
            {currentUser && (
              <Btn variant="secondary" onClick={() => setChangePwModalOpen(true)}>
                <Key size={14} className="mr-1.5" /> Change My Password
              </Btn>
            )}
            <Btn variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download size={14} className="mr-1.5" /> Export Data
            </Btn>
            <Btn variant="accent" onClick={handleOpenAdd}>
              <Plus size={16} className="mr-1" /> Add User
            </Btn>
          </div>
        }
      />

      <SummaryCard>
        <TabBar tabs={["Users", "Roles & Permissions", "Data Backup & Recovery"]} active={tab} onChange={setTab} />

        {/* Tab 0: Users Management */}
        {tab === 0 && (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleLabel = ROLE_LABELS[u.role] || u.role;
                  const isInactive = u.status === "inactive" || u.status === "disabled";
                  return (
                    <tr key={u.id} className={isInactive ? "opacity-60 bg-slate-50" : ""}>
                      <td className="font-semibold text-slate-800">{u.name}</td>
                      <td className="mono text-slate-500">{u.username}</td>
                      <td className="text-slate-500">{u.email || "—"}</td>
                      <td>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                          style={{
                            background: u.role === SUPER_ADMIN ? "#eff6ff" : "#f0fdf4",
                            color: u.role === SUPER_ADMIN ? "#1d4ed8" : "#15803d",
                            borderColor: u.role === SUPER_ADMIN ? "#bfdbfe" : "#bbf7d0",
                          }}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td>
                        <Badge status={u.status || "active"} />
                      </td>
                      <td className="text-slate-500 text-xs">{u.lastLogin || "Never"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className={`p-1 rounded transition-colors ${
                              isInactive
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            onClick={() => setConfirmUser(u)}
                            title={isInactive ? "Enable User" : "Disable User"}
                          >
                            {isInactive ? <UserCheck size={15} /> : <UserX size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 1: Real Roles & Permissions */}
        {tab === 1 && (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 mb-2">
              System access permissions defined in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">src/constants/permissions.js</code>.
            </p>
            {Object.keys(ROLES).map((roleKey) => {
              const roleConst = ROLES[roleKey];
              const roleTitle = ROLE_LABELS[roleConst] || roleConst;
              const permissions = ROLE_PERMISSIONS[roleConst] || [];
              const isFullAccess = permissions.includes("*");

              return (
                <div key={roleConst} className="rounded-xl border bg-white overflow-hidden shadow-xs border-slate-200">
                  <div className="px-5 py-3.5 flex items-center justify-between border-b bg-slate-50/80 border-slate-200">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-slate-700" />
                      <div>
                        <span className="font-bold text-slate-900 text-base">{roleTitle}</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">({roleConst})</span>
                      </div>
                    </div>
                    {isFullAccess ? (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Full Access (All Modules)
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        {permissions.length} Modules Allowed
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {isFullAccess ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-center gap-2">
                        <CheckCircle size={16} />
                        Super Admin has unrestricted read/write permission to every module and settings panel in the application.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {permissions.map((pageKey) => {
                          const label = PAGE_LABELS[pageKey] || pageKey;
                          return (
                            <div
                              key={pageKey}
                              className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                            >
                              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                              <span className="font-semibold">{label}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-auto">({pageKey})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Data Backup & Recovery */}
        {tab === 2 && (
          <div className="space-y-6">
            {!isSuperAdmin ? (
              <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-4">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-bold text-base mb-1">Super Admin Access Required</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Automated Cloud Data Backups and system recovery logs are restricted to Super Admin accounts only. Log in as a Super Admin to manage daily automated backups or trigger on-demand database snapshots.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Backup Status Overview Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                        <HardDrive size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg" style={{ fontFamily: "Outfit" }}>
                            Automated Daily Backup Status
                          </h3>
                          {todayBackup ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Completed Today
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Pending Today's Backup
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Backups automatically run once per day when a Super Admin logs in, retaining daily snapshots for the past 30 days.
                        </p>
                      </div>
                    </div>

                    <Btn
                      variant="accent"
                      onClick={handleTriggerManualBackup}
                      disabled={isBackingUp}
                    >
                      {isBackingUp ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-1.5" />
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={15} className="mr-1.5" />
                          Backup Now
                        </>
                      )}
                    </Btn>
                  </div>

                  {/* Stat Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[11px] mb-0.5">Today's Date</span>
                      <span className="font-bold text-slate-800 text-sm mono">{todayStr}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[11px] mb-0.5">Last Successful Backup</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {lastBackup ? lastBackup.timestamp.slice(0, 16).replace("T", " ") : "No backups recorded yet"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block text-[11px] mb-0.5">Retention Policy</span>
                      <span className="font-bold text-slate-800 text-sm">Keep last 30 daily backups</span>
                    </div>
                  </div>
                </div>

                {/* Backup History Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Clock size={16} className="text-slate-500" />
                      <span>Backup History Logs</span>
                    </h4>
                    <button
                      onClick={fetchLogs}
                      disabled={isLoadingLogs}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={isLoadingLogs ? "animate-spin" : ""} />
                      <span>Refresh Logs</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="data-table w-full text-xs">
                      <thead>
                        <tr>
                          <th>Backup Date</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                          <th>Total Records</th>
                          <th>File Size</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingLogs ? (
                          <tr>
                            <td colSpan="6" className="text-center py-6 text-slate-400">
                              <Loader2 size={20} className="animate-spin mx-auto mb-1" />
                              Loading backup history...
                            </td>
                          </tr>
                        ) : backupLogs.length > 0 ? (
                          backupLogs.map((log) => {
                            const isLocalAvailable = !log.deviceId || log.deviceId === currentDeviceId;
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/80">
                                <td className="font-bold text-slate-800 mono">{log.date}</td>
                                <td className="text-slate-500 text-xs">
                                  {log.timestamp ? log.timestamp.slice(0, 19).replace("T", " ") : "—"}
                                </td>
                                <td>
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Success
                                  </span>
                                </td>
                                <td className="font-semibold text-slate-700">
                                  {(log.totalRecords || 0).toLocaleString()} items
                                </td>
                                <td className="text-slate-500 mono">{log.fileSize || "—"}</td>
                                <td className="text-right">
                                  {isLocalAvailable ? (
                                    <button
                                      onClick={() => handleDownloadLocal(log.id)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                                      title="Download JSON backup file from local Dexie database"
                                    >
                                      <Download size={13} />
                                      <span>Download</span>
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-medium text-[11px] border border-slate-200 cursor-not-allowed"
                                      title="This backup was generated on another device/browser and is stored in that device's local memory."
                                    >
                                      <HardDrive size={11} className="text-slate-400" />
                                      <span>Other Device</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-400 italic">
                              No backup history recorded yet. Click "Backup Now" above to generate your first backup.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manual Local Export & Import Utility */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                    Additional Export & Migration Utilities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 font-bold text-slate-800 text-xs">
                          <Download size={15} className="text-teal-600" />
                          <span>Download Instant Unfiltered Backup (JSON)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Generates a local browser file download of all active collections instantly.
                        </p>
                      </div>
                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Download size={14} />
                        <span>Export All Data</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 font-bold text-slate-800 text-xs">
                          <Upload size={15} className="text-blue-600" />
                          <span>Restore Database from File</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Restore system tables from a previously exported JSON backup file.
                        </p>
                      </div>
                      <label className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                        <Upload size={14} />
                        <span>Import Backup File</span>
                        <input type="file" accept=".json" onChange={handleFileImport} className="hidden" disabled={isImporting} />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SummaryCard>

      {/* Add / Edit User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Edit User" : "Add New User"} size="md">
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <Field label="Full Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tariq Mahmood"
              required
            />
          </Field>

          <Field label="Username" required>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. tariq_mgr"
              required
            />
          </Field>

          <Field label="Email Address">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. tariq@fisherp.com"
            />
          </Field>

          <Field label="Password" required={!editingUser}>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 8 characters"}
              required={!editingUser}
            />
            <p className="text-[11px] text-slate-500 mt-1">Minimum 8 characters required.</p>
          </Field>

          <Field label="System Role" required>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {Object.keys(ROLES).map((roleKey) => {
                const val = ROLES[roleKey];
                return (
                  <option key={val} value={val}>
                    {ROLE_LABELS[val] || val}
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field label="Account Status" required>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive / Disabled</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Btn variant="secondary" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Btn>
            <Btn variant="accent" type="submit">
              {editingUser ? "Update User" : "Create User"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={changePwModalOpen} onClose={() => setChangePwModalOpen(false)} title="Change My Password" size="md">
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          <Field label="Current Password" required>
            <Input
              type="password"
              value={changePwData.currentPassword}
              onChange={(e) => setChangePwData({ ...changePwData, currentPassword: e.target.value })}
              placeholder="Enter current password"
              required
            />
          </Field>

          <Field label="New Password" required>
            <Input
              type="password"
              value={changePwData.newPassword}
              onChange={(e) => setChangePwData({ ...changePwData, newPassword: e.target.value })}
              placeholder="Minimum 8 characters"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">Must be at least 8 characters long.</p>
          </Field>

          <Field label="Confirm New Password" required>
            <Input
              type="password"
              value={changePwData.confirmPassword}
              onChange={(e) => setChangePwData({ ...changePwData, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
              required
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Btn variant="secondary" onClick={() => setChangePwModalOpen(false)} type="button">
              Cancel
            </Btn>
            <Btn variant="accent" type="submit">
              Update Password
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Confirm Disable / Enable User Dialog */}
      <Confirm
        open={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleConfirmToggleStatus}
        title={confirmUser?.status === "active" ? "Disable User Account?" : "Enable User Account?"}
        message={`Are you sure you want to ${
          confirmUser?.status === "active" ? "disable" : "enable"
        } user "${confirmUser?.name}" (${confirmUser?.username})? ${
          confirmUser?.status === "active" ? "They will not be able to log in to the system until re-enabled." : ""
        }`}
        danger={confirmUser?.status === "active"}
      />
    </div>
  );
}
