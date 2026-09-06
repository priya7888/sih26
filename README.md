# SafetyAI — AI-Powered SIF Precursor Detection & Enterprise HSE Safety Platform

> **Client / Operational Unit:** Oil India Limited — Health, Safety, Security & Environment (OIL-INDIA-HSSE)  
> **Challenge:** Smart India Hackathon (SIH) — Automated SIF Precursor Detection from Field Safety Reports

---

## 🚀 Overview

**SafetyAI** is an enterprise-grade Health, Safety, Security, and Environment (HSSE) platform tailored for oil and gas operations. It incorporates a **public-facing educational and public relations portal** alongside an **authenticated Organization Portal** with an industrial dark theme, amber safety accents, and deep AI-powered precursor intelligence.

---

## 🔐 Organization Portal Credentials

The platform provides multi-tier organization authentication with preset credentials:

| Organization | Org ID | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **OIL-INDIA-HSSE** | `id001` | `admin1@gmail.com` | `Admin1@123` | Chief HSE Auditor / HSSE Director |
| **Offshore Rig Operations** | `id002` | `admin2@gmail.com` | `Admin2@123` | HSE Lead Officer 02 |
| **Refinery & Petrochemicals** | `id003` | `admin3@gmail.com` | `Admin3@123` | HSE Lead Officer 03 |
| **Exploration & Production** | `id004` | `admin4@gmail.com` | `Admin4@123` | HSE Lead Officer 04 |
| **Gas Transmission Division**| `id005` | `admin5@gmail.com` | `Admin5@123` | HSE Lead Officer 05 |

---

## 🖥️ Organization Portal Modules

1. **Overview Dashboard**
   - Hero greeting: *"Good Morning, HSSE Team"* with high-resolution sunset oil refinery imagery, IOGP tags (*Detect Early*, *Understand Deeper*, *Prevent Together*), and safety culture quotes.
   - **Live Safety Status**: Operations Normal indicator.
   - **AI Watches The Signals**: Dedicated radar banner.
   - **KPI Metrics**: Total Reports (1,248), SIF Potential (87), Precursors (143), Control Failures (31) with dynamic sparklines.
   - **SIF Potential Trend**: Smooth spline curve with area glow across 6-month timeline and active August marker (87 SIF Potential).
   - **Reports by Activity**: Donut distribution across Maintenance, Operations, Drilling, Inspection, Construction, and Other.
   - **Risk by Location**: Geospatial asset risk map highlighting Assam Asset, Duliajan CPF, Digboi, Moran, and Naharkatiya.
   - **Recent High-Potential Reports Table**: Full audit table with direct modal inspection.
   - **AI Insights & Today's Focus**: Real-time precursor recommendations with interactive task checklist and report submission.
   - **Industrial Operations Carousel**: Multi-slide plant operations review.

2. **Safety Reports Management**
   - Searchable, multi-filtered registry of all incident and observation reports.
   - Filters for Activity, Location, SIF Potential, Status, and Time Horizon.
   - Interactive report inspection modal featuring AI confidence analysis, energy sources, failed control barriers, and human-in-the-loop validation actions.

3. **SIF Intelligence**
   - Advanced weak signal correlation clustering recurring precursors (e.g. LOTO bypassing, drop-zone barricade breaches).
   - Explainable AI panel detailing energy magnitude, barrier degradation, and worker exposure line-of-fire.

4. **Critical Controls Monitoring**
   - Operational barrier assurance tracking (42 monitored controls).
   - Barrier effectiveness health bars across Energy Isolation, Pressure Safety Valves, Drop-Zone Barricades, Gas Detection, and Hot Work controls.
   - Immediate verification sign-off actions and priority degradation alert lists.

5. **Analytics & Trends**
   - Dual-trend correlation between SIF Potential and Precursor frequency.
   - IOGP Energy Wheel category breakdown (Gravity, Pressure, Electrical, Kinetic, Chemical, Thermal).
   - Operational shift & fatigue risk heatmaps.

6. **HSE Knowledge Hub**
   - Standard operating procedures, IOGP Life-Saving Rules, and technical bulletins.
   - Featured: *OIL INDIA SIF Precursor Detection Framework (Rev 4.2)*.
   - In-app document viewer and simulated PDF download.

7. **Organization & Asset Registry**
   - Full profile of OIL-INDIA-HSSE, headquarters, legal registrations, and HSE Tier 1 status.
   - Asset registry with live operational status, risk ratings, on-duty personnel, and HSSE directorate governance directory.

8. **Settings & Governance**
   - User profile settings, AI precursor sensitivity thresholds slider (50%–95%), automated barrier verification rules, notification channels (daily digest, immediate SMS escalation), and enterprise 2FA security.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Tailwind CSS v4, Lucide Icons, Vite 6
- **Backend:** FastAPI, Python 3, SQLAlchemy, JWT Authentication, Pydantic
- **Design System:** Industrial HSE Dark Palette (`#080b11`, `#0f141e`, `#121826`), Amber/Gold Safety Accents (`#f59e0b`, `#fbbf24`), Emerald Green (`#10b981`), Crimson Red (`#ef4444`).

---

## 🏃 Running the Application

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```
Access the application at `http://localhost:3000/`.

### 2. Backend Setup (Optional API Server)
```bash
# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: The frontend includes intelligent fallback authentication and mock services, allowing full offline operation if the backend is not running.*
