# LabelGuard AI
### AI-Powered Legal Metrology Inspection & Enforcement Platform

> Beyond OCR — Evidence-Backed Legal Metrology Compliance Verification

---

## 📌 Project Overview
**LabelGuard AI** is a professional production-quality prototype built for the Smart India Hackathon (SIH26034). It serves as an automated verification platform to inspect packaged commodities and check compliance against the **Legal Metrology (Packaged Commodities) Rules, 2011**.

It extracts label declarations (MRP, generic name, net quantity, consumer care contacts, manufacturer details) using an OCR/NLP layer, validates them using a deterministic machine-readable rule engine, scores package compliance, highlights visual evidence, and generates PDF enforcement reports.

---

## 🛠 Tech Stack
- **Frontend**: React (Vite), React Router, Tailwind CSS, Lucide Icons, Recharts (for dashboard analytics).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB & Mongoose schemas (includes a self-contained **In-Memory Fallback Database** that activates automatically if MongoDB is offline).
- **AI/OCR Service**: Custom provider abstraction allowing plug-and-play OCR integration (Local mock parser + Gemini Vision API config).
- **Reporting**: Server-side PDFKit report generation.

---

## 📁 Folder Structure
```
/client
  /src
    /components   <- Reusable dashboard, evidence & score components
    /pages        <- Login, Dashboard, New Inspection, Details, Catalog, Registry, Reports, Settings
    /App.jsx      <- Client entrypoint & route controller
    /index.css    <- Tailwind directives
    /main.jsx     <- React main hook
  /package.json
/server
  /models
    /Schemas.js   <- Mongoose Models (User, Company, Product, Inspection, Rule)
  /rules
    /rules.js     <- Structured JSON rules configuration
  /services
    /complianceEngine.js <- Scoring & rule verification logic
    /ocrService.js       <- OCR text extraction & demo models mapping
    /reportService.js    <- PDFKit report creation
  /utils
    /seed.js      <- DB seeding script
  /server.js      <- Server entrypoint (Express APIs, protect middleware, memory DB fallback)
  /package.json
```

---

## 🔑 Demo Credentials
- **Inspector ID / Email**: `inspector@labelguard.ai`
- **Password**: `Inspector@123`

---

## 🚀 Installation & Local Execution

### Prerequisites
- Node.js installed on your machine.
- MongoDB (Optional. If not running, the platform automatically starts in In-Memory Fallback mode).

### Setup and Running the Backend
1. Open a terminal inside the `/server` directory:
   ```bash
   cd server
   npm install
   ```
2. Set up environment configuration:
   Create a `.env` file or copy `.env.example` to `.env`.
3. Seed the database (if MongoDB is online):
   ```bash
   npm run seed
   ```
4. Run the server:
   ```bash
   npm start
   ```
   *(Note: If MongoDB is offline, you will see a console warning and the system will run successfully using its internal In-Memory fallback).*

### Setup and Running the Frontend
1. Open a new terminal inside the `/client` directory:
   ```bash
   cd client
   npm install
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

---

## ⚙️ Core Application Workflow (Demo Mode)
1. **Login**: Authenticate using the seeded demo credentials.
2. **Dashboard**: Inspect overall KPI cards, compliance trend charts, severity graphs, and the recent inspections logs.
3. **New Inspection**:
   - Click **New Inspection** on the sidebar.
   - Select **Load Demo Product (Biscuits)** to pre-populate standard package labels.
   - Click **Proceed to Preprocessing** to preview image stats (blur, resolution, quality score).
   - Click **Extract & Verify Compliance** to run the mock OCR analysis and Legal Metrology Rule validation.
   - Adjust active fields in the declarations table to highlight specific visual bounding box highlights.
   - Add notes and click **Save Inspection**.
4. **Inspections Log**: View the saved inspection and its timeline.
5. **PDF Reports**: Click **Download PDF Report** to download an official enforcement document.

---

## 📑 API Endpoints

- `POST /api/auth/login` - Login endpoint
- `GET /api/dashboard` - Retrieve dashboard analytics & trends
- `POST /api/inspections/analyze` - Extract OCR declarations and run rules
- `POST /api/inspections` - Save inspection record
- `GET /api/inspections` - List all inspections
- `GET /api/inspections/:id` - Fetch individual inspection details
- `GET /api/products` - Catalog list of commodities
- `GET /api/companies` - Company registry list
- `GET /api/reports/:inspectionId` - Generate & download PDF report
- `GET /api/rules` - List active metrology rules

---

## 🛣 Future Roadmap (Remaining 50%)
- **Real-Time OCR Integration**: Complete plug-and-play deployment for Google Gemini Vision API to parse raw label text from any uploaded product.
- **Counterfeit Protection**: Deep learning image hashing to cross-reference batch packaging visual features.
- **Offline Synchronization**: PWA integration allowing inspectors to cache inspection results locally and synchronize once network access is restored.
- **AI Recommendation Engine**: Human-in-the-loop validation updates to dynamically refine OCR parsing and improve extraction confidence over time.
- **Multilingual Support**: Parse and extract local language metrology declarations.
