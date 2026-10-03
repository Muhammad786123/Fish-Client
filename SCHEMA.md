# Fish ERP ("Royal N Trading System") — Canonical Database Schema

This is the single source of truth for the app's data model. It exists because two real bugs (Dashboard reading from a dead `batches` collection, and a crash from a deleted `ShipmentSubSection` component) both came from the same root cause: parts of the app drifting out of sync with the *actual* current schema after a feature was removed. Whenever the schema changes, **update this file in the same change** — don't let it go stale again.

Storage: Dexie/IndexedDB locally (`src/db/dexieDb.js`), migrating to Firebase Firestore (collection names match table names below 1:1).

---

## ✅ ACTIVE Collections

### `customers`
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | required |
| phone | string | |
| address | string | |
| openingBalance | number | |
| totalSales | number | **derived** — recomputed by `customerService.recalculateCustomerBalance()`, do not hand-edit |
| paid | number | **derived** — same as above |
| due | number | **derived** — this is "Customer Receivable." Positive = customer owes us. Negative = we owe customer (overpaid). |
| lastPurchase | string (date) | |
| status | "active" \| "inactive" | |
| createdAt | string (date) | |

### `suppliers`
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | required |
| supplierType | "Fish" \| "Ice" \| "Other" | |
| phone, address | string | |
| openingBalance | number | |
| totalPurchases | number | **derived** |
| paid | number | **derived** |
| payable | number | **derived** — this is "Supplier Payable." Positive = we owe supplier. Negative = supplier owes us. |
| lastPurchase | string (date) | |
| status | "active" \| "inactive" | |
| createdAt | string (date) | |
| ~~shipments / container installment tracking~~ | — | **REMOVED.** Supplier payments are a simple weekly running balance only — see "Deprecated" section below. |

### `fishTypes`
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | required — also used as a fallback match key against `sale.fishName`/`purchase.fishName` when `fishId` isn't set |
| code | string | |
| category | string | e.g. "Freshwater" |
| unit | string | default "kg" |
| purchasePriceKg, sellingPriceKg | number | |
| initialStock / openingStock | number | starting stock before any transactions |
| totalPurchased | number | **derived** |
| totalSold | number | **derived** |
| totalWastage | number | **derived** |
| currentStock | number | **derived** — `max(0, initialStock + totalPurchased − totalSold − totalWastage)`. **THIS is the single source of truth for "how much stock do we have" everywhere in the app — Dashboard, Current Stock page, anywhere else.** Never read stock from `batches`. |
| grade | string | optional, free text (e.g. "16-20 pcs/kg") |
| status | "active" \| "inactive" | |

### `sales`
| Field | Type | Notes |
|---|---|---|
| id | string | |
| date | string (date) | **user-selectable**, not auto-set to today |
| invoiceNo | string | |
| customerId | string | FK → customers.id |
| fishId | string | FK → fishTypes.id (falls back to name-match if absent — prefer always setting this) |
| fishName | string | |
| qtyKg | number | |
| grandTotal | number | |
| paid | number | |
| due | number | |
| paymentMethod | "Cash" \| "Bank" | drives cash/bank balance calc |
| containerNo | string | optional — outgoing dispatch reference (NOT the removed purchase-side shipment concept) |
| status | "paid" \| "partial" \| "unpaid" | |
| createdBy | string | user id/name — used to scope "Sales Person" role visibility |
| ~~batchId~~ | — | **REMOVED** — do not add back |

### `salesReturns`
| Field | Type | Notes |
|---|---|---|
| id, date | | |
| originalSaleId | string | FK → sales.id |
| customerId | string | FK → customers.id |
| qtyKg | number | |
| reason | string | |
| refundAmount | number | |
| restocked | boolean | true = adds qty back to `fishTypes.currentStock`; false = creates a linked `wastageRecords` entry instead |

### `purchases`
| Field | Type | Notes |
|---|---|---|
| id | string | |
| date | string (date) | **user-selectable** |
| purchaseNo | string | |
| supplierId | string | FK → suppliers.id |
| fishId, fishName | | |
| qtyKg | number | |
| totalCost | number | |
| paid | number | |
| transportCost | number | optional, not actively required |
| paymentMethod | "Cash" \| "Bank" | |
| ~~grade~~ | — | **REMOVED** |
| ~~containerId / shipment fields~~ | — | **REMOVED** |
| ~~batchId~~ | — | **REMOVED** |

### `payments`
| Field | Type | Notes |
|---|---|---|
| id, date | | |
| direction | "in" \| "out" | in = money received, out = money paid |
| type / partyType | "customer" \| "supplier" | which ledger this affects |
| partyId | string | FK → customers.id or suppliers.id depending on type |
| refId | string | optional — links to a specific sales/purchases record; if absent, treated as an "unlinked" payment (e.g. advance) |
| amount | number | |
| method | "Cash" \| "Bank" | |
| refNo | string | cheque/reference number, optional |
| notes | string | |

### `expenses`
| Field | Type | Notes |
|---|---|---|
| id, date | | **user-selectable** date |
| category | enum — see current list in `EXPENSE_CATEGORIES` (src/pages/Expenses/Expenses.jsx): Electricity, Generator, Doctor, Attendance, Weber, Wages, Transport, Rent, Preservatives, Water Tanker Bill, Water, Employee Salary, Plant Maintenance, Other. **`Freezer Maintenance` is REMOVED — do not reintroduce.** |
| amount | number | |
| paymentMethod | "Cash" \| "Bank" | |
| paidBy | string | |
| description | string | |

### `wastageRecords`
| Field | Type | Notes |
|---|---|---|
| id, date | | |
| fishId | string \| null | **OPTIONAL** — can be blank |
| fishName | string | |
| qtyKg | number | |
| reason | string | |
| pricePerKg / costPerKg | number | **editable**, pre-filled from `fishType.avgPurchaseRate` but user can override |
| totalLoss | number | `qtyKg × costPerKg` |
| transportCost | number | optional, not actively required |
| ~~batchId~~ | — | **REMOVED** |
| ~~containerId / shipment~~ | — | **REMOVED** |
| ~~freezerId~~ | — | **REMOVED** |

### `employees`
| Field | Type | Notes |
|---|---|---|
| id, name, phone | | |
| category | "General Labour" \| "Store/Storage Staff" \| "Plant Operator" \| "Teleoperator" \| "Management & Office Staff" | store vs. hall labour distinction lives here |
| createdAt | | |

### `attendanceRecords`
| employeeId (FK), date, status ("Present"\|"Absent"\|"Half Day"\|"Leave") |

### `salaryRecords`
| employeeId (FK), month, baseSalary, advances, deductions, netPaid, paidDate |

### `users`
| Field | Type | Notes |
|---|---|---|
| id, name, email | | |
| passwordHash | string | bcryptjs hash — **never store plain text, never include in backups** |
| role | "SUPER_ADMIN" \| "MANAGER" \| "SALES_PERSON" \| "FREEZER_OPERATOR" | must match `src/constants/roles.js` exactly — this is the ONLY source of truth for roles; the Users & Roles page UI must render from this + `permissions.js`, never a hardcoded local list |
| status | "active" \| "disabled" | disabled users must be rejected at login |

### `dailyPackingRecords`
| id, date, sections: [{ fishTypeId, kgPerCarton, rows: [{ countSize, gradeA, gradeB }] }] | Totals (Ctn/Kg) are always DERIVED at render/save time, never stored |

### `appMeta` (finance balances)
| key ("cashBalance" \| "bankBalance"), value (number) | **derived**, can legitimately be negative — do NOT clamp with `Math.max(0, ...)`, a negative value is a real signal the business is spending more cash than it's collected |

### `bankTransactions`
| id, date, type ("Deposit" \| "Withdrawal"), amount, notes |

### `backupLogs` / local `localBackups` (Dexie)
| Backup metadata and payloads — see the daily-backup feature docs. |

---

## ❌ DEPRECATED / REMOVED — do not reference these anywhere

| Removed thing | Why | What replaced it |
|---|---|---|
| `batches` collection | Batch-level tracking was removed from Purchase/Sale/Wastage forms — raw material is processed directly, not tracked per-batch | `fishTypes.currentStock` (derived from purchases/sales/wastage totals) |
| `freezers` collection + Freezer page/nav | Client confirmed freezing is not actually done in this business | Removed entirely — no replacement needed |
| `shipments` / container-linked installment payments (on Purchases/Suppliers) | Corrected requirement: supplier payments are a simple weekly running balance, not shipment-grouped installments | `suppliers.payable` (derived running balance) |
| `ShipmentSubSection` component | Leftover reference from the above removal, caused a hard crash | Deleted — do not recreate |
| `Grade` field on Purchase | Not applicable — raw material has no grading step at purchase | `grade` still exists on `fishTypes` (optional) if needed elsewhere |
| `containerId` on Purchase | Purchases have no shipment/container concept | `containerNo` on **Sales only** (outgoing dispatch reference — different concept, do not confuse the two) |

**Rule of thumb:** if you're about to add a field/reference to `batches`, `freezers`, or a purchase-side `shipment`/`containerId`, stop — that's very likely reintroducing something that was deliberately removed. Check this file first.

---

## ⚠️ Query Pattern Rule: Reports Must Never Be Capped

Any performance optimization that adds `limit()` to a Firestore/Dexie query (e.g. "only fetch the most recent 100-200 records for fast list-page loading," per the slow-login/performance work) applies **only** to list/browse views — it must **never** be reused for Reports, Profit & Loss, Dashboard period totals, or any other calculation that needs to be complete and accurate. Those must always use a dedicated, unrestricted, date-range-filtered fetch (e.g. `saleService.getAllForReport(startDate, endDate)`), separate from whatever capped query powers the fast-loading list page. If you're adding a new report or a new performance limit anywhere, check this rule first — this caused real missing-data bugs in the Sales and Purchase reports.

## Maintenance rule

Any prompt/change that adds, renames, or removes a field or collection **must update this file in the same change**. If a future bug looks like "page A shows different numbers than page B for the same thing" or "ReferenceError: X is not defined," check this file first — it's usually either (a) a page reading from a deprecated collection, or (b) a component reference left behind after a deletion.
