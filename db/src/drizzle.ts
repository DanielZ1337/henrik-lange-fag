import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as schema from './schema.ts'

class Database {
	private static instance: Database
	private readonly client: NodePgDatabase<typeof schema>

	private constructor() {
		const { DB_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

		if (DB_URL) {
			const client = new Client({ connectionString: DB_URL })
			client.connect()
			this.client = drizzle(client, { schema })
		} else {
			if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
				throw new Error('Missing environment variables for database connection')
			}
			const client = new Client({
				host: DB_HOST,
				port: Number(DB_PORT),
				user: DB_USER,
				password: DB_PASSWORD,
				database: DB_NAME,
			})
			client.connect()

			this.client = drizzle(client, { schema })
		}
	}

	public static getInstance(): Database {
		if (!Database.instance) {
			Database.instance = new Database()
		}
		return Database.instance
	}

	public getDb(): NodePgDatabase<typeof schema> {
		return Database.instance.client
	}
}

// Export the singleton instance
export const db = Database.getInstance().getDb()
