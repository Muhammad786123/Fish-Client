# Figma Make Master Coding Prompt — Fish Trading & Frozen Fish ERP

Build a **complete, high-fidelity, fully clickable Fish Trading & Frozen Fish Business Management ERP/POS web application**.

The application is for a business that:

**Purchases fresh fish by KG → receives fish from suppliers → creates purchase batches → stores/freezes fish in freezers → maintains frozen stock → sells fish by KG → generates invoices → receives customer payments → records expenses → records wastage → manages employees → manages accounts → calculates profit/loss → generates reports.**

The application must be extremely **user-friendly, professional, responsive, and easy for both the business owner/client and developers to understand**.

---

# 1. DESIGN REQUIREMENTS

Create a modern professional ERP dashboard with:

* Clean white/light background
* Deep navy/blue primary color
* Aqua/teal accent color
* Soft gray backgrounds
* Green for paid/profit/success
* Red for due/loss/wastage
* Orange for pending/warning
* Rounded cards
* Clear typography
* Professional icons
* Clean tables
* Simple forms
* Consistent spacing
* Clear visual hierarchy

Do not over-design the application.

Prioritize:

**Simplicity + usability + readability + fast navigation.**

The application should look like a real production-ready business ERP, not a simple UI mockup.

---

# 2. RESPONSIVE DESIGN

The application must be fully responsive.

Create layouts for:

### Desktop

* 1440px primary desktop layout
* Left sidebar
* Top header
* Large dashboard cards
* Data tables
* Charts
* Multi-column forms

### Tablet

* Collapsible sidebar
* Responsive tables
* 2-column forms

### Mobile

* Mobile-friendly header
* Bottom navigation or collapsible navigation
* Cards instead of wide tables where appropriate
* Horizontally scrollable tables when necessary
* Single-column forms
* Large touch-friendly buttons
* No content overflow

Every screen must remain usable on mobile.

---

# 3. GLOBAL NAVIGATION

Create the following sidebar navigation:

1. Dashboard
2. Sales / POS
3. Purchases
4. Frozen Stock
5. Freezers
6. Fish & Batches
7. Customers
8. Suppliers
9. Payments
10. Expenses
11. Wastage
12. Employees
13. Accounts
14. Profit & Loss
15. Reports
16. Notifications
17. Users & Roles
18. Settings

Add a profile section at the bottom.

Example:

**Admin User**

* Administrator
* Profile
* Logout

---

# 4. LANGUAGE SWITCHER

Add a language switcher in the top header:

**English | اردو**

The entire interface must support:

### English

Use simple English labels.

### Urdu

Use simple Urdu language with proper RTL layout.

When Urdu is selected:

* Sidebar changes to Urdu
* Buttons change to Urdu
* Table headings change to Urdu
* Forms change to Urdu
* Dashboard labels change to Urdu
* Navigation direction becomes RTL
* Cards and content alignment adjusts properly

Example:

English:

Dashboard
Sales
Purchases
Frozen Stock
Customers
Suppliers
Payments
Expenses
Wastage
Reports

Urdu:

ڈیش بورڈ
فروخت
خریداری
منجمد اسٹاک
گاہک
سپلائرز
ادائیگیاں
اخراجات
ضائع شدہ مال
رپورٹس

The language switch must work throughout the prototype.

---

# 5. DASHBOARD

Create a highly informative business dashboard.

Top section:

**Good Morning, Admin 👋**

Subtitle:

**Here's your fish business overview for today.**

Add date selector:

**Today | This Week | This Month | Custom**

---

## Dashboard KPI Cards

Create:

### Today's Sales

Rs. 485,000

### Today's Purchase

Rs. 320,000

### Frozen Stock

1,245 KG

### Today's Wastage

18 KG

### Customer Receivable

Rs. 285,000

### Supplier Payable

Rs. 175,000

### Cash In Hand

Rs. 350,000

### Net Profit

Rs. 125,000

Every card must be clickable.

Example:

Click **Today's Sales** → Sales Report.

Click **Frozen Stock** → Frozen Stock page.

Click **Customer Receivable** → Customer Receivable page.

Click **Net Profit** → Profit & Loss.

---

# 6. DASHBOARD CHARTS

Add:

### Sales Overview

Line/bar chart:

* Mon
* Tue
* Wed
* Thu
* Fri
* Sat
* Sun

### Purchase vs Sales

Comparison chart.

### Fish Stock Distribution

Pie/donut chart:

* Rohu
* Surmai
* Tilapia
* Pomfret
* King Fish
* Trout

### Wastage Overview

Chart showing wastage by fish type.

### Recent Transactions

Display:

* Recent Sales
* Recent Purchases
* Recent Payments
* Recent Wastage

Every row must be clickable.

---

# 7. QUICK ACTIONS

Add prominent buttons:

**+ New Sale**

**+ New Purchase**

**+ Add Customer**

**+ Receive Payment**

**+ Add Expense**

**+ Record Wastage**

**+ Add Fish Batch**

Buttons must open the relevant form/modal/page.

---

# 8. SALES / POS MODULE

Create a professional KG-based fish POS.

## New Sale Screen

Fields:

* Invoice Number
* Date
* Customer
* Fish Type
* Batch
* Available Stock
* Quantity KG
* Rate per KG
* Discount
* Subtotal
* Grand Total
* Paid Amount
* Remaining Amount
* Payment Method
* Notes

Example:

Customer:
**Muhammad Traders**

Fish:
**Rohu**

Batch:
**FB-1001**

Available:
**145 KG**

Quantity:
**50 KG**

Rate:
**Rs. 850 / KG**

Subtotal:
**Rs. 42,500**

Paid:
**Rs. 30,000**

Due:
**Rs. 12,500**

Payment Method:
**Cash**

---

## Sale Logic

When sale is submitted:

**Stock decreases by sold KG.**

Example:

Before Sale:
145 KG

Sold:
50 KG

After Sale:
95 KG

Customer outstanding should automatically increase if payment is incomplete.

Create success message:

**Sale completed successfully.**

Buttons:

* View Invoice
* Download PDF
* Print
* Send on WhatsApp
* New Sale

---

# 9. SALES LIST

Create Sales table:

Columns:

* Invoice #
* Date
* Customer
* Fish
* Quantity
* Total
* Paid
* Due
* Status
* Created By

Statuses:

* Paid
* Partial
* Due

Add:

* Search
* Date Filter
* Customer Filter
* Fish Filter
* Payment Status Filter
* Export PDF
* Print

Every row clickable.

---

# 10. PURCHASE MODULE

Create purchase management.

## New Purchase

Fields:

* Purchase ID
* Date
* Supplier
* Fish Type
* Quantity KG
* Rate/KG
* Fish Grade
* Transport Cost
* Other Cost
* Total Cost
* Paid Amount
* Remaining
* Freezer
* Batch Number
* Notes

Example:

Supplier:
**Ali Seafood Supplier**

Fish:
**Rohu**

Quantity:
**250 KG**

Rate:
**Rs. 650/KG**

Fish Cost:
**Rs. 162,500**

Transport:
**Rs. 7,500**

Total:
**Rs. 170,000**

Paid:
**Rs. 100,000**

Payable:
**Rs. 70,000**

---

# 11. PURCHASE LOGIC

When purchase is submitted:

* Create purchase record
* Create unique batch number
* Increase available stock
* Add fish to selected freezer
* Update supplier payable
* Add purchase to accounts
* Update dashboard

Example:

**Purchase → Batch FB-1001 → Freezer #01 → +250 KG**

Show:

**Purchase added successfully.**

Buttons:

* View Purchase
* View Batch
* View Supplier
* Record Payment

---

# 12. FROZEN STOCK MODULE

Create a dedicated frozen fish inventory page.

Top KPI cards:

* Total Frozen Stock
* Available KG
* Sold KG
* Wastage KG
* Freezer Capacity
* Available Freezer Capacity

Create stock table:

| Batch | Fish | Freezer | Purchased | Sold | Wastage | Remaining |
| ----- | ---- | ------- | --------: | ---: | ------: | --------: |

Dummy data:

FB-1001 | Rohu | Freezer #01 | 250 KG | 100 KG | 5 KG | 145 KG

FB-1002 | Surmai | Freezer #02 | 180 KG | 80 KG | 3 KG | 97 KG

FB-1003 | Tilapia | Freezer #01 | 300 KG | 120 KG | 8 KG | 172 KG

Every batch must be clickable.

---

# 13. BATCH TRACKING

Create detailed batch tracking.

Example:

**Batch FB-1001**

Fish:
Rohu

Purchase Date:
01 Sep 2026

Original Quantity:
250 KG

Purchase Rate:
Rs. 650/KG

Freezer:
Freezer #01

Sold:
100 KG

Wastage:
5 KG

Remaining:
145 KG

Create timeline:

Purchase Created
↓
Batch Created
↓
Moved to Freezer
↓
Sale 50 KG
↓
Sale 50 KG
↓
Wastage 5 KG
↓
Remaining 145 KG

---

# 14. FREEZER MANAGEMENT

Create Freezer Management module.

Freezer cards:

### Freezer #01

Capacity: 1,000 KG
Used: 720 KG
Available: 280 KG
Temperature: -18°C
Status: Active

### Freezer #02

Capacity: 800 KG
Used: 560 KG
Available: 240 KG
Temperature: -17°C
Status: Active

### Freezer #03

Capacity: 1,200 KG
Used: 1,050 KG
Available: 150 KG
Temperature: -18°C
Status: Warning

Clicking a freezer opens:

* Capacity
* Current Stock
* Fish Stored
* Batches
* Temperature History
* Stock Movement

---

# 15. FISH & BATCHES

Create fish master data.

Fish list:

* Rohu
* Surmai
* Tilapia
* Pomfret
* King Fish
* Trout
* Catfish
* Sole Fish

Fish profile should show:

* Current Stock
* Average Purchase Rate
* Average Sale Rate
* Total Purchased
* Total Sold
* Total Wastage
* Profit
* Batch History

---

# 16. CUSTOMERS

Customer management page.

Customer table:

* Customer Name
* Phone
* Total Sales
* Paid
* Due
* Last Purchase
* Status

Dummy customers:

* Muhammad Traders
* Fresh Fish Market
* Al-Madina Foods
* Royal Seafood
* New Karachi Fish Shop
* City Frozen Foods
* Madina Wholesale
* Ahmed Traders

---

# 17. CUSTOMER DETAIL

Customer profile:

**Muhammad Traders**

Phone:
0300-1112233

Total Sales:
Rs. 485,000

Paid:
Rs. 400,000

Due:
Rs. 85,000

Buttons:

* New Sale
* Receive Payment
* Send WhatsApp
* View Ledger
* View Invoices

Tabs:

**Overview | Sales | Payments | Ledger**

Every invoice and payment row must be clickable.

---

# 18. SUPPLIERS

Create supplier management.

Dummy suppliers:

* Ali Seafood Supplier
* Karachi Fish Traders
* Ahmed Fish Supply
* Ocean Fresh Suppliers
* Sea Food Wholesale Market
* Bilal Fish Traders

Supplier profile:

* Total Purchases
* Paid
* Payable
* Purchase History
* Payment History
* Ledger

Buttons:

* New Purchase
* Pay Supplier
* View Ledger
* WhatsApp

---

# 19. PAYMENTS

Create centralized payment module.

Tabs:

### Customer Payments

### Supplier Payments

Customer payment fields:

* Payment ID
* Customer
* Invoice
* Amount
* Date
* Payment Method
* Received By

Supplier payment:

* Payment ID
* Supplier
* Purchase
* Amount
* Date
* Payment Method
* Paid By

Payment methods:

* Cash
* Bank
* Online
* Other

---

# 20. EXPENSES

Create expense management.

Expense categories:

* Transport
* Electricity
* Freezer Maintenance
* Ice
* Packaging
* Employee Salary
* Rent
* Fuel
* Loading/Unloading
* Repairs
* Other

Dummy expenses:

Freezer Electricity:
Rs. 18,500

Transport:
Rs. 7,500

Packaging:
Rs. 4,200

Freezer Repair:
Rs. 12,000

Fuel:
Rs. 8,500

Every expense must be clickable.

---

# 21. WASTAGE MODULE

Create a dedicated wastage management system.

## Record Wastage

Fields:

* Wastage ID
* Date
* Fish
* Batch
* Freezer
* Quantity KG
* Reason
* Cost/KG
* Total Loss
* Recorded By
* Notes

Reasons:

* Spoiled
* Damaged
* Expired
* Handling Loss
* Cleaning Loss
* Other

Example:

Surmai
4 KG
Rs. 1,150/KG

Total Loss:
Rs. 4,600

When wastage is saved:

**Stock decreases automatically.**

**Wastage loss is added to Profit & Loss.**

---

# 22. EMPLOYEES

Employee module.

Dummy employees:

* Ahmed Khan — Manager
* Bilal Ahmed — Sales Staff
* Usman Ali — Store Staff
* Hamza Malik — Accountant
* Salman Shah — Freezer Staff
* Imran Raza — Delivery Staff

Employee fields:

* Name
* Phone
* Position
* Joining Date
* Salary
* Status
* Attendance
* Salary Paid
* Salary Due

Employee profile should have:

**Overview | Attendance | Salary | Activity**

---

# 23. USERS & ROLES

Create role-based multi-user system.

Roles:

### Admin

Full access.

### Manager

Sales, Purchases, Stock, Customers, Suppliers, Reports.

### Sales Staff

Sales, POS, Customers, Invoices.

### Store/Freezer Staff

Stock, Freezers, Batches, Wastage.

### Accountant

Payments, Expenses, Accounts, Reports, Profit/Loss.

Permission controls:

* View
* Add
* Edit
* Delete
* Export

Create user list with status:

* Active
* Inactive

---

# 24. ACCOUNTS

Create simple business accounting module.

Accounts:

* Cash
* Bank
* Online Payments
* Customer Receivables
* Supplier Payables
* Expenses

Dashboard:

### Cash In Hand

Rs. 350,000

### Bank Balance

Rs. 850,000

### Customer Receivable

Rs. 285,000

### Supplier Payable

Rs. 175,000

Create account ledger.

Every transaction should be clickable.

---

# 25. PROFIT & LOSS

Create professional Profit & Loss page.

Filters:

* Today
* This Week
* This Month
* Custom Date

Show:

### Revenue

Total Sales:
Rs. 1,250,000

### Cost of Goods

Fish Purchase:
Rs. 850,000

### Operating Expenses

Rs. 125,000

### Wastage Loss

Rs. 18,000

### Gross Profit

Rs. 400,000

### Net Profit

Rs. 257,000

Add chart for:

**Revenue vs Cost vs Profit**

Every amount should be clickable and open detailed transactions.

---

# 26. REPORTS

Create Reports Center.

Categories:

### Sales Reports

* Daily Sales
* Weekly Sales
* Monthly Sales
* Fish-wise Sales
* Customer-wise Sales

### Purchase Reports

* Daily Purchases
* Supplier-wise Purchases
* Fish-wise Purchases

### Stock Reports

* Current Stock
* Frozen Stock
* Batch Report
* Freezer Report
* Stock Movement

### Wastage Reports

* Fish-wise Wastage
* Batch-wise Wastage
* Reason-wise Wastage

### Financial Reports

* Profit & Loss
* Expenses
* Cash Flow
* Customer Receivables
* Supplier Payables
* Payment Report

Every report must have:

* Search
* Filters
* Date Range
* Export PDF
* Print

---

# 27. INVOICE SYSTEM

Create a professional invoice detail page.

Header:

Business Logo
Business Name
Phone
Address

Invoice:

**INV-1025**

Date:
01 Sep 2026

Customer:
Muhammad Traders

Table:

Fish | KG | Rate/KG | Amount

Rohu | 50 KG | Rs. 850 | Rs. 42,500

Tilapia | 20 KG | Rs. 700 | Rs. 14,000

Subtotal:
Rs. 56,500

Discount:
Rs. 1,500

Grand Total:
Rs. 55,000

Paid:
Rs. 40,000

Due:
Rs. 15,000

Buttons:

**Download PDF**
**Print**
**Send on WhatsApp**

---

# 28. WHATSAPP BUTTONS

Add WhatsApp buttons wherever useful.

Customer:
**Send WhatsApp**

Invoice:
**Send Invoice**

Payment:
**Send Payment Reminder**

Supplier:
**Contact Supplier**

Use realistic WhatsApp action states.

Example confirmation:

**Invoice is ready to share on WhatsApp.**

---

# 29. NOTIFICATIONS

Create notification center.

Examples:

⚠️ Freezer #03 is 87% full.

⚠️ Muhammad Traders has Rs. 85,000 outstanding.

⚠️ Supplier payment of Rs. 70,000 is due.

⚠️ 18 KG fish wastage recorded today.

⚠️ Surmai stock is running low.

Every notification should be clickable and open the relevant record.

---

# 30. GLOBAL SEARCH

Create global search in the top header.

Search:

* Customer
* Supplier
* Invoice
* Purchase
* Sale
* Fish
* Batch
* Freezer
* Payment
* Expense

Example:

Search:
**INV-1025**

Result:
Invoice INV-1025

Search:
**Muhammad Traders**

Result:
Customer Profile

Search:
**FB-1001**

Result:
Batch Detail

---

# 31. DATA CLICKABILITY REQUIREMENT

This is extremely important.

**DO NOT create static screens.**

The whole prototype must be interconnected.

Examples:

Dashboard Sales Card
→ Sales Page

Sales Row
→ Sale Detail

Sale Detail
→ Customer

Customer
→ Customer Ledger

Customer Ledger
→ Payment Detail

Invoice
→ Customer

Invoice
→ PDF/Print preview

Frozen Stock
→ Batch Detail

Batch
→ Purchase

Batch
→ Freezer

Wastage
→ Batch

Expense
→ Expense Detail

Profit
→ Detailed Profit Report

Every major card, table row, button and record must have a meaningful interaction.

---

# 32. MODALS & FORMS

Use clean modal/dialog forms for quick actions.

Examples:

**Add Customer**

Name
Phone
Address
Opening Balance

Buttons:

Cancel | Save Customer

After save:

Show success toast:

**Customer added successfully.**

Similarly create modals for:

* Add Supplier
* Add Fish
* Add Payment
* Add Expense
* Add Wastage
* Add Employee
* Add Freezer

---

# 33. VALIDATION & UX

Add realistic validation.

Examples:

If sale quantity is greater than available stock:

**Insufficient stock. Only 45 KG available.**

If payment exceeds remaining balance:

**Payment cannot be greater than outstanding amount.**

If freezer capacity is full:

**Not enough freezer capacity available.**

Use confirmation before:

* Delete
* Cancel Sale
* Delete Purchase
* Record Wastage

Show success/error/warning states.

---

# 34. DUMMY DATA REQUIREMENT

Populate the complete prototype with realistic dummy data.

Minimum:

* 8 Customers
* 6 Suppliers
* 8 Fish Types
* 15 Purchase Records
* 20 Sales Records
* 10 Invoices
* 5 Freezers
* 15 Frozen Batches
* 10 Wastage Records
* 15 Expenses
* 8 Employees
* 20 Payment Records
* Multiple account transactions
* Customer ledgers
* Supplier ledgers
* Daily/monthly reports

Do NOT leave important screens empty.

All dummy numbers must be logically connected.

Example:

Purchase:
250 KG

Sales:
100 KG

Wastage:
5 KG

Remaining:
145 KG

Do not show contradictory stock numbers.

---

# 35. IMPORTANT BUSINESS LOGIC

Maintain these formulas throughout the prototype:

### Stock

Opening Stock

* Purchases
  − Sales
  − Wastage
  = Closing Stock

### Sale

Quantity × Rate/KG
= Sale Amount

### Customer Due

Total Sales
− Customer Payments
= Customer Receivable

### Supplier Payable

Total Purchases
− Supplier Payments
= Supplier Payable

### Wastage Loss

Wastage KG × Cost/KG
= Wastage Loss

### Profit

Sales Revenue
− Fish Cost
− Wastage
− Operating Expenses
= Net Profit

Use these calculations consistently in dashboard, reports, customer profiles, supplier profiles and accounting.

---

# 36. SETTINGS

Create Settings page with:

### Business Settings

* Business Name
* Logo
* Phone
* Address
* Currency
* Invoice Prefix

### Language

* English
* اردو

### Users & Security

* Users
* Roles
* Permissions

### Invoice Settings

* Invoice Template
* Show Logo
* Footer Text

### Notification Settings

---

# 37. EMPTY STATES

Create proper empty states even though dummy data exists.

Examples:

**No Sales Found**

"No sales match your selected filters."

Button:
**Create New Sale**

Similar empty states for:

* Customers
* Suppliers
* Payments
* Expenses
* Wastage
* Reports

---

# 38. MOBILE NAVIGATION

On mobile use:

**Home | Sales | Stock | Customers | More**

The More menu should contain:

Purchases
Suppliers
Payments
Expenses
Wastage
Employees
Accounts
Reports
Settings

Use a floating **+** button for quick actions:

* Sale
* Purchase
* Payment
* Expense
* Wastage

---

# 39. FINAL PROTOTYPE QUALITY

The final result must feel like a **real fish business ERP SaaS application**.

Requirements:

* High fidelity
* Fully clickable
* Realistic dummy data
* Consistent data
* Responsive desktop/mobile layouts
* English + Urdu
* RTL Urdu support
* Professional charts
* Professional tables
* Forms
* Modals
* Toast notifications
* Confirmation dialogs
* Search
* Filters
* PDF invoice preview
* WhatsApp action buttons
* Role-based users
* Stock calculations
* Profit/loss calculations
* Customer/supplier ledgers
* Freezer/batch tracking
* Wastage tracking

Do not create disconnected screens.

Create a clear prototype flow:

**Dashboard → Purchase → Batch → Freezer → Frozen Stock → Sale → Invoice → Payment → Accounts → Profit/Loss → Reports**

The application should be understandable without additional explanation.

The primary goal is:

**A non-technical fish business owner should be able to understand and operate the application easily, while a developer should be able to clearly understand the complete business workflow and required modules from the design.**
