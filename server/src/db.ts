import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from '../../db/src/schema.ts';

class Database {
    private static instance: Database;
    private readonly client: Client;

    private constructor() {
        const { DB_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

        if (DB_URL) {
            this.client = new Client({ connectionString: DB_URL });
        } else {
            if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
                throw new Error('Missing environment variables for database connection');
            }

            this.client = new Client({
                host: DB_HOST,
                port: Number(DB_PORT),
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME,
            });
        }

        void this.client.connect();
    }   

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getDb() {
        return drizzle(this.client, {
            schema,
        });
    }
}

// Export the singleton instance
export const db = Database.getInstance().getDb();
