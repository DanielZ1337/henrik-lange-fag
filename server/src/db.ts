import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from '../../db/src/schema.ts';

const { DB_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let client

if (!DB_URL) {

    if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
        throw new Error('Missing environment variables for database connection');
    }

    client = new Client({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
    });
}

if (DB_URL) {
    client = new Client({
        connectionString: DB_URL
    });
}

if (!client) {
    throw new Error('Could not create database client');
}

await client.connect();

export const db = drizzle(client, {
    schema
});