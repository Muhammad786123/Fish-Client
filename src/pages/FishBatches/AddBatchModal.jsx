import { useState, useEffect } from "react";
import { useApp } from "../../store";
import { Modal, Field, Input, Select, Btn, fmt } from "../../components/common/ui";
import { Package, Calendar, Snowflake, Layers } from "lucide-react";

export const PACKAGING_TYPES = ["Carton", "Free Pack", "Bag", "Box", "Crate"];

export default function AddBatchModal({ open, onClose, defaultFishId, batch = null }) {
  const {
    fishTypes,
    suppliers,
    addBatch,
    updateBatch,
    showToast
  } = useApp();

  const isEdit = Boolean(batch);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    fishId: batch?.fishId || defaultFishId || fishTypes[0]?.id || "",
    supplierId: batch?.supplierId || suppliers[0]?.id || "",
    purchaseDate: batch?.purchaseDate || today,
    entryDate: batch?.entryDate || batch?.freezeDate || today,
    packagingType: batch?.packagingType || "Carton",
    packagingWeightKg: batch?.packagingWeightKg ? String(batch.packagingWeightKg) : "10",
    grade: batch?.grade || "16-20 pcs/kg",
    qty: batch?.originalQty ? String(batch.originalQty) : "",
    rate: batch?.purchaseRate ? String(batch.purchaseRate) : "",
    notes: batch?.notes || ""
  });

  useEffect(() => {
    if (batch) {
      setForm({
        fishId: batch.fishId || "",
        supplierId: batch.supplierId || "",
        purchaseDate: batch.purchaseDate || today,
        entryDate: batch.entryDate || batch.freezeDate || today,
        packagingType: batch.packagingType || "Carton",
        packagingWeightKg: String(batch.packagingWeightKg || 10),
        grade: batch.grade || "",
        qty: String(batch.originalQty || ""),
        rate: String(batch.purchaseRate || ""),
        notes: batch.notes || ""
      });
    } else {
      setForm({
        fishId: defaultFishId || fishTypes[0]?.id || "",
        supplierId: suppliers[0]?.id || "",
        purchaseDate: today,
        entryDate: today,
        packagingType: "Carton",
        packagingWeightKg: "10",
        grade: "16-20 pcs/kg",
        qty: "",
        rate: "",
        notes: ""
      });
    }
  }, [batch, defaultFishId, open]);

  const qty = parseFloat(form.qty) || 0;
  const rate = parseFloat(form.rate) || 0;
  const pkgWeight = parseFloat(form.packagingWeightKg) || 0;
  const derivedUnits = pkgWeight > 0 ? Math.floor(qty / pkgWeight) : 0;
  const totalCost = qty * rate;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!form.fishId) {
      showToast("Please select a fish type.", "error");
      return;
    }
    if (qty <= 0) {
      showToast("Please enter a valid quantity in KG.", "error");
      return;
    }
    if (rate <= 0) {
      showToast("Please enter a valid purchase rate.", "error");
      return;
    }
    if (pkgWeight <= 0) {
      showToast("Please enter a valid packaging weight (KG).", "error");
      return;
    }

    const fish = fishTypes.find((f) => f.id === form.fishId);
    const supplier = suppliers.find((s) => s.id === form.supplierId);

    if (isEdit) {
      const updated = {
        ...batch,
        fishId: form.fishId,
        fishName: fish?.name ?? batch.fishName,
        supplierId: form.supplierId,
        supplierName: supplier?.name ?? batch.supplierName,
        purchaseDate: form.purchaseDate || today,
        entryDate: form.entryDate || today,
        packagingType: form.packagingType,
        packagingWeightKg: pkgWeight,
        grade: form.grade.trim() || "Standard",
        originalQty: qty,
        purchaseRate: rate,
        remaining: Math.max(qty - (batch.sold || 0) - (batch.wastage || 0), 0)
      };
      updateBatch(updated);
      showToast(`Batch FB-${batch.id.slice(1).padStart(4, "0")} updated successfully!`, "success");
    } else {
      const newBatch = {
        id: `b${Date.now()}`,
        fishId: form.fishId,
        fishName: fish?.name ?? "Fish",
        supplierId: form.supplierId,
        supplierName: supplier?.name ?? "Supplier",
        purchaseDate: form.purchaseDate || today,
        entryDate: form.entryDate || today,
        packagingType: form.packagingType,
        packagingWeightKg: pkgWeight,
        grade: form.grade.trim() || "Standard",
        originalQty: qty,
        purchaseRate: rate,
        sold: 0,
        wastage: 0,
        remaining: qty
      };
      addBatch(newBatch);
      showToast(`Batch added successfully for ${newBatch.fishName} (${derivedUnits} ${newBatch.packagingType}s)!`, "success");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Fish Batch" : "Add Fish Batch"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Fish Type" required>
            <Select
              value={form.fishId}
              onChange={(e) => setForm((f) => ({ ...f, fishId: e.target.value }))}
            >
              {fishTypes.map((fish) => (
                <option key={fish.id} value={fish.id}>
                  {fish.name} ({fish.urduName})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Supplier" required>
            <Select
              value={form.supplierId}
              onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Size / Grade (e.g. 16-20 pcs/kg)" required>
            <Input
              type="text"
              placeholder="e.g. 16-20 pcs/kg, 10-15 pcs/kg, Large"
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            />
          </Field>

          <Field label="Purchase Date" required>
            <Input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
            />
          </Field>

          <Field label="Batch Entry Date" required>
            <Input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
            />
          </Field>

          <Field label="Packaging Type" required>
            <Select
              value={form.packagingType}
              onChange={(e) => setForm((f) => ({ ...f, packagingType: e.target.value }))}
            >
              {PACKAGING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Packaging Unit Weight (KG)" required>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 7, 10, 15"
              value={form.packagingWeightKg}
              onChange={(e) => setForm((f) => ({ ...f, packagingWeightKg: e.target.value }))}
            />
          </Field>

          <Field label="Total Quantity (KG)" required>
            <Input
              type="number"
              step="any"
              min="0.1"
              placeholder="e.g. 250"
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            />
          </Field>

          <Field label="Purchase Rate (PKR / KG)" required>
            <Input
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 650"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
          </Field>
        </div>

        {/* Live Summary Preview */}
        <div
          className="rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"
          style={{
            background: "#f8fafc",
            border: "1px solid var(--border)"
          }}
        >
          <div>
            <span className="text-slate-500 text-xs block">Derived Units:</span>
            <span className="font-bold mono text-emerald-700">
              {derivedUnits} {form.packagingType}s
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Packaging Spec:</span>
            <span className="font-semibold text-slate-700">
              {pkgWeight} KG / {form.packagingType}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Grading:</span>
            <span className="font-semibold text-slate-700">
              {form.grade || "None"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Total Batch Cost:</span>
            <span className="font-bold mono text-blue-900">
              {fmt(totalCost)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="accent" type="submit">
            {isEdit ? "Update Fish Batch" : "Add Fish Batch"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
