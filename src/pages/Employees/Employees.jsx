import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { t } from "../../translations";
import { PageHeader, SummaryCard, Badge, fmt, Btn, StatRow, TabBar, Modal, Field, Input, Select, EmptyState, Confirm } from "../../components/common/ui";
import { Calendar, DollarSign, Plus, UserCheck, CheckCircle2, XCircle, Clock, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { MAX_EMPLOYEE_CATEGORIES, MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from "../../constants/limits";

export const EMPLOYEE_CATEGORIES = [
  "All",
  "General Labour (Hall Labour)",
  "Store / Storage Staff (Store Labour)",
  "Plant Operator",
  "Teleoperator",
  "Management & Office Staff"
];

export function EmployeeModal({ open, onClose, employee = null }) {
  const { addEmployee, updateEmployee, showToast } = useApp();
  const isEdit = Boolean(employee);

  const [form, setForm] = useState({
    name: employee?.name || "",
    phone: employee?.phone || "",
    position: employee?.position || "",
    category: employee?.category || "General Labour (Hall Labour)",
    salary: employee?.salary ? String(employee.salary) : "",
    joiningDate: employee?.joiningDate || new Date().toISOString().slice(0, 10),
    status: employee?.status || "active"
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        phone: employee.phone || "",
        position: employee.position || "",
        category: employee.category || "General Labour (Hall Labour)",
        salary: String(employee.salary || ""),
        joiningDate: employee.joiningDate || new Date().toISOString().slice(0, 10),
        status: employee.status || "active"
      });
    } else {
      setForm({
        name: "",
        phone: "",
        position: "",
        category: "General Labour (Hall Labour)",
        salary: "",
        joiningDate: new Date().toISOString().slice(0, 10),
        status: "active"
      });
    }
  }, [employee, open]);

  const handleSubmit = () => {
    if (!form.name || !form.position) {
      showToast("Please provide name and position", "error");
      return;
    }

    const sal = parseFloat(form.salary) || 0;

    if (isEdit) {
      updateEmployee({
        ...employee,
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        phone: form.phone.trim().slice(0, MAX_PHONE_LENGTH) || "0300-0000000",
        position: form.position.trim().slice(0, MAX_NAME_LENGTH),
        category: form.category,
        joiningDate: form.joiningDate,
        salary: sal,
        status: form.status
      });
      showToast(`Employee "${form.name}" updated successfully!`, "success");
    } else {
      const newEmp = {
        id: `em${Math.floor(Math.random() * 9000 + 1000)}`,
        name: form.name.trim().slice(0, MAX_NAME_LENGTH),
        phone: form.phone.trim().slice(0, MAX_PHONE_LENGTH) || "0300-0000000",
        position: form.position.trim().slice(0, MAX_NAME_LENGTH),
        category: form.category,
        joiningDate: form.joiningDate,
        salary: sal,
        status: "active",
        salaryPaid: 0,
        salaryDue: sal,
      };
      addEmployee(newEmp);
      showToast(`Employee "${form.name}" added successfully!`, "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Employee" : "Add New Employee"} size="md">
      <div className="space-y-4">
        <Field label="Full Name" required>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mohammad Bilal" />
        </Field>

        <Field label="Category" required>
          <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {EMPLOYEE_CATEGORIES.filter(c => c !== "All").map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>

        <Field label="Position / Designation" required>
          <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="e.g. Dock Loader / Plant Tech" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number">
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0300-1234567" />
          </Field>
          <Field label="Monthly Base Salary (Rs.)">
            <Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Joining Date">
            <Input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
          </Field>
          {isEdit && (
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSubmit}>{isEdit ? "Update Employee" : "Save Employee"}</Btn>
      </div>
    </Modal>
  );
}

function MarkAttendanceModal({ open, onClose }) {
  const { employees, attendanceRecords, markAttendance, showToast } = useApp();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [catFilter, setCatFilter] = useState("All");

  const activeEmps = employees.filter(e => e.status === "active" && (catFilter === "All" || e.category === catFilter));

  const [attendanceMap, setAttendanceMap] = useState({});

  const handleDateChange = (newDate) => {
    setDate(newDate);
    const map = {};
    activeEmps.forEach(e => {
      const existing = attendanceRecords.find(a => a.employeeId === e.id && a.date === newDate);
      map[e.id] = existing ? existing.status : "Present";
    });
    setAttendanceMap(map);
  };

  const handleStatusChange = (empId, status) => {
    setAttendanceMap(prev => ({ ...prev, [empId]: status }));
  };

  const handleSave = () => {
    const records = Object.entries(attendanceMap).map(([employeeId, status]) => ({
      employeeId,
      date,
      status
    }));
    markAttendance(records);
    showToast(`Attendance for ${records.length} employees saved for ${date}!`, "success");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Mark Daily Attendance" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Attendance Date:</span>
            <input
              type="date"
              className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 outline-none"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Category:</span>
            <select
              className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 outline-none"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              {EMPLOYEE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y border rounded-xl">
          {activeEmps.map(emp => {
            const currentStatus = attendanceMap[emp.id] || "Present";
            return (
              <div key={emp.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-800">{emp.name}</div>
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-blue-700">{emp.category}</span> • {emp.position}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { label: "P", status: "Present", color: "bg-emerald-600 text-white", text: "Present" },
                    { label: "A", status: "Absent", color: "bg-rose-600 text-white", text: "Absent" },
                    { label: "HD", status: "Half Day", color: "bg-amber-500 text-white", text: "Half Day" },
                    { label: "L", status: "Leave", color: "bg-indigo-600 text-white", text: "Leave" },
                  ].map(btn => (
                    <button
                      key={btn.status}
                      type="button"
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        currentStatus === btn.status
                          ? `${btn.color} border-transparent shadow-sm scale-105`
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      onClick={() => handleStatusChange(emp.id, btn.status)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSave}>Save Attendance</Btn>
      </div>
    </Modal>
  );
}

function RecordSalaryModal({ open, onClose, defaultEmployeeId }) {
  const { employees, addSalaryRecord, showToast } = useApp();
  const [empId, setEmpId] = useState(defaultEmployeeId || employees[0]?.id || "");
  const [month, setMonth] = useState("2026-08");
  const [advances, setAdvances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [method, setMethod] = useState("Bank");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));

  const emp = employees.find(e => e.id === empId) || employees[0];
  const baseSalary = emp?.salary || 0;
  const adv = parseFloat(advances) || 0;
  const ded = parseFloat(deductions) || 0;
  const netPaid = Math.max(baseSalary - adv - ded, 0);

  const handleSubmit = () => {
    if (!emp) return;
    const record = {
      id: Math.random().toString(36).slice(2),
      employeeId: emp.id,
      employeeName: emp.name,
      category: emp.category || "General Labour",
      month,
      baseSalary,
      advances: adv,
      deductions: ded,
      netPaid,
      paidDate,
      paymentMethod: method,
    };
    addSalaryRecord(record);
    showToast(`Salary payout of ${fmt(netPaid)} processed for ${emp.name}!`, "success");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Process Salary Payout" size="md">
      <div className="space-y-4">
        <Field label="Employee" required>
          <Select value={empId} onChange={e => setEmpId(e.target.value)}>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.category} — {fmt(e.salary)})
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Salary Month" required>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </Field>
          <Field label="Payment Date">
            <Input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="text-slate-500 font-semibold">Base Salary</div>
            <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{fmt(baseSalary)}</div>
          </div>
          <div>
            <div className="text-slate-500 font-semibold">Advances</div>
            <Input type="number" className="mt-0.5 text-xs py-1" value={advances} onChange={e => setAdvances(e.target.value)} />
          </div>
          <div>
            <div className="text-slate-500 font-semibold">Deductions</div>
            <Input type="number" className="mt-0.5 text-xs py-1" value={deductions} onChange={e => setDeductions(e.target.value)} />
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-800">Net Payable Amount</div>
            <div className="text-xs text-emerald-600">Base − Advances − Deductions</div>
          </div>
          <div className="text-xl font-bold mono text-emerald-700">{fmt(netPaid)}</div>
        </div>

        <Field label="Payment Method">
          <Select value={method} onChange={e => setMethod(e.target.value)}>
            <option>Bank</option>
            <option>Cash</option>
            <option>Online</option>
          </Select>
        </Field>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" onClick={handleSubmit}>Process Payout</Btn>
      </div>
    </Modal>
  );
}

export function EmployeeDetail() {
  const { selectedId, employees, attendanceRecords, salaryRecords, deleteEmployee, navigate, showToast } = useApp();
  const emp = employees.find(e => e.id === selectedId) ?? employees[0];
  const [tab, setTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);

  if (!emp) return null;

  const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id);
  const empSalaries = salaryRecords.filter(s => s.employeeId === emp.id);

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteEmployee(emp.id);
    showToast(`Employee "${emp.name}" deleted successfully.`, "info");
    navigate("employees");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={emp.name}
        subtitle={`${emp.category || "Staff"} • ${emp.position}`}
        back={() => navigate("employees")}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditModalOpen(true)}>Edit</Btn>
            <Btn variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Btn>
            <Btn variant="accent" size="sm" icon={<DollarSign size={15} />} onClick={() => setSalaryModalOpen(true)}>
              Record Salary
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold text-slate-500">MONTHLY SALARY</div>
          <div className="text-xl font-bold mono text-slate-800 mt-1">{fmt(emp.salary)}</div>
          <div className="text-xs text-slate-400 mt-1">Base Contract Rate</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold text-slate-500">TOTAL SALARY PAID</div>
          <div className="text-xl font-bold mono text-emerald-600 mt-1">{fmt(emp.salaryPaid)}</div>
          <div className="text-xs text-slate-400 mt-1">{empSalaries.length} Payout Entries</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs font-semibold text-slate-500">SALARY DUE</div>
          <div className={`text-xl font-bold mono mt-1 ${emp.salaryDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {fmt(emp.salaryDue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending Balance</div>
        </div>
      </div>

      <SummaryCard>
        <TabBar tabs={["Overview", "Attendance History", "Salary Records", "Activity Log"]} active={tab} onChange={setTab} />

        {tab === 0 && (
          <div className="max-w-md space-y-2 py-4">
            <StatRow label="Full Name" value={emp.name} />
            <StatRow label="Category" value={emp.category || "General Labour"} />
            <StatRow label="Position" value={emp.position} />
            <StatRow label="Phone" value={emp.phone} />
            <StatRow label="Joining Date" value={emp.joiningDate} />
            <StatRow label="Status" value={emp.status} />
          </div>
        )}

        {tab === 1 && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b pb-2">
              <span>Attendance Log ({empAttendance.length} records)</span>
              <span>Recent Activity</span>
            </div>
            {empAttendance.length > 0 ? (
              <div className="space-y-2">
                {empAttendance.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border text-xs">
                    <span className="font-semibold text-slate-700">{att.date}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        att.status === "Present"
                          ? "bg-emerald-100 text-emerald-800"
                          : att.status === "Absent"
                          ? "bg-rose-100 text-rose-800"
                          : att.status === "Half Day"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">No attendance logged yet for this employee.</div>
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Salary Payout History</h4>
              <Btn variant="secondary" size="sm" onClick={() => setSalaryModalOpen(true)}>+ New Payout</Btn>
            </div>
            {empSalaries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Base</th>
                      <th>Advances</th>
                      <th>Deductions</th>
                      <th>Net Paid</th>
                      <th>Date</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empSalaries.map(s => (
                      <tr key={s.id}>
                        <td className="font-bold">{s.month}</td>
                        <td className="mono">{fmt(s.baseSalary)}</td>
                        <td className="mono text-amber-600">-{fmt(s.advances)}</td>
                        <td className="mono text-rose-600">-{fmt(s.deductions)}</td>
                        <td className="mono font-bold text-emerald-700">{fmt(s.netPaid)}</td>
                        <td className="text-slate-500">{s.paidDate}</td>
                        <td>{s.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">No salary records found.</div>
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-3 py-4">
            {["Completed shift at cold storage harbour dock", "Recorded stock intake - FB-1002", "Marked Present for daily attendance"].map((act, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
                <span className="text-slate-600">{act}</span>
                <span className="ml-auto text-xs text-slate-400">Recently</span>
              </div>
            ))}
          </div>
        )}
      </SummaryCard>

      {editModalOpen && (
        <EmployeeModal
          open={editModalOpen}
          employee={emp}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <RecordSalaryModal open={salaryModalOpen} onClose={() => setSalaryModalOpen(false)} defaultEmployeeId={emp.id} />

      <Confirm
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete employee "${emp.name}"?`}
        danger
      />
    </div>
  );
}

export default function Employees() {
  const { lang, employees, deleteEmployee, navigate, showToast } = useApp();
  const tr = t[lang];

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attModalOpen, setAttModalOpen] = useState(false);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);

  const filteredEmployees = categoryFilter === "All"
    ? employees
    : employees.filter(e => (e.category || "General Labour") === categoryFilter);

  const categoryCounts = {};
  EMPLOYEE_CATEGORIES.forEach(c => {
    if (c === "All") {
      categoryCounts["All"] = employees.length;
    } else {
      categoryCounts[c] = employees.filter(e => (e.category || "General Labour") === c).length;
    }
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setModalKey(k => k + 1);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (emp, e) => {
    e.stopPropagation();
    setEditTarget(emp);
    setAddModalOpen(true);
  };

  const handleOpenDelete = (emp, e) => {
    e.stopPropagation();
    setDeleteTarget(emp);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteEmployee(deleteTarget.id);
    showToast(`Employee "${deleteTarget.name}" deleted successfully.`, "info");
    setDeleteTarget(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" dir={lang === "ur" ? "rtl" : "ltr"}>
      <PageHeader
        title={tr.employees}
        subtitle={`${employees.filter(e => e.status === "active").length} active employees across ${EMPLOYEE_CATEGORIES.length - 1} categories`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Btn variant="secondary" icon={<UserCheck size={15} />} onClick={() => setAttModalOpen(true)}>
              Mark Attendance
            </Btn>
            <Btn variant="secondary" icon={<DollarSign size={15} />} onClick={() => setSalaryModalOpen(true)}>
              Process Salary
            </Btn>
            <Btn variant="accent" icon={<Plus size={15} />} onClick={handleOpenAdd}>
              Add Employee
            </Btn>
          </div>
        }
      />

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {EMPLOYEE_CATEGORIES.map(cat => {
          const count = categoryCounts[cat] || 0;
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setCategoryFilter(cat)}
            >
              <span>{cat}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <SummaryCard>
        {filteredEmployees.length === 0 ? (
          <EmptyState
            message="No Employees Found"
            sub="No employees exist in this category yet. Click 'Add Employee' to register staff."
            action="Add Employee"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Joining Date</th>
                  <th>Monthly Base</th>
                  <th>Total Paid</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(e => (
                  <tr key={e.id} onClick={() => navigate("employee-detail", e.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="font-semibold" style={{ color: "var(--primary)" }}>
                      {e.name}
                    </td>
                    <td>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          (e.category && (e.category.includes("Hall") || e.category === "General Labour"))
                            ? "bg-amber-100 text-amber-800"
                            : (e.category && (e.category.includes("Store") || e.category === "Store Staff"))
                            ? "bg-cyan-100 text-cyan-800"
                            : e.category === "Plant Operator"
                            ? "bg-blue-100 text-blue-800"
                            : e.category === "Teleoperator"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {e.category || "General Labour (Hall Labour)"}
                      </span>
                    </td>
                    <td className="text-slate-700">{e.position}</td>
                    <td className="mono text-slate-500">{e.phone}</td>
                    <td className="text-slate-500">{e.joiningDate}</td>
                    <td className="mono font-semibold">{fmt(e.salary)}</td>
                    <td className="mono text-emerald-700 font-medium">{fmt(e.salaryPaid)}</td>
                    <td>
                      <Badge status={e.status} />
                    </td>
                    <td className="text-right" onClick={evt => evt.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={evt => handleOpenEdit(e, evt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          title="Edit Employee"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={evt => handleOpenDelete(e, evt)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SummaryCard>

      {addModalOpen && (
        <EmployeeModal
          key={editTarget ? `edit-${editTarget.id}` : `new-${modalKey}`}
          open={addModalOpen}
          employee={editTarget}
          onClose={() => {
            setAddModalOpen(false);
            setEditTarget(null);
          }}
        />
      )}

      <MarkAttendanceModal open={attModalOpen} onClose={() => setAttModalOpen(false)} />
      <RecordSalaryModal open={salaryModalOpen} onClose={() => setSalaryModalOpen(false)} />

      <Confirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete employee "${deleteTarget?.name}"?`}
        danger
      />
    </div>
  );
}
