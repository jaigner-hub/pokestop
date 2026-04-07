export function parsePrice(text: string | null | undefined): number | null {
  if (text == null || text === '') return null;
  // Match the first occurrence of a price: optional $, digits with optional comma separators, optional decimal
  const match = text.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return null;
  return num;
}
