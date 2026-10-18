import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Neon Serverless Pool for transactions and standard queries
export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

// Neon HTTP client for ultra-fast serverless single queries if needed
export const sql = neon(connectionString);
