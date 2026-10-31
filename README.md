# FoodCycle - Full-Stack Surplus Food Rescue Platform

FoodCycle is a full-stack web application connecting food donors (restaurants, bakeries, grocers, and catering services) with community food pantries, emergency shelters, and volunteer drivers to reduce organic landfill waste and alleviate local food insecurity.

Built with a responsive React frontend, full REST APIs, and a relational PostgreSQL database.

---

## 🌟 Key Features

1. **Surplus Food Listings (CRUD)**:
   - Donors can publish surplus food with expiry time, portions, storage conditions (Ambient, Refrigerated, Frozen), and dietary flags (Vegan, Halal, Gluten-Free).
   - Real-time search, category filtering, and status tracking (Available, Claimed, In-Transit, Completed).

2. **Shelter & Recipient Claiming (CRUD)**:
   - Verified community shelters and pantries can claim portions with delivery notes and urgency ratings.

3. **Volunteer Rescue Logistics (CRUD)**:
   - Volunteer drivers can claim pickup missions, navigate to locations, update status (`Assigned` -> `Picked Up` -> `In Transit` -> `Delivered`), and log driver delivery notes.

4. **Super Admin Dashboard**:
   - Comprehensive user management (verify users, promote/demote roles, delete accounts).
   - Donations audit & moderation with status override.
   - Real-time PostgreSQL database telemetry and diagnostics.

5. **Environmental Impact Hub**:
   - Real-time impact calculation for total meals saved, kg of CO₂e avoided, car mile equivalents, and water conserved aligned with UN Sustainable Development Goals (SDG 2, 12, 13).

6. **Dual Backend Options**:
   - **Node.js Express + Drizzle ORM**: Active default full-stack server running in this repository (`server.ts`).
   - **Python Flask + Psycopg2**: Complete standalone Python backend ready in `backend_flask/`.

---

## 🏗️ Project Architecture

```
foodcycle/
├── .vscode/                     # VS Code launch & settings
│   ├── launch.json              # F5 debug configs for Node & Flask
│   └── settings.json
├── backend_flask/               # Python Flask Backend
│   ├── app.py                   # Flask REST API endpoints
│   ├── config.py                # Database configuration
│   ├── requirements.txt         # Python dependencies
│   ├── wsgi.py                  # WSGI entry point for Gunicorn
│   └── .env.example
├── database/
│   └── schema.sql               # Pure PostgreSQL schema DDL & seed data
├── src/
│   ├── components/              # React UI components
│   │   ├── AdminDashboard.tsx   # Admin dashboard & DB diagnostics
│   │   ├── ClaimModal.tsx       # Food reservation modal
│   │   ├── DatabaseHealthBadge.tsx # Live PostgreSQL status indicator
│   │   ├── DonationCard.tsx     # Food listing card
│   │   ├── DonationModal.tsx    # Create/edit donation modal
│   │   ├── ImpactStats.tsx      # Carbon & meals impact metrics
│   │   ├── Navbar.tsx           # Responsive header & role switcher
│   │   ├── RecipientClaims.tsx  # Shelter distribution tracker
│   │   └── VolunteerMissions.tsx# Volunteer delivery dispatch
│   ├── context/
│   │   └── AuthContext.tsx      # Auth & role switcher state
│   ├── db/
│   │   ├── index.ts             # pg.Pool & Drizzle instance
│   │   ├── queries.ts           # Type-safe CRUD query layer
│   │   ├── schema.ts            # Drizzle PostgreSQL schema
│   │   └── drizzle.config.ts    # Drizzle Kit configuration
│   ├── lib/
│   │   ├── firebase.ts          # Client Firebase SDK
│   │   └── firebase-admin.ts    # Server Firebase Admin SDK
│   ├── api.ts                   # Centralized API client
│   ├── App.tsx                  # Main layout & router
│   ├── main.tsx                 # Entry point
│   ├── types.ts                 # TypeScript data contracts
│   └── index.css                # Tailwind CSS
├── render.yaml                  # Render Infrastructure Blueprint
├── server.ts                    # Full-stack Node.js Express server
├── package.json
└── tsconfig.json
```

---

## 🚀 Running Locally in VS Code

### Prerequisites
- Node.js (v18+) and npm
- PostgreSQL database (local or cloud)
- (Optional) Python 3.10+ if using the Flask backend

### Option A: Running with Node.js Express (Default)

1. **Clone and open in VS Code**:
   ```bash
   code .
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set your PostgreSQL connection details in `.env`:
   ```env
   SQL_HOST="localhost"
   SQL_DB_NAME="foodcycle"
   SQL_USER="postgres"
   SQL_PASSWORD="your_password"
   PORT=3000
   ```

4. **Initialize Database Schema**:
   Run the SQL file in your PostgreSQL client:
   ```bash
   psql -U postgres -d foodcycle -f database/schema.sql
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`. You can also press `F5` in VS Code to run and debug!

---

### Option B: Running with Python Flask Backend

1. **Navigate to the Flask directory**:
   ```bash
   cd backend_flask
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

5. **Start Flask API**:
   ```bash
   python app.py
   ```
   The Flask API will run on `http://localhost:5000`.

---

## ☁️ Deployment Configuration for Render

This repository includes a turnkey `render.yaml` configuration for zero-config deployment.

### 1-Click Deployment with Blueprint:
1. Push your repository to **GitHub** or **GitLab**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and provision:
   - A **Managed PostgreSQL Database** (`foodcycle-db`).
   - A **Node.js Web Service** (`foodcycle-app`) configured with:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Environment variable `DATABASE_URL` linked to your database.
4. Click **Apply**.
5. Once the database is ready, connect using Render's built-in PSQL terminal or your local client and run `database/schema.sql` to populate the tables and seed data.

---

## 📡 REST API Reference

| Endpoint | Method | Description | Auth |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & PostgreSQL connection status | Public |
| `/api/metrics` | `GET` | Rescued meals, CO₂ savings, user counts | Public |
| `/api/donations` | `GET` | Filter food listings by status, category, donor | Public |
| `/api/donations/:id` | `GET` | Get single food donation details | Public |
| `/api/donations` | `POST` | Create a new food donation listing | Authenticated |
| `/api/donations/:id` | `PUT` | Update an existing food donation | Owner/Admin |
| `/api/donations/:id` | `DELETE` | Delete a food donation | Owner/Admin |
| `/api/claims` | `GET` | List all shelter food claims | Public/Recipient |
| `/api/claims` | `POST` | Claim surplus food for a shelter | Authenticated |
| `/api/claims/:id` | `PATCH` | Update claim status (approved, picked up, etc.) | Recipient/Admin |
| `/api/deliveries` | `GET` | List all volunteer transport missions | Public/Volunteer |
| `/api/deliveries` | `POST` | Volunteer accepts a delivery mission | Volunteer |
| `/api/deliveries/:id`| `PATCH` | Progress delivery status & driver notes | Volunteer |
| `/api/users` | `GET` | List all registered users | Admin |
| `/api/users/sync` | `POST` | Sync/register user profile | Authenticated |
| `/api/users/:id` | `PATCH` | Update role or verification status | Admin |
| `/api/users/:id` | `DELETE` | Delete user record | Admin |

---

## 👥 Seed Accounts & Testing Personas

Use the **Switch Test Persona** menu in the top-right corner to test all 4 platform roles instantly:

- 👑 **Elena Vance** (`admin@foodcycle.org`) - Platform Administrator with full CRUD moderation authority.
- 🥖 **Marco Rossi** (`baker@harvestbakery.com`) - Artisan Bakery Food Donor.
- 🏠 **David Washington** (`coordinator@hopeshelter.org`) - Hope Valley Community Shelter Recipient.
- 🚚 **Alex Rivera** (`alex.driver@gmail.com`) - Active Volunteer Driver.

---

## 🛡️ License & Standards
Apache-2.0 License. Conforms to UN SDG sustainable consumption and food redistribution hygiene standards.
