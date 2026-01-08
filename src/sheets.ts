import type { sheets_v4 } from "googleapis";
import { Config } from "./config";

export interface SheetData {
  headers: string[];
  rows: string[][];
  startRow: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseStartRow(range: string): number {
  const match = range.match(/!([A-Z]+)(\d+)(:|$)/i);
  if (!match) return 1;
  const row = Number(match[2]);
  return Number.isNaN(row) ? 1 : row;
}

function getSheetName(range: string): string {
  const parts = range.split("!");
  if (parts.length < 2) {
    throw new Error("Sheets range must include a sheet name, e.g. Sheet1!A:Z");
  }
  return parts[0];
}

function columnLetter(index: number): string {
  let col = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

export async function getSheetData(
  sheets: sheets_v4.Sheets,
  config: Config
): Promise<SheetData> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheets.id,
    range: config.sheets.range,
  });
  const values = (response.data.values ?? []) as string[][];
  return {
    headers: values[config.sheets.header_row - 1] ?? [],
    rows: values,
    startRow: parseStartRow(config.sheets.range),
  };
}

export function getHeaderIndex(headers: string[], headerName: string): number {
  const normalizedHeader = normalize(headerName);
  const index = headers.findIndex((header) => normalize(header) === normalizedHeader);
  if (index < 0) {
    throw new Error(`Header '${headerName}' was not found in the sheet.`);
  }
  return index;
}

export function findGroupIdByName(data: SheetData, config: Config, groupName: string): string | null {
  const headers = data.headers;
  if (headers.length === 0) return null;
  const nameIndex = getHeaderIndex(headers, config.sheets.group_name_header);
  const idIndex = getHeaderIndex(headers, config.sheets.group_id_header);
  const target = normalize(groupName);

  for (let rowIndex = config.sheets.header_row; rowIndex < data.rows.length; rowIndex += 1) {
    const row = data.rows[rowIndex] ?? [];
    const value = row[nameIndex] ?? "";
    if (normalize(value) === target) {
      return row[idIndex] ?? null;
    }
  }
  return null;
}

export function getLatestNonEmptyRow(
  data: SheetData,
  headerRow: number
): { row: string[]; rowNumber: number } | null {
  const minIndex = Math.max(0, headerRow - 1);
  for (let i = data.rows.length - 1; i >= minIndex; i -= 1) {
    const row = data.rows[i] ?? [];
    const hasValue = row.some((cell) => cell && cell.toString().trim().length > 0);
    if (hasValue) {
      const rowNumber = data.startRow + i;
      return { row, rowNumber };
    }
  }
  return null;
}

export async function updateSheetCell(
  sheets: sheets_v4.Sheets,
  config: Config,
  rowNumber: number,
  headerName: string,
  value: string
): Promise<void> {
  const data = await getSheetData(sheets, config);
  const headers = data.headers;
  const index = getHeaderIndex(headers, headerName);
  const sheetName = getSheetName(config.sheets.range);
  const column = columnLetter(index);
  const range = `${sheetName}!${column}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.sheets.id,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [[value]],
    },
  });
}
