import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Folosim DATABASE_URL (cea cu pgbouncer și port 6543) pentru cereri zilnice
// Deoarece folosim un pooler, configurăm max: 1 pentru medii serverless, 
// sau mai multe pentru un server permanent (ca al nostru de Fastify/Express).
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false }); // prepare: false este necesar pentru pgbouncer

export const db = drizzle(client, { schema });
