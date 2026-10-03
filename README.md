# Fish ERP - React + Vite Client

A modern, offline-first ERP system for fish trading, cold storage, batch tracking, and accounting.

## Architecture & Storage Layer

### Phase 1: Local IndexedDB Persistence & Real Authentication (Current Implementation)
Currently, the application runs entirely in the browser without requiring a backend server. Data persistence is powered by **Dexie.js (IndexedDB)** with pure client-side **Bcrypt** authentication.

- **Canonical Database Schema**: See [`SCHEMA.md`](file:///f:/proect/fish%20client/SCHEMA.md) for the single source of truth data model reference.
- **IndexedDB Database Setup**: Defined in `src/db/dexieDb.js`.
- **Authentication & Security**:
  - **Bcrypt Password Hashing**: All passwords are hashed using `bcryptjs` (salt rounds: 10) before storing in IndexedDB. Plain-text passwords are never saved.
  - **Session Management**: Successful login generates a session token stored in `localStorage` with a **24-hour expiry timestamp**.
  - **Account Status Guard**: Inactive/disabled users are blocked from logging in.
  - **Rate Limiting & Lockout**: 5 consecutive failed login attempts trigger a 5-minute cooldown for the target account.
  - **Password Strength**: Enforces a minimum 8-character password standard.
  - **Change Password**: Built-in Change Password feature with current password verification.
- **Service Layer Abstraction**: Encapsulated in `src/services/{resource}Service.js` files (`customerService.js`, `supplierService.js`, `saleService.js`, `purchaseService.js`, `paymentService.js`, `expenseService.js`, `wastageService.js`, `employeeService.js`, `fishTypeService.js`, `dailyPackingService.js`, `authService.js`, etc.).
- **State Management**: `src/store.jsx` hydrates state from the service layer upon boot and delegates all state mutations through service methods.
- **Data Safety Net**: Includes a JSON Data Export/Import feature located in the **Users & Roles -> Data Backup & Recovery** tab.

### Future Phase: Backend Migration Path (Node.js + Express + Supabase)
When migrating to the cloud-hosted Node.js + Express + Supabase backend:

1. **Zero Component Changes**: All pages, UI components, and `src/store.jsx` will require **NO changes**.
2. **Service Internals Swap**: Only the internal implementations of each service function in `src/services/*.js` will be updated to replace Dexie calls with standard `fetch()` or Axios API requests against Express endpoints (e.g. `GET /api/customers`, `POST /api/sales`).
3. **Signature Consistency**: Every service function keeps its exact signature:
   ```javascript
   export async function getAll(filters) { ... }
   export async function getById(id) { ... }
   export async function create(data) { ... }
   export async function update(id, data) { ... }
   export async function remove(id) { ... }
   ```

---

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```
