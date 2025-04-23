import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Use ws for Neon serverless
if (typeof global.WebSocket === "undefined") {
  // @ts-ignore
  global.WebSocket = ws;
}

// Check for DATABASE_URL
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

if (!connectionString) {
  throw new Error("DATABASE_URL or PG environment variables must be set");
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
