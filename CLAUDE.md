# CLAUDE.md — Development Rules for PharmaControl

## 🎯 Project
**PharmaControl** — Management control web app for pharmacies.
Stack: Next.js 14 (App Router) + Prisma ORM + PostgreSQL (Railway) + Tailwind CSS + Recharts.

---

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router (`/app` directory)
- **Language**: TypeScript strict mode
- **ORM**: Prisma with PostgreSQL
- **Database**: PostgreSQL on Railway (free tier)
- **Styling**: Tailwind CSS with custom dark theme
- **Charts**: Recharts
- **Deploy**: Railway
- **Fonts**: JetBrains Mono (numbers) + Inter (UI)

### Directory Structure
```
pharma-control/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with fonts + theme
│   │   ├── page.tsx                # Redirect to /dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main dashboard page
│   │   ├── upload/
│   │   │   └── page.tsx            # CSV upload page
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts        # Upload + CSV validation API
│   │       ├── reports/
│   │       │   └── route.ts        # Read reports API
│   │       └── reports/[id]/
│   │           └── route.ts        # Single report API
│   ├── components/
│   │   ├── ui/                     # Base components (Card, Button, etc.)
│   │   ├── dashboard/              # Dashboard components (KPICard, Charts)
│   │   ├── upload/                 # Upload components (Dropzone, Validator)
│   │   └── layout/                 # Navbar, Sidebar
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── csv-parser.ts           # CSV parser with validation
│   │   ├── csv-validator.ts        # Validation rules
│   │   ├── formatters.ts           # Italian number formatting (€, %, etc.)
│   │   └── constants.ts            # Colors, valid product types, etc.
│   └── types/
│       └── index.ts                # TypeScript types
├── public/
├── .env                            # DATABASE_URL
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 📐 Code Rules

### General
- **Code language**: English for variables, functions, technical comments
- **UI language**: Italian for labels, tooltips, user-facing messages
- **Number formatting**: ALWAYS Italian format (dot as thousands separator, comma as decimal). E.g.: `€196.508,07` — NEVER `€196,508.07`
- **Percentages**: with comma and % symbol. E.g.: `30,10%`
- **Currency**: € symbol before number. E.g.: `€53.077,35`

### TypeScript
- Strict mode enabled
- No `any` — use explicit types
- Interfaces for data shapes, Types for unions
- Enum for pharmaceutical product types

### React Components
- ONLY functional components with hooks
- Server Components where possible (data fetching)
- Client Components ONLY where interactivity is needed (`"use client"`)
- Props typed with dedicated interfaces
- Component names: PascalCase
- File names: kebab-case.tsx

### Styling & Design
- **Theme**: Dark mode ONLY — no light mode
- **Color palette** (defined in tailwind.config.ts):
  ```
  bg-primary:    #0B0F19  (main background)
  bg-card:       #111827  (cards and containers)
  border-card:   #1E293B  (borders)
  accent-blue:   #3B82F6  (primary accent)
  accent-green:  #10B981  (positive, margin)
  accent-red:    #EF4444  (negative, losses)
  accent-amber:  #F59E0B  (warning, cost)
  accent-purple: #8B5CF6  (special metrics)
  accent-cyan:   #06B6D4  (secondary)
  text-primary:  #F1F5F9  (main text)
  text-muted:    #94A3B8  (labels)
  text-dim:      #64748B  (secondary text)
  ```
- **Border radius**: 16px for cards, 8px for buttons/inputs
- **Card style**: subtle gradient + 1px border + 3px accent bar on top
- **Number font**: JetBrains Mono (monospace)
- **UI font**: Inter
- **NO emoji in KPI cards** — use Lucide React icons

### Database & Prisma
- Prisma client as singleton (`lib/prisma.ts`)
- Migrations managed with `prisma migrate dev`
- Optional seed for demo data
- Table names: snake_case
- Column names: snake_case
- Explicit relations with `@relation`

### API Routes
- Input validation ALWAYS server-side
- JSON responses with consistent structure: `{ success: boolean, data?: T, error?: string }`
- Error handling with try/catch and appropriate status codes
- No rate limiting needed at this stage

---

## 📊 Data Model

### CSV Input Format
The file is exported from the pharmacy management software. Characteristics:
- **Delimiter**: semicolon (`;`)
- **Encoding**: Latin-1 (ISO-8859-1) — MUST be handled
- **Number format**: Italian (dot for thousands, comma for decimals). E.g.: `78.754,70`
- **Percentage format**: comma decimal + `%`. E.g.: `40,08%`
- **Line ending**: CRLF (`\r\n`)
- **Last data row**: `TOTALE VENDITE DEL PERIODO` — rows after this MUST be ignored
- **Header row**: first row with column names
- **Empty fields**: possible, meaning 0 or N/A

### CSV Columns (29 columns, index 0-28)
```
0:  Tipologia           — Product category name
1:  Valore              — Gross revenue (VAT included) in €
2:  % (Valore)          — % of total revenue
3:  Media Pezzi         — Average pieces per sale
4:  Pezzi               — Total pieces sold
5:  % (Pezzi)           — % of total pieces
6:  N. Vendite          — Number of transactions
7:  % (Vendite)         — % of total sales
8:  Costo Venduto       — Cost of goods sold in €
9:  Margine             — Gross margin in € (Valore - Costo Venduto)
10: % (Margine)         — % of this sector's margin on total margin
11: Margine %           — Margin % on this category (Margin/Revenue)
12: Ricarico %          — Markup % on this category (Margin/Cost)
13: Pezzi Ricetta       — Pieces sold on prescription
14: % (Pezzi Ricetta)
15: Pezzi Libera        — Over-the-counter pieces
16: % (Pezzi Libera)
17: Pezzi Fidelity      — Loyalty card pieces
18: % (Pezzi Fidelity)
19: Valore Ricetta      — Prescription revenue
20: % (Valore Ricetta)
21: Valore Libera       — OTC revenue
22: % (Valore Libera)
23: Valore Fidelity     — Loyalty revenue
24: % (Valore Fidelity)
25: Imponibile          — Taxable amount (net of VAT)
26: % (Imponibile)
27: IVA                 — VAT amount
28: % (IVA)
```

### Valid Product Types (Italian names — keep as-is)
```
Farmaco etico, Parafarmaco uso umano, Dispositivo medico, 
Farmaco generico, Farmaco da banco, Alimento fini medici speciali,
Servizi, Preparazione magistrale, Farmaco veterinario,
Omeopatico uso umano, Nessuna tipologia, Parafarmaco erboristico,
Parafarmaco uso veterinario, Presidio medico chirurgico,
Materia prima, Medicinale veter.prefabbricato, Codice di aggancio
```

### Prisma Schema
```prisma
model Report {
  id              String    @id @default(cuid())
  filename        String
  file_hash       String    @unique    // SHA-256 for dedup
  period_month    Int                  // 1-12
  period_year     Int                  // e.g.: 2026
  uploaded_at     DateTime  @default(now())
  
  // Aggregated totals
  total_revenue_gross  Decimal  @db.Decimal(12,2)  // Gross revenue VAT included
  total_revenue_net    Decimal  @db.Decimal(12,2)  // Net revenue (taxable)
  total_iva            Decimal  @db.Decimal(12,2)
  total_cost           Decimal  @db.Decimal(12,2)  // Cost of goods sold
  total_margin         Decimal  @db.Decimal(12,2)  // Margin
  total_margin_pct     Decimal  @db.Decimal(5,2)   // Margin %
  total_markup_pct     Decimal  @db.Decimal(5,2)   // Markup %
  total_pieces         Int
  total_sales          Int
  
  sectors  SectorData[]
  
  @@unique([period_month, period_year])
}

model SectorData {
  id              String  @id @default(cuid())
  report_id       String
  report          Report  @relation(fields: [report_id], references: [id], onDelete: Cascade)
  
  tipologia       String
  valore          Decimal  @db.Decimal(12,2)
  valore_pct      Decimal? @db.Decimal(5,2)
  media_pezzi     Decimal? @db.Decimal(8,2)
  pezzi           Int      @default(0)
  pezzi_pct       Decimal? @db.Decimal(5,2)
  n_vendite       Int      @default(0)
  vendite_pct     Decimal? @db.Decimal(5,2)
  costo_venduto   Decimal? @db.Decimal(12,2)
  margine         Decimal? @db.Decimal(12,2)
  margine_tot_pct Decimal? @db.Decimal(5,2)   // % of total margin
  margine_pct     Decimal? @db.Decimal(6,2)   // Margin % (can be negative)
  ricarico_pct    Decimal? @db.Decimal(6,2)   // Markup %
  
  // Channel breakdown
  pezzi_ricetta       Int?      @default(0)
  pezzi_ricetta_pct   Decimal?  @db.Decimal(5,2)
  pezzi_libera        Int?      @default(0)
  pezzi_libera_pct    Decimal?  @db.Decimal(5,2)
  pezzi_fidelity      Int?      @default(0)
  pezzi_fidelity_pct  Decimal?  @db.Decimal(5,2)
  valore_ricetta      Decimal?  @db.Decimal(12,2)
  valore_ricetta_pct  Decimal?  @db.Decimal(5,2)
  valore_libera       Decimal?  @db.Decimal(12,2)
  valore_libera_pct   Decimal?  @db.Decimal(5,2)
  valore_fidelity     Decimal?  @db.Decimal(12,2)
  valore_fidelity_pct Decimal?  @db.Decimal(5,2)
  imponibile          Decimal?  @db.Decimal(12,2)
  imponibile_pct      Decimal?  @db.Decimal(5,2)
  iva                 Decimal?  @db.Decimal(12,2)
  iva_pct             Decimal?  @db.Decimal(5,2)
  
  @@index([report_id])
}
```

---

## ✅ CSV Validation

### Validation Rules (csv-validator.ts)

1. **File structure**:
   - File MUST have `.csv` extension
   - Delimiter MUST be `;`
   - MUST contain exactly 29 columns
   - First row MUST be the header with `Tipologia` as first column
   - MUST contain the row `TOTALE VENDITE DEL PERIODO`
   - Encoding: try Latin-1 if UTF-8 fails

2. **Deduplication**:
   - Compute SHA-256 hash of file content
   - If hash already exists in DB → reject with "File already uploaded" error
   - Also check month+year combination: only one report per period

3. **Data validation**:
   - Every monetary value must be parseable (Italian format: `78.754,70`)
   - TOTAL must be consistent: sum of sector values must be ≈ total (tolerance ±1%)
   - No sector (except "Codice di aggancio") should have Value > Total
   - Margin % must be between -200% and +300% (reasonable pharmacy range)
   - N. Vendite and Pezzi must be non-negative integers (except "Codice di aggancio")

4. **Italian number parsing** (`lib/csv-parser.ts`):
   ```typescript
   function parseItalianNumber(value: string): number | null {
     if (!value || value.trim() === '') return null;
     const cleaned = value.trim()
       .replace(/\./g, '')      // remove thousands separator
       .replace(',', '.')       // comma → decimal point
       .replace('%', '');       // remove % symbol
     const num = parseFloat(cleaned);
     return isNaN(num) ? null : num;
   }
   ```

5. **Period extraction**:
   - Period month/year extracted from FILENAME
   - Expected pattern: `*_gennaio_26.csv`, `*_febbraio_26.csv`, etc.
   - Italian month names → number mapping
   - 2-digit year → 4-digit (26 → 2026)
   - If not parseable from filename, ask the user

---

## 🎨 Dashboard — UI Specifications

### Layout
The dashboard reproduces EXACTLY the approved artifact design:

#### Row 1 — 4 KPI Cards (4-column grid):
1. **Transato Lordo** (Gross Revenue) — `total_revenue_gross` (VAT included)
2. **Fatturato Netto** (Net Revenue) — `total_revenue_net` (subtitle: VAT amount)
3. **Venduto** (Sales) — `total_revenue_gross` (subtitle: pieces + sales count)
4. **Costo del Venduto** (COGS) — `total_cost` (subtitle: % of gross revenue)

#### Row 2 — 3 KPI Cards (3-column grid):
5. **Margine Lordo** (Gross Margin) — `total_margin` (subtitle: margin % on revenue)
6. **Margine %** (Margin %) — `total_margin_pct` (subtitle: markup %)
7. **Scontrino Medio** (Avg. Ticket) — `total_revenue_gross / total_sales` (subtitle: pieces/sale)

#### Charts Section (2-column grid):
- **Left**: Stacked horizontal bar chart "Top 5 · Costo vs Margine"
- **Right**: Donut chart "Distribuzione Venduto/Margine" with toggle

#### Full-Width Chart:
- **Margine % per Settore** — Horizontal bar chart with traffic light colors (green >40%, yellow 25-40%, red <25%)

#### Sector List:
- All sectors with proportional bars
- Click to expand → shows 8 mini-stats (cost, margin, markup, pieces, sales, etc.)

### Period Selector
- Dropdown to select month/year to display
- Only shows periods with uploaded data

---

## 🚫 Do NOT

- Do NOT use light mode or light/dark toggle
- Do NOT use fonts other than Inter and JetBrains Mono
- Do NOT format numbers in English format (NEVER comma as thousands separator)
- Do NOT use emoji in cards — use Lucide icons
- Do NOT create APIs without input validation
- Do NOT save CSV files to disk — only parsed data goes to DB
- Do NOT allow duplicate uploads of the same file
- Do NOT ignore Latin-1 encoding of CSV files
- Do NOT create class components — only functional
- Do NOT use `getServerSideProps` — use App Router (Server Components + API Routes)
- Do NOT install unnecessary libraries — keep it lean

---

## 📦 Allowed Dependencies
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "@prisma/client": "^5",
    "recharts": "^2",
    "lucide-react": "latest",
    "iconv-lite": "latest"
  },
  "devDependencies": {
    "prisma": "^5",
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/react": "^18",
    "@types/node": "^20"
  }
}
```
