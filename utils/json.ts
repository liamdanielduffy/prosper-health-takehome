export function stringifyWithEscapedQuotes(obj: Record<any, any>) {
  return JSON.stringify(obj).replace(/"/g, '\\"')
}