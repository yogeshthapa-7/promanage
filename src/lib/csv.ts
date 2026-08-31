/**
 * Build a single CSV cell value following RFC 4180:
 * - wrap in double quotes if the value contains a comma, quote, newline or CR
 * - escape embedded double quotes by doubling them
 */
function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  // Add spaces for "breathing space" when opened in Excel
  const padded = `   ${str}   `;
  // Always wrap in quotes to preserve leading/trailing spaces in Excel
  return `"${padded.replace(/"/g, '""')}"`;
}

export interface CsvColumn<T> {
  /** Header label written in the first row. */
  header: string;
  /** Extract the raw cell value for a given row. */
  value: (row: T) => unknown;
}

/**
 * Generate a CSV string from the given columns and rows.
 * A UTF-8 BOM is prepended so spreadsheet apps (Excel, Word, Sheets)
 * correctly detect encoding and render non-Latin text (e.g. Devanagari).
 */
export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(col.value(row))).join(',')
  );
  return '﻿' + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Trigger a client-side download of the provided CSV content.
 */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience helper: build and download a CSV in one call.
 */
export function exportCsv<T>(
  fileName: string,
  columns: CsvColumn<T>[],
  rows: T[]
): void {
  downloadCsv(fileName, buildCsv(columns, rows));
}
