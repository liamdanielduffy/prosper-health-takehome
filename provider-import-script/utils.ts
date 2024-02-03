import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { Provider, RawProviderData } from './types';

function getFullFilePath(relativeFilePath: string): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, relativeFilePath)
}

function readCsvFile<RowData>(
  csvFilePath: string,
  forEachRow: (rowData: RowData) => void,
  onFinish: () => void
) {
  fs.createReadStream(getFullFilePath(csvFilePath))
    .pipe(csv())
    .on('data', forEachRow)
    .on('end', onFinish);
}

function parseProviderData(data: RawProviderData): Provider {
  return {
    ...data,
    accepted_insurances: data.accepted_insurances.split(';'),
    psypact: Boolean(data.psypact)
  }
}

export async function getProvidersFromFile(): Promise<Provider[]> {
  return new Promise((resolve) => {
    let providers: Provider[] = []
    readCsvFile<RawProviderData>(
      'clinical_roster.csv',
      data => providers.push(parseProviderData(data)),
      () => resolve(providers)
    )
  })
}