import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.ts'
import { config } from 'dotenv'
config()

class Database {
	private static instance: Database
	private readonly client: NodePgDatabase<typeof schema>

	private constructor() {
		const { DB_URL } = process.env

		if (!DB_URL) {
			throw new Error('Missing environment variables for database connection')
		}

		const client = new pg.Client({ connectionString: DB_URL })
		client.connect()
		this.client = drizzle(client, { schema })
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database()
		}
		return Database.instance
	}

	public getDb(): NodePgDatabase<typeof schema> {
		return this.client
	}
}

// Export the singleton instance
export const db = Database.getInstance().getDb()
