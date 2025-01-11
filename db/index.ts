import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the pool with explicit settings for better connection handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  maxConnections: 10,
  idleTimeout: 30,
  maxLifetime: 60 * 30,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});