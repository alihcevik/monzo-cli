const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  amountMinor: number,
  currency: string,
): string {
  let fmt = currencyFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    });
    currencyFormatters.set(currency, fmt);
  }
  return fmt.format(amountMinor / 100);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function printTable(
  headers: string[],
  rows: string[][],
): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );

  const sep = widths.map((w) => "─".repeat(w + 2)).join("┼");
  const fmtRow = (cells: string[]) =>
    cells.map((c, i) => ` ${c.padEnd(widths[i])} `).join("│");

  console.log(fmtRow(headers));
  console.log(sep);
  for (const row of rows) {
    console.log(fmtRow(row));
  }
}
