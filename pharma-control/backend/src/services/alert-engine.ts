import type {
  Alert,
  AlertResponse,
  ReportWithSectors,
  SerializedSectorData,
} from "../types";

const EXCLUDED_SECTORS = ["Servizi", "Codice di aggancio"];

let alertCounter = 0;
function nextId(): string {
  return `alert-${++alertCounter}`;
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace(".", ",");
}

function fmtCurrency(n: number): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `\u20AC${formatted}`;
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export function generateAlerts(
  report: ReportWithSectors,
  comparison?: ReportWithSectors | null
): AlertResponse {
  alertCounter = 0;
  const alerts: Alert[] = [];

  const compSectorMap = new Map<string, SerializedSectorData>();
  if (comparison) {
    for (const s of comparison.sectors) {
      compSectorMap.set(s.tipologia, s);
    }
  }

  // ─── CRITICAL ─────────────────────────────────────────────

  // 1. Negative margin sector
  for (const s of report.sectors) {
    if (s.marginePct !== null && s.marginePct < 0) {
      alerts.push({
        id: nextId(),
        severity: "critical",
        category: "margin",
        title: `Margine negativo: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} ha un margine del ${fmt(s.marginePct)}%. Il costo del venduto (${fmtCurrency(s.costoVenduto ?? 0)}) supera il venduto (${fmtCurrency(s.valore)}). Verificare i prezzi di vendita e i costi di acquisto.`,
        sector: s.tipologia,
        metric: "margine_pct",
        currentValue: s.marginePct,
        threshold: 0,
      });
    }
  }

  // 2. Overall margin below 25%
  if (report.totalMarginPct < 25) {
    alerts.push({
      id: nextId(),
      severity: "critical",
      category: "margin",
      title: "Margine complessivo sotto soglia",
      message: `Il margine complessivo \u00E8 al ${fmt(report.totalMarginPct)}%, sotto la soglia di sicurezza del 25%. Azione necessaria su pricing o costi.`,
      metric: "total_margin_pct",
      currentValue: report.totalMarginPct,
      threshold: 25,
    });
  }

  // 3. Revenue drop > 15% (vs previous)
  if (comparison) {
    const revDelta = pctChange(report.totalRevenueGross, comparison.totalRevenueGross);
    if (revDelta < -15) {
      alerts.push({
        id: nextId(),
        severity: "critical",
        category: "revenue",
        title: "Fatturato in forte calo",
        message: `Il fatturato \u00E8 calato del ${fmt(Math.abs(revDelta))}% rispetto al periodo precedente (da ${fmtCurrency(comparison.totalRevenueGross)} a ${fmtCurrency(report.totalRevenueGross)}). Verificare cause: stagionalit\u00E0, concorrenza, stock.`,
        metric: "total_revenue_gross",
        currentValue: report.totalRevenueGross,
        previousValue: comparison.totalRevenueGross,
        delta: revDelta,
        threshold: -15,
      });
    }
  }

  // ─── WARNING ──────────────────────────────────────────────

  // 4. Sector margin below average (margin_pct < total_margin_pct - 10)
  for (const s of report.sectors) {
    if (
      s.marginePct !== null &&
      s.marginePct >= 0 &&
      s.valore > 500 &&
      s.marginePct < report.totalMarginPct - 10
    ) {
      alerts.push({
        id: nextId(),
        severity: "warning",
        category: "margin",
        title: `Margine sotto media: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} ha un margine del ${fmt(s.marginePct)}% contro una media del ${fmt(report.totalMarginPct)}%. Potrebbe essere necessario rinegoziare i prezzi di acquisto.`,
        sector: s.tipologia,
        metric: "margine_pct",
        currentValue: s.marginePct,
        threshold: report.totalMarginPct - 10,
      });
    }
  }

  // 5. Sector revenue drop 5-15% (vs previous)
  if (comparison) {
    for (const s of report.sectors) {
      const prev = compSectorMap.get(s.tipologia);
      if (prev && prev.valore > 500) {
        const delta = pctChange(s.valore, prev.valore);
        if (delta >= -15 && delta < -5) {
          alerts.push({
            id: nextId(),
            severity: "warning",
            category: "revenue",
            title: `Vendite in calo: ${s.tipologia}`,
            message: `Il settore ${s.tipologia} ha registrato un calo del ${fmt(Math.abs(delta))}% nelle vendite rispetto al periodo precedente.`,
            sector: s.tipologia,
            metric: "valore",
            currentValue: s.valore,
            previousValue: prev.valore,
            delta,
          });
        }
      }
    }
  }

  // 6. COGS growing faster than revenue (vs previous)
  if (comparison) {
    const costDelta = pctChange(report.totalCost, comparison.totalCost);
    const revDelta = pctChange(report.totalRevenueGross, comparison.totalRevenueGross);
    if (costDelta > revDelta && costDelta > 0) {
      alerts.push({
        id: nextId(),
        severity: "warning",
        category: "cost",
        title: "Costi in crescita superiore ai ricavi",
        message: `I costi del venduto sono cresciuti del ${fmt(costDelta)}% mentre il fatturato solo del ${fmt(revDelta)}%. Il margine si sta erodendo.`,
        metric: "total_cost_vs_revenue",
        currentValue: costDelta,
        previousValue: revDelta,
        delta: costDelta - revDelta,
      });
    }
  }

  // 7. Concentration risk: single sector > 45% of total revenue
  for (const s of report.sectors) {
    if (s.valorePct !== null && s.valorePct > 45) {
      alerts.push({
        id: nextId(),
        severity: "warning",
        category: "concentration",
        title: `Concentrazione elevata: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} rappresenta il ${fmt(s.valorePct)}% del fatturato totale. Un'alta concentrazione aumenta il rischio: diversificare le fonti di ricavo.`,
        sector: s.tipologia,
        metric: "valore_pct",
        currentValue: s.valorePct,
        threshold: 45,
      });
    }
  }

  // 8. Average ticket drop > 5% (vs previous)
  if (comparison) {
    const currTicket = report.totalSales > 0 ? report.totalRevenueGross / report.totalSales : 0;
    const prevTicket = comparison.totalSales > 0 ? comparison.totalRevenueGross / comparison.totalSales : 0;
    if (prevTicket > 0) {
      const ticketDelta = pctChange(currTicket, prevTicket);
      if (ticketDelta < -5) {
        alerts.push({
          id: nextId(),
          severity: "warning",
          category: "volume",
          title: "Scontrino medio in calo",
          message: `Lo scontrino medio \u00E8 sceso da ${fmtCurrency(prevTicket)} a ${fmtCurrency(currTicket)} (${fmt(ticketDelta)}%). Potrebbe indicare un cambio nel mix di prodotti venduti.`,
          metric: "avg_ticket",
          currentValue: currTicket,
          previousValue: prevTicket,
          delta: ticketDelta,
          threshold: -5,
        });
      }
    }
  }

  // 9. Anomalous markup (ricarico_pct > 150% or < 10%, excl. Servizi/Codice di aggancio)
  for (const s of report.sectors) {
    if (EXCLUDED_SECTORS.includes(s.tipologia)) continue;
    if (s.ricaricoPct === null || s.valore < 500) continue;

    if (s.ricaricoPct > 150 || (s.ricaricoPct < 10 && s.ricaricoPct >= 0)) {
      alerts.push({
        id: nextId(),
        severity: "warning",
        category: "anomaly",
        title: `Ricarico anomalo: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} ha un ricarico del ${fmt(s.ricaricoPct)}%, significativamente fuori norma. Verificare correttezza dati o politica prezzi.`,
        sector: s.tipologia,
        metric: "ricarico_pct",
        currentValue: s.ricaricoPct,
      });
    }
  }

  // ─── INFO ─────────────────────────────────────────────────

  // 10. Sector revenue growing > 10% (vs previous)
  if (comparison) {
    for (const s of report.sectors) {
      const prev = compSectorMap.get(s.tipologia);
      if (prev && prev.valore > 500) {
        const delta = pctChange(s.valore, prev.valore);
        if (delta > 10) {
          alerts.push({
            id: nextId(),
            severity: "info",
            category: "revenue",
            title: `Settore in crescita: ${s.tipologia}`,
            message: `Il settore ${s.tipologia} \u00E8 cresciuto del ${fmt(delta)}% nelle vendite. Valutare se aumentare lo stock e la variet\u00E0 dell'assortimento.`,
            sector: s.tipologia,
            metric: "valore",
            currentValue: s.valore,
            previousValue: prev.valore,
            delta,
          });
        }
      }
    }
  }

  // 11. Channel shift: Ricetta % changes > 5 points (vs previous)
  if (comparison) {
    const currRicettaTotal = report.sectors.reduce((sum, s) => sum + (s.valoreRicetta ?? 0), 0);
    const currTotal = report.sectors.reduce((sum, s) => sum + s.valore, 0);
    const prevRicettaTotal = comparison.sectors.reduce((sum, s) => sum + (s.valoreRicetta ?? 0), 0);
    const prevTotal = comparison.sectors.reduce((sum, s) => sum + s.valore, 0);

    const currRicettaPct = currTotal > 0 ? (currRicettaTotal / currTotal) * 100 : 0;
    const prevRicettaPct = prevTotal > 0 ? (prevRicettaTotal / prevTotal) * 100 : 0;
    const shift = Math.abs(currRicettaPct - prevRicettaPct);

    if (shift > 5) {
      alerts.push({
        id: nextId(),
        severity: "info",
        category: "channel",
        title: "Cambio nel mix canali",
        message: `La quota di vendite su Ricetta \u00E8 passata dal ${fmt(prevRicettaPct)}% al ${fmt(currRicettaPct)}%. Monitorare l'impatto sulle marginalit\u00E0.`,
        metric: "ricetta_pct",
        currentValue: currRicettaPct,
        previousValue: prevRicettaPct,
        delta: currRicettaPct - prevRicettaPct,
      });
    }
  }

  // 12. Pieces vs value divergence (pezzi_pct vs valore_pct > 10 points)
  for (const s of report.sectors) {
    if (s.pezziPct === null || s.valorePct === null) continue;
    if (s.valore < 500) continue;
    const divergence = s.pezziPct - s.valorePct;
    if (divergence > 10) {
      alerts.push({
        id: nextId(),
        severity: "info",
        category: "volume",
        title: `Divergenza volume/valore: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} rappresenta il ${fmt(s.pezziPct)}% dei pezzi venduti ma solo il ${fmt(s.valorePct)}% del fatturato. Valore medio per pezzo basso.`,
        sector: s.tipologia,
        metric: "pezzi_pct_vs_valore_pct",
        currentValue: s.pezziPct,
        previousValue: s.valorePct,
        delta: divergence,
      });
    }
  }

  // ─── POSITIVE ─────────────────────────────────────────────

  // 13. Margin above 40% on significant sector (valore > 5% of total)
  for (const s of report.sectors) {
    if (
      s.marginePct !== null &&
      s.marginePct > 40 &&
      s.valorePct !== null &&
      s.valorePct > 5
    ) {
      alerts.push({
        id: nextId(),
        severity: "positive",
        category: "margin",
        title: `Ottima marginalit\u00E0: ${s.tipologia}`,
        message: `Il settore ${s.tipologia} mantiene un margine del ${fmt(s.marginePct)}% con un fatturato di ${fmtCurrency(s.valore)}. Continuare a investire su questa categoria.`,
        sector: s.tipologia,
        metric: "margine_pct",
        currentValue: s.marginePct,
        threshold: 40,
      });
    }
  }

  // 14. Revenue growth > 10% (overall, vs previous)
  if (comparison) {
    const revDelta = pctChange(report.totalRevenueGross, comparison.totalRevenueGross);
    if (revDelta > 10) {
      alerts.push({
        id: nextId(),
        severity: "positive",
        category: "revenue",
        title: "Fatturato in crescita",
        message: `Il fatturato \u00E8 cresciuto del ${fmt(revDelta)}% rispetto al periodo precedente. Trend positivo.`,
        metric: "total_revenue_gross",
        currentValue: report.totalRevenueGross,
        previousValue: comparison.totalRevenueGross,
        delta: revDelta,
      });
    }
  }

  // 15. Improved margin (total_margin_pct improved > 2 points, vs previous)
  if (comparison) {
    const marginDelta = report.totalMarginPct - comparison.totalMarginPct;
    if (marginDelta > 2) {
      alerts.push({
        id: nextId(),
        severity: "positive",
        category: "margin",
        title: "Margine in miglioramento",
        message: `Il margine complessivo \u00E8 migliorato dal ${fmt(comparison.totalMarginPct)}% al ${fmt(report.totalMarginPct)}% (+${fmt(marginDelta)} punti). La strategia di pricing sta funzionando.`,
        metric: "total_margin_pct",
        currentValue: report.totalMarginPct,
        previousValue: comparison.totalMarginPct,
        delta: marginDelta,
      });
    }
  }

  // ─── Sort by severity ─────────────────────────────────────

  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };

  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    positive: alerts.filter((a) => a.severity === "positive").length,
  };

  return { alerts, summary };
}
