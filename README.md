# Restoza • Fine Dining & Restaurant Management System

![Restoza Brand](/client/public/restoza-brand.jpg)

**Restoza** is a modern, full-stack, responsive Restaurant Management and Operations Platform built in accordance with the 32-page specification in `broken_plan.pdf`. It unites a customer-facing fine dining website with a comprehensive operational SaaS workspace for restaurant staff.

---

## Key Highlights

- **Customer Dining Experience**:
  - **No login required** for customers to browse digital menus, search dishes, filter categories, customize items, and place table or takeaway orders.
  - Live order tracking with status indicators: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `SERVED`.
  - Customer review and 5-star ratings submission directly from the menu.

- **Role-Based Operations SaaS**:
  - **Super Admin & Manager**: Sales KPIs, today's revenue (৳), Recharts revenue trends, live visual floor plan, full Menu CRUD, Category CRUD, Table CRUD, Staff accounts, Guest reviews monitor.
  - **Waiter POS & Floor**: Floor layout with instant table assignment, custom order modifiers, send order to kitchen, live status stream, and one-click "Request Bill".
  - **Kitchen Display System (KDS)**: High-contrast order ticket cards, elapsed preparation timers, item-specific notes ("No onions"), status transitions (`[Start Preparing]` → `[Mark Ready]`).
  - **Cashier Billing Desk**: Pending bills queue, payment method settlement (Cash, Card, Mobile Banking, Online), **automatic 80mm thermal receipt generation with printable POS card layout**.
  - **Admin Tax & Charge Control**: Admin can modify statutory VAT/Tax rate (%) and Hospitality Service Charge (%) live from the Settings panel.

- **PostgreSQL Database Integration**:
  - Connected to Supabase PostgreSQL database using Prisma ORM.
  - Pre-seeded with 12 dining tables, 6 food categories, 20+ realistic dishes with photography, default staff accounts, and live analytics.

- **Unique Branding & Identity**:
  - Custom vector brand emblem and favicon featuring a golden cloche, chef flame, and crossed cutlery.
  - Deep Burgundy velvet (`#881337`) and Warm Gold (`#F59E0B`) luxury dining aesthetic.

---

## Role Credentials & Quick Demo Access

On the **Staff Portal**, you can click any of the **Quick Demo Login (1-Click)** badges to log into any role instantly without typing passwords:

| Role | Email | Default Password | Workspace Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@restoza.com` | `admin123` | Full system control, tax & settings, staff, reports |
| **Manager** | `manager@restoza.com` | `manager123` | Menu CRUD, tables, analytics, reviews |
| **Waiter** | `waiter@restoza.com` | `waiter123` | Floor table service, POS order entry, bill requests |
| **Kitchen Chef** | `chef@restoza.com` | `chef123` | Dedicated KDS ticket queue, cooking status updates |
| **Cashier** | `cashier@restoza.com` | `cashier123` | Invoice generation, payment settlement, thermal receipts |

*Note: Diners and guests do not need credentials and can order directly on the public website.*

---

## Running Locally

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Database Sync & Seeding (Supabase PostgreSQL)
```bash
# Push schema to database
npm run db:push

# Seed categories, menu dishes, tables, and demo accounts
npm run seed
```

### 3. Start Application
```bash
# Starts both Backend (Port 5000) and Frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Website**: `http://localhost:5173`
- **Backend API & Socket.io**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
