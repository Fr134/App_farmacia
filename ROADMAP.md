# ROADMAP.md — PharmaControl Development Roadmap

This file defines the development plan for PharmaControl. Claude Code should execute each phase in order, completing all tasks within a phase before moving to the next. Read CLAUDE.md for all project rules and conventions.

---

## Phase 1 — Channel Breakdown & Extended Data

### Goal
The CSV contains rich data about sales channels (Ricetta/Libera/Fidelity) and VAT breakdown per sector that the current dashboard ignores. Surface this data in a new dashboard section.

### Tasks

#### 1.1 — New Dashboard Section: "Canali di Vendita"
Position: below the MarginBySectorChart, above the SectorList.

Create component `frontend/src/components/dashboard/ChannelBreakdown.tsx`:
- **3 KPI cards in a row** showing totals for each channel:
  - "Ricetta" — total valore_ricetta, total pezzi_ricetta, % of total revenue
  - "Vendita Libera" — total valore_libera, total pezzi_libera, % of total revenue
  - "Fidelity" — total valore_fidelity, total pezzi_fidelity, % of total revenue
- **Stacked bar chart** (horizontal) showing for each of the Top 5 sectors: how revenue splits across Ricetta / Libera / Fidelity
  - Colors: Ricetta = accent-blue, Libera = accent-purple, Fidelity = accent-cyan
- **Donut chart** showing overall channel distribution (% of total revenue from each channel)

#### 1.2 — New Dashboard Section: "Analisi IVA"
Position: below Channel Breakdown.

Create component `frontend/src/components/dashboard/VATAnalysis.tsx`:
- **2 KPI cards** side by side:
  - "Imponibile Totale" — sum of all sector imponibile values
  - "IVA Totale" — sum of all sector iva values, with subtitle showing effective VAT rate (iva/imponibile * 100)
- **Horizontal bar chart** showing IVA amount per sector (top 8 sectors only), sorted descending

#### 1.3 — Expand SectorList Details
When a sector row is expanded, add the channel data to the mini-stats grid:
- Add: Pezzi Ricetta, Pezzi Libera, Pezzi Fidelity, Valore Ricetta, Valore Libera, Valore Fidelity, Imponibile, IVA
- Organize in two rows of 8 stats: first row = current stats, second row = channel + fiscal stats

#### 1.4 — Backend: Ensure All Fields Are Returned
Verify that the GET /api/reports/:id and GET /api/reports/latest endpoints return ALL SectorData fields including channel breakdown and VAT fields. If any fields are missing from the serialization, fix it.

---

## Phase 2 — Period Filters & Comparison

### Goal
Allow users to compare two periods side by side, see aggregated multi-month data, and understand trends.

### Tasks

#### 2.1 — Backend: Aggregation Endpoint
Create new endpoint in `backend/src/routes/reports.ts`:

**GET /api/reports/aggregate?from=2025-06&to=2026-01**
- Accepts `from` and `to` query params (format: YYYY-MM)
- Fetches all reports in the date range
- Aggregates: sums all totals, sums all sector data by tipologia
- Returns same shape as a single ReportWithSectors but with aggregated data
- If no reports in range → 404

#### 2.2 — Frontend: Enhanced Period Selector
Replace the simple PeriodSelector with `frontend/src/components/dashboard/PeriodFilter.tsx`:

Two modes (toggle button):
- **Singolo**: dropdown to pick one month (current behavior)
- **Confronto**: two dropdowns — "Periodo corrente" and "Periodo precedente"
- **Range**: date range picker (from month/year to month/year) for aggregated view

The selected mode determines what data is fetched and how the dashboard renders.

#### 2.3 — Frontend: Comparison Mode for KPI Cards
Create component `frontend/src/components/dashboard/KPICardWithDelta.tsx`:
- Extends KPICard with an optional `previousValue` prop
- When previousValue is provided, shows a delta row below the value:
  - Green up arrow + "↑ 12,5%" if current > previous
  - Red down arrow + "↓ 8,3%" if current < previous  
  - Gray dash "— 0,0%" if equal
- Delta calculated as: ((current - previous) / |previous|) * 100
- Small text showing the previous value: "vs €180.234,00"

#### 2.4 — Frontend: Comparison Mode for Charts
When in comparison mode:
- Top5CostMarginChart: show current period bars solid, previous period bars with 30% opacity behind them
- MarginBySectorChart: show two bars per sector (current solid, previous dashed outline), with delta annotation
- DistributionChart: show two concentric donuts (inner = previous, outer = current)

#### 2.5 — Frontend: Dashboard State Management
Update DashboardPage.tsx to handle three view modes:
- Single period: current behavior
- Comparison: fetch two reports, pass both to all components
- Range: fetch aggregated data, display as single period

Use URL search params to persist the selected mode and periods: `/dashboard?mode=compare&current=clxxx&previous=clyyy`

---

## Phase 3 — Intelligent Alert System

### Goal
Create an automated alert engine that analyzes report data and generates actionable insights. This is the killer feature — it must be visually impressive and genuinely useful.

### Tasks

#### 3.1 — Backend: Alert Engine
Create `backend/src/services/alert-engine.ts`:

The engine analyzes a report (optionally with a comparison report) and generates alerts.

**Alert interface:**
```typescript
interface Alert {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  category: "margin" | "revenue" | "cost" | "volume" | "channel" | "concentration" | "anomaly";
  title: string;       // Short Italian title, e.g. "Margine in calo"
  message: string;     // Detailed Italian explanation
  sector?: string;     // Related sector if applicable
  metric: string;      // The metric name involved
  currentValue: number;
  previousValue?: number;
  delta?: number;      // % change
  threshold?: number;  // The threshold that was crossed
}
```

**Alert rules to implement (all messages in Italian):**

**CRITICAL (🔴) alerts:**
1. **Negative margin sector**: Any sector with margine_pct < 0%.
   - Title: "Margine negativo: {sector}"
   - Message: "Il settore {sector} ha un margine del {margine_pct}%. Il costo del venduto (€{costo}) supera il venduto (€{valore}). Verificare i prezzi di vendita e i costi di acquisto."
2. **Overall margin below 25%**: If total_margin_pct < 25%.
   - Title: "Margine complessivo sotto soglia"
   - Message: "Il margine complessivo è al {pct}%, sotto la soglia di sicurezza del 25%. Azione necessaria su pricing o costi."
3. **Revenue drop > 15%** (vs previous period, if available):
   - Title: "Fatturato in forte calo"
   - Message: "Il fatturato è calato del {delta}% rispetto al periodo precedente (da €{prev} a €{curr}). Verificare cause: stagionalità, concorrenza, stock."

**WARNING (🟡) alerts:**
4. **Sector margin below average**: Any sector with margine_pct < (total_margin_pct - 10 points).
   - Title: "Margine sotto media: {sector}"
   - Message: "Il settore {sector} ha un margine del {pct}% contro una media del {avg}%. Potrebbe essere necessario rinegoziare i prezzi di acquisto."
5. **Revenue drop 5-15%** (vs previous period):
   - Title: "Vendite in calo: {sector}"
   - Message: "Il settore {sector} ha registrato un calo del {delta}% nelle vendite rispetto al periodo precedente."
6. **COGS growing faster than revenue** (vs previous period): If cost delta % > revenue delta %.
   - Title: "Costi in crescita superiore ai ricavi"
   - Message: "I costi del venduto sono cresciuti del {cost_delta}% mentre il fatturato solo del {rev_delta}%. Il margine si sta erodendo."
7. **Concentration risk**: Any single sector > 45% of total revenue.
   - Title: "Concentrazione elevata: {sector}"
   - Message: "Il settore {sector} rappresenta il {pct}% del fatturato totale. Un'alta concentrazione aumenta il rischio: diversificare le fonti di ricavo."
8. **Average ticket drop > 5%** (vs previous period):
   - Title: "Scontrino medio in calo"
   - Message: "Lo scontrino medio è sceso da €{prev} a €{curr} ({delta}%). Potrebbe indicare un cambio nel mix di prodotti venduti."
9. **Anomalous markup**: Any sector with ricarico_pct > 150% or < 10% (excluding Servizi and Codice di aggancio).
   - Title: "Ricarico anomalo: {sector}"
   - Message: "Il settore {sector} ha un ricarico del {pct}%, significativamente fuori norma. Verificare correttezza dati o politica prezzi."

**INFO (ℹ️) alerts:**
10. **Sector revenue growing > 10%** (vs previous period):
    - Title: "Settore in crescita: {sector}"
    - Message: "Il settore {sector} è cresciuto del {delta}% nelle vendite. Valutare se aumentare lo stock e la varietà dell'assortimento."
11. **Channel shift**: If Ricetta % changes > 5 points vs previous period.
    - Title: "Cambio nel mix canali"
    - Message: "La quota di vendite su Ricetta è passata dal {prev}% al {curr}%. Monitorare l'impatto sulle marginalità."
12. **Pieces vs value divergence**: If a sector's pezzi_pct is significantly different (>10 points) from valore_pct.
    - Title: "Divergenza volume/valore: {sector}"
    - Message: "Il settore {sector} rappresenta il {pezzi_pct}% dei pezzi venduti ma solo il {valore_pct}% del fatturato. Valore medio per pezzo basso."

**POSITIVE (🟢) alerts:**
13. **Margin above 40% on significant sector**: Any sector with margine_pct > 40% AND valore > 5% of total.
    - Title: "Ottima marginalità: {sector}"
    - Message: "Il settore {sector} mantiene un margine del {pct}% con un fatturato di €{valore}. Continuare a investire su questa categoria."
14. **Revenue growth > 10%** (overall, vs previous period):
    - Title: "Fatturato in crescita"
    - Message: "Il fatturato è cresciuto del {delta}% rispetto al periodo precedente. Trend positivo."
15. **Improved margin** (vs previous period): If total_margin_pct improved by > 2 points.
    - Title: "Margine in miglioramento"
    - Message: "Il margine complessivo è migliorato dal {prev}% al {curr}% (+{delta} punti). La strategia di pricing sta funzionando."

#### 3.2 — Backend: Alert Endpoint
Create new endpoint:

**GET /api/reports/:id/alerts?compare_to=:prevId**
- Runs the alert engine on the specified report
- If compare_to is provided, includes comparison-based alerts
- Returns sorted by severity (critical first, then warning, info, positive)
- Response: { success: true, data: { alerts: Alert[], summary: { critical: number, warning: number, info: number, positive: number } } }

#### 3.3 — Frontend: Alert Panel Component
Create `frontend/src/components/dashboard/AlertPanel.tsx`:

**Design specifications — this must be visually impressive:**

- Full-width section positioned at the TOP of the dashboard, right after the header and before the KPI cards
- Title: "Insights & Alert" with a pulsing dot indicator (red if critical alerts, yellow if warnings, green if only positive)

**Summary bar:**
- Horizontal bar with 4 counters: 🔴 {n} Critici · 🟡 {n} Attenzione · ℹ️ {n} Info · 🟢 {n} Positivi
- Clicking a counter filters the alerts to that severity

**Alert cards:**
- Each alert is a card with left colored border (4px):
  - Critical: red (#EF4444) with pulsing red glow animation
  - Warning: amber (#F59E0B)
  - Info: blue (#3B82F6)
  - Positive: green (#10B981) with subtle green glow
- Card content:
  - Top row: severity icon + title (bold) + category badge (small pill)
  - Body: message text (text-muted, 14px)
  - Bottom row: related sector (if applicable) + metric value + delta badge (if comparison)
- Cards animate in with stagger effect on load (each card slides up 50ms after the previous)

**Interaction:**
- Default: show max 4 alerts (prioritized by severity)
- "Mostra tutti" button to expand and show all
- Clicking an alert that references a sector scrolls down to that sector in the SectorList and highlights it
- Collapsible: user can minimize the entire alert panel to just the summary bar

**Empty state (no alerts):**
- Friendly message: "Tutto nella norma! Nessuna anomalia rilevata." with a green checkmark

#### 3.4 — Frontend: Alert Hook
Create `frontend/src/hooks/useAlerts.ts`:
- Fetches alerts from /api/reports/:id/alerts
- If comparison period is selected, passes compare_to param
- Returns { alerts, summary, loading, error }

#### 3.5 — Update DashboardPage
- Import and render AlertPanel at the top of the dashboard (after header, before KPI cards)
- Pass the current report ID and optional comparison report ID
- Alert panel should render even when there's only one period (comparison alerts just won't appear)

---

## Phase 4 — Advanced Visualizations

### Goal
Add power-user visualizations for deeper data analysis.

### Tasks

#### 4.1 — Treemap Chart
Create `frontend/src/components/dashboard/RevenueTreemap.tsx`:
- Recharts Treemap showing all sectors sized by revenue
- Color intensity based on margin % (darker green = higher margin, red = negative)
- Tooltip showing: sector name, revenue, margin, margin %, pieces
- Position: new tab/toggle alongside the DistributionChart (user picks Donut or Treemap view)

#### 4.2 — Waterfall Chart
Create `frontend/src/components/dashboard/MarginWaterfall.tsx`:
- Shows how the total margin is built up sector by sector
- Starting from 0, each sector adds (or subtracts for negative margins) to the running total
- Positive contributions in green, negative in red
- Final bar shows the total margin
- Position: below the Channel Breakdown section

#### 4.3 — Full Data Table
Create `frontend/src/components/dashboard/DetailTable.tsx`:
- Complete sortable table with ALL sectors and ALL columns
- Columns: Tipologia, Valore, %, Costo, Margine, Margine %, Ricarico %, Pezzi, Vendite, Pezzi Ricetta, Pezzi Libera, Pezzi Fidelity
- Click column header to sort (asc/desc toggle)
- Highlight rows where margin is negative (subtle red background)
- Sticky header on scroll
- Position: at the very bottom, below SectorList, in a collapsible "Tabella Dettagliata" section

---

## Phase 5 — Polish & Export

### Goal
Final polish for a production-ready feel.

### Tasks

#### 5.1 — PDF Export
Add "Esporta PDF" button in dashboard header (Download icon from lucide-react).
- Use html2canvas to capture the dashboard sections
- Use jspdf to create A4 landscape PDF
- Page 1: Header with "PharmaControl — Report {Mese} {Anno}" + KPI cards
- Page 2: Charts
- Page 3: Alert summary + sector table
- Install html2canvas and jspdf as frontend dependencies

#### 5.2 — Loading Animations
- Skeleton loaders for KPI cards (pulsing gray rectangles matching card layout)
- Chart containers show subtle shimmer effect while loading
- Alert panel shows 3 skeleton alert cards while loading
- Numbers animate from 0 to final value on first render (count-up animation, 800ms)

#### 5.3 — Enhanced Chart Tooltips
- All chart tooltips should have consistent dark style matching the design system
- Add mini sparkline in tooltips where comparison data is available
- Tooltip on sector bars should show: name, value, %, margin, margin %, rank

#### 5.4 — Keyboard Navigation
- Arrow keys to navigate sectors in SectorList
- Enter to expand/collapse
- Escape to close expanded sector
- Tab navigation for all interactive elements

#### 5.5 — Mobile Optimization
- Verify all charts render properly on 375px width
- Swipeable chart carousel on mobile (instead of side-by-side grid)
- Bottom navigation bar on mobile (instead of sidebar)
- Touch-friendly expand/collapse on sector list

---

## Execution Notes for Claude Code

### General Rules
- Always read CLAUDE.md before starting any task
- Complete ALL tasks in a phase before moving to the next phase
- After each phase: run `npm run build` in both backend and frontend to verify no errors
- Test the feature manually in the browser after implementing
- All user-facing text must be in Italian
- All numbers must be formatted in Italian style (dot thousands, comma decimals)
- Never break existing functionality when adding new features
- Keep components focused and small — split large components into sub-components
- Use the existing design system (colors, fonts, card styles) for all new UI elements

### Testing Checklist Per Phase
After completing each phase, verify:
1. `cd backend && npm run build` — no TypeScript errors
2. `cd frontend && npm run build` — no TypeScript errors, no build warnings
3. Backend API endpoints respond correctly (test with curl)
4. Frontend renders correctly at 1440px, 1024px, 768px, 375px
5. No console errors in browser DevTools
6. New features work with the sample CSV data (CSV_ESEMPIO_gennaio_26.csv)

### Phase Dependencies
- Phase 1: No dependencies, can start immediately
- Phase 2: No hard dependencies, but comparison features in Phase 3 alerts need Phase 2 comparison data
- Phase 3: Comparison alerts need Phase 2 comparison endpoint. Single-period alerts work independently.
- Phase 4: Independent, can run in parallel with Phase 3
- Phase 5: Needs all other phases complete for full PDF export
