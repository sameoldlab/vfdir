import {
  object,
  string,
  number,
  date,
  assert,
  create,
  type Infer,
  union,
  coerce
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
  return res
  let [h, ...rows] = csv.split('\n')
  const headers = h.toLowerCase().replaceAll(' ', '_').split(',')

  // Validate headers
  if (headers.join(',') !== 'id,filename,title,description,created_at,updated_at,source') {
    throw new Error('Invalid CSV headers');
  }

  const result: Channel[] = [];

  console.log(headers)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = line.split(',');
      if (values.length !== headers.length) {
        throw new Error(
          `
Invalid number of fields in line ${i + 1}
received: ${values}
`)
      }

      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        item[header] = values[index];
      });

      try {
        console.log(item)
        const validatedItem = create(item, Channel);
        result.push(validatedItem);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Validation error in line ${i + 1}: ${error.message}`);
        } else {
          throw new Error(`Unknown error in line ${i + 1}`);
        }
      }
    }
  }

  console.log(result)
  return result;
}
