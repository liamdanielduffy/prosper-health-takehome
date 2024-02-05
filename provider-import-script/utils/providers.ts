import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export interface RawProviderData {
  first_name: string,
  last_name: string,
  accepted_insurances: string,
  psypact: string,
  biography: string,
  gender: string
}

export interface Provider {
  first_name: string,
  last_name: string,
  accepted_insurances: string[]
  psypact: boolean,
  biography: string,
  gender: string
}

function readCsvFile<RawRowData, ParsedRowData>(
  csvFilePath: string,
  parseRow: (row: RawRowData) => ParsedRowData,
): Promise<ParsedRowData[]> {
  return new Promise((resolve) => {
    let parsedRows: ParsedRowData[] = []
    fs.createReadStream(path.resolve(process.cwd(), csvFilePath))
      .pipe(csv())
      .on('data', (row: RawRowData) => parsedRows.push(parseRow(row)))
      .on('end', () => resolve(parsedRows));
  })
}

function parseProviderData(data: RawProviderData): Provider {
  return {
    ...data,
    accepted_insurances: data.accepted_insurances.split(';'),
    psypact: Boolean(data.psypact)
  }
}

export async function getProvidersFromCsv(): Promise<Provider[]> {
  return readCsvFile<RawProviderData, Provider>('clinical_roster.csv', parseProviderData)
}