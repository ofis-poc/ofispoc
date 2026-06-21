# Olam AgriConnect Expert Portal

An agricultural diagnostic review portal designed for Olam agronomists and crop experts. This portal acts as the human-in-the-loop validation layer for AI-generated crop disease diagnoses submitted by farmers through a WhatsApp chatbot interface.

---

## 🏗️ Project Architecture

```
 Farmer ──> WhatsApp ──> Meta API ──> n8n ──> OpenAI Vision ──> POST /api/cases ──> Expert Portal (Storage)
                                                                                         │
 Farmer <── WhatsApp <── Meta API <── n8n Webhook <── Outgoing Webhook <── [Send Response] ┘
```

1. **Farmer Input:** Farmers send photos of diseased crops via WhatsApp.
2. **AI Analysis:** Meta Cloud API forwards the image to **n8n**, which calls the **OpenAI Image Analysis API** to generate a preliminary diagnosis.
3. **Incoming Case:** n8n sends the diagnostic metadata and image URL to the Expert Portal via `POST /api/cases`.
4. **Expert Review:** Olam experts use this Dashboard to review the images, compare the AI's preliminary diagnosis, and compose a final recommendation.
5. **WhatsApp Delivery:** When the expert clicks **Send to Farmer**, the portal triggers an outgoing webhook to n8n, which pushes the expert's feedback directly back to the farmer's WhatsApp chat.

---

## ⚡ Quick Start

Follow these steps to run the portal locally immediately.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

*No database setup is required to run in development!* The app automatically initializes a local JSON file database (`src/data/db.json`) pre-populated with realistic crop diagnostics (Cacao Black Pod, Maize Rust, Tomato Late Blight, etc.) and simulates outbound webhooks.

---

## ⚙️ Integrations & Database Configuration

To connect the application to your production n8n workflow and Google Sheets database, configure environment variables by creating a `.env.local` file (template provided in `.env.example`).

### 1. Google Sheets Database Setup (No SQL Required)
This portal is built to use **Google Sheets** as its primary storage engine for the Proof of Concept, allowing easy data viewing without complex database infrastructure.

1. Create a new Google Sheet.
2. Share the sheet with write access to your Google Service Account email (e.g., `agri-portal@your-project.iam.gserviceaccount.com`).
3. Set the following environment variables in `.env.local`:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_from_url
   GOOGLE_SERVICE_ACCOUNT_EMAIL=agri-portal@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyWithNewlinesEscaped\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_RANGE=Sheet1!A:K
   ```
4. Define the following headers in row 1 of your sheet:
   * **Col A:** `caseId`
   * **Col B:** `phoneNo`
   * **Col C:** `imageUrl`
   * **Col D:** `aiResponseFarmer`
   * **Col E:** `aiResponseDashboard`
   * **Col F:** `status`
   * **Col G:** `createdAt`
   * **Col H:** `expertDiagnosis`
   * **Col I:** `expertRecommendation`
   * **Col J:** `messageToFarmer`
   * **Col K:** `resolvedAt`

*If these environment variables are absent, the application automatically falls back to reading/writing to `src/data/db.json` locally and keeping state in memory in serverless deployments.*

### 2. Outgoing n8n Webhook Setup
When an expert clicks **Send to Farmer**, the portal calls the `N8N_WEBHOOK_URL` webhook.

Set the webhook URL in `.env.local`:
```env
N8N_WEBHOOK_URL=https://primary-production.shared-n8n.your-domain.com/webhook/c545-abc-123-xyz
```

#### Request Payload Schema:
```json
{
  "caseId": "CASE_001",
  "phoneNo": "917085221146",
  "message": "Expert diagnosis and recommendations text..."
}
```

---

## 📂 Project Structure

```
├── public/                 # Static assets
└── src/
    ├── app/                # Next.js 15 App Router pages & APIs
    │   ├── api/            # API Route endpoints
    │   │   ├── cases/
    │   │   │   ├── route.ts          # GET list, POST new case
    │   │   │   └── [id]/
    │   │   │       ├── route.ts      # GET single case
    │   │   │       └── resolve/
    │   │   │           └── route.ts  # POST resolve case & trigger webhook
    │   │   └── stats/
    │   │       └── route.ts          # GET charts & dynamic metrics
    │   ├── cases/
    │   │   ├── page.tsx              # Case queue list (filtering, searching)
    │   │   └── [id]/
    │   │       └── page.tsx          # Case review & response editor
    │   ├── layout.tsx      # Core shell structure (navigation sidebar)
    │   ├── page.tsx        # Dashboard landing page (KPI cards, recharts)
    │   └── globals.css     # Global styles & Tailwind v4 theme definitions
    ├── components/         # Reusable presentation layer
    │   ├── ui/             # Tailwind ShadCN style modular forms & layouts
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── table.tsx
    │   │   └── textarea.tsx
    │   ├── providers.tsx   # React Query client state wrapper
    │   └── sidebar.tsx     # Navigation & System connection indicators
    ├── data/
    │   └── db.json         # Mock data database (fallback storage)
    └── lib/
        ├── storage.ts      # Storage service (JSON file & Google Sheets API layer)
        └── types.ts        # TypeScript models and structures
```

---

