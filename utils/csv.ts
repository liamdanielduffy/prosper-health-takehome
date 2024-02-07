import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export function readCsvFile<RawRowData, ParsedRowData>(
  csvFilePath: string,
  parseRow: (row: RawRowData) => ParsedRowData,
): Promise<ParsedRowData[]> {
  return new Promise((resolve) => {
    const parsedRows: ParsedRowData[] = []
    fs.createReadStream(path.resolve(process.cwd(), csvFilePath))
      .pipe(csv())
      .on('data', (row: RawRowData) => parsedRows.push(parseRow(row)))
      .on('end', () => resolve(parsedRows));
  })
}