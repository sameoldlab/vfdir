import {
	coerce,
	enums,
	nullable,
	number,
	object,
	string,
	union,
	type,
	type Infer,
	tuple,
	unknown,
	record,
} from 'superstruct'

// Users
export const User = type({
	id: string(),
	slug: nullable(string()),
	firstname: nullable(string()),
	lastname: nullable(string()),
	avatar: nullable(string()),
})

const users = `
CREATE TABLE IF NOT EXISTS Users(
	id TEXT PRIMARY KEY NOT NULL,
	slug TEXT,
	firstname TEXT,
	lastname TEXT,
	avatar TEXT
);
`
export type User = Infer<typeof User>

export const deviceId: string = localStorage.getItem('deviceId')
if (deviceId === null) throw Error('invalid id')
export const EVENT_DB_NAME = 'log'
export const EventSchema = object({
	version: number(),
	/** Unique id on event reception */
	localId: string(),
	/** Unique id from event source */
	originId: string(),
	data: string(),
	/**
	 * add|mod|delete-column|row
	 * @example mod:title
	 */
	type: string(),
	/** 
	 * field to which the event is related 
	 * @example block:0L239vsDajfdse...
	 */
	objectId: string()
})
// const [action, field] = e.type.split(':')
// const [ts, c, device] = e.originId.split(':')
const hlc = coerce(tuple([number(), number(), string()]), string(), (hlc) => {
	const p = hlc.split(':')
	return [Number(p[0]), Number(p[1]), p[2]]
})
export const EventSchemaR = object({
	version: number(),
	/** Unique id on event reception */
	localId: hlc,
	/** Unique id from event source */
	originId: hlc,
	data: coerce(record(string(), unknown()), string(), (data) => JSON.parse(data)),
	/**
	 * add|mod|delete-column|row
	 * @example mod:title
	 */
	type: coerce(tuple([enums(['add', 'mod', 'del', 'save']), string()]), string(), (data) => data.split(':')),
	/** 
	 * field to which the event is related 
	 * @example block:0L239vsDajfdse...
	 */
	objectId: coerce(tuple([string(), union([string(), number()])]), string(), (data) => {
		const p = data.split(':')
		const id = Number(p[1])
		return [p[0], isNaN(id) ? p[1] : id]
	}),
	rowid: number()
})
export type EventSchema = Infer<typeof EventSchema>
const log = `
CREATE TABLE IF NOT EXISTS ${EVENT_DB_NAME}(
	version INT NOT NULL,
	localId TEXT NOT NULL,
	originId TEXT NOT NULL,
	data TEXT NOT NULL,
	type TEXT NOT NULL,
	objectId TEXT NOT NULL
);
`

// schema
export const schema = [
	'pragma journal_mode = wal;',
	log,
	users,
	`INSERT INTO Users(id) VALUES ('${deviceId}');`,
]
