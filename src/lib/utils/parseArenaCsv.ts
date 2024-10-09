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

const date_int = coerce(number(), union([string(), date()]), (value) => typeof value === 'string' ? new Date(value).valueOf() : value.valueOf())
// Define the structure for each item
const Channel = object({
  ID: string(),
  Filename: string(),
  Title: string(),
  Description: string(),
  'Created At': date_int,
  'Updated At': date_int,
  Source: string(),
});

type Channel = Infer<typeof Channel>;

export function arenaCsvToObj(csv: string): Channel[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');

  // Validate headers
  if (headers.join(',') !== 'ID,Filename,Title,Description,Created At,Updated At,Source') {
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
