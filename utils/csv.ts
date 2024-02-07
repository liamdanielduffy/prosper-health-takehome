import csv from 'csv-parser';
import stream from 'stream'

export function parseCsvContents<RawRowData, ParsedRowData>(
  csvContents: string,
  parseRow: (row: RawRowData) => ParsedRowData,
): Promise<ParsedRowData[]> {
  return new Promise((resolve) => {
    const parsedRows: ParsedRowData[] = [];
    const csvStream = csv();
    const readableStream = new stream.Readable();
    readableStream.push(csvContents);
    readableStream.push(null); // No more data
    readableStream
      .pipe(csvStream)
      .on('data', (row: RawRowData) => parsedRows.push(parseRow(row)))
      .on('end', () => resolve(parsedRows));
  });
}

