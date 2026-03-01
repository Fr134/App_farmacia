const currencyFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(n: number): string {
  return `\u20AC${currencyFormatter.format(n)}`;
}

export function formatPercent(n: number): string {
  return `${percentFormatter.format(n)}%`;
}

export function formatInteger(n: number): string {
  return integerFormatter.format(n);
}

export function formatChange(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(n)}%`;
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const value = abs / 1_000_000;
    return `${sign}${value.toFixed(1).replace(".", ",")}M`;
  }
  if (abs >= 1_000) {
    const value = abs / 1_000;
    return `${sign}${value.toFixed(1).replace(".", ",")}k`;
  }
  return `${sign}${currencyFormatter.format(abs)}`;
}
