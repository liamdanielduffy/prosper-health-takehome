import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export interface RawProviderData {
  first_name: string
  last_name: string
  states_licensed: string
  clinician_type: string
  accepted_insurances: string
  email: string
  psypact: string
  biography: string
  gender: string
}

export interface Provider {
  first_name: string
  last_name: string
  states_licensed: string[]
  clinician_type: string
  accepted_insurances: string[]
  email: string
  psypact: boolean
  biography: string
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
    states_licensed: data.states_licensed.split(';'),
    accepted_insurances: data.accepted_insurances.split(';'),
    psypact: data.psypact === 'True' ? true : false
  }
}

export async function getProviders(): Promise<Provider[]> {
  return readCsvFile<RawProviderData, Provider>('data/clinical_roster.csv', parseProviderData)
}