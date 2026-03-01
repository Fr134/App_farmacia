export function parseItalianNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const cleaned = value
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("%", "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseItalianInteger(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const cleaned = value.trim().replace(/\./g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}
