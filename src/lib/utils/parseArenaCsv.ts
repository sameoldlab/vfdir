import {
  object,
  string,
  number,
  date,
  create,
  type Infer,
  union,
  coerce,
  optional,
  StructError
} from 'superstruct';
import { parse } from 'csv-parse/browser/esm/sync'

const date_int = coerce(number(), union([string(), date()]), (value) => typeof value === 'string' ? new Date(value).valueOf() : value.valueOf())
// Define the structure for each item
const Channel = object({
  id: coerce(number(), string(), (v) => parseInt(v)),
  filename: string(),
  title: string(),
  description: string(),
  created_at: date_int,
  updated_at: date_int,
  source: optional(string()),
});

type Channel = Infer<typeof Channel>;

export function arenaCsvToObj(csv: string): Channel[] {
  const res = parse(csv, {
    delimiter: ',',
    columns: true,

  })
  console.log(res)
  return res
  let [h, ...rows] = csv.split('\n')
  const headers = h.toLowerCase().replaceAll(' ', '_').split(',')
  const COLS = headers.length

  // Validate headers
  if (headers.join(',') !== 'id,filename,title,description,created_at,updated_at,source') {
    throw new Error('Invalid CSV headers');
  }

  const result: Channel[] = [];
  console.log(headers)
  for (let i = 0; i < rows.length; i++) {
    const token = rows[i].split(',')
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      console.log(token[index])
      row[header] = token[index];
    });

    try {
      console.log(row)
      const validatedItem = create(row, Channel);
      result.push(validatedItem);
    } catch (error) {
      if (error instanceof StructError) {
        throw new Error(`
Struct Error at line ${i + 1} parsing ${error.key}: '${row[error.key]}'
${error.message} 
`);
      } else {
        throw new Error(`Unknown error in line ${i + 1}`);
      }
    }

  }

  console.log(result)
  return result;
}
