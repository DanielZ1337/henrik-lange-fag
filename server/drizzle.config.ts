
import { defineConfig, type Config } from 'drizzle-kit'

if (!process.env.DB_URL) {
    throw new Error("DB_URL not found in .env file");
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DB_URL,
    },
    verbose: true,
    strict: true,
}) satisfies Config;