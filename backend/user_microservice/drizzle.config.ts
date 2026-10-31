import { defineConfig } from "drizzle-kit";

const url = new URL(process.env.DATABASE_URL!);
console.log('drizzle using:', { host: url.hostname, port: url.port, user: url.username, db: url.pathname });
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
    ssl: process.env.NODE_ENV === 'production' ? true : false
  },
});