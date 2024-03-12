import {drizzle} from "drizzle-orm/node-postgres";
import {Client} from "pg";
import * as schema from '../../db/src/schema.ts';

const {DB_URL} = process.env
if (!DB_URL) {
    throw new Error('No url');
}
const client = new Client({
    connectionString: process.env.DB_URL,
});

await client.connect();

export const db = drizzle(client, {
    schema
});