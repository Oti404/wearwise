'use strict';

/**
 * Drizzle ORM Database Connection (CommonJS version)
 * 
 * FIX: prepare: false is REQUIRED when using DATABASE_URL (port 6543 / PGBouncer).
 * Without it, postgres.js tries to use Prepared Statements which causes FATAL XX000
 * because PGBouncer in Transaction Mode routes each query to a different connection.
 *
 * Using DIRECT_URL (port 5432) bypasses PGBouncer entirely, but prepare: false
 * is kept here as a safe fallback for any environment.
 */

require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./schema');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('❌ EROARE: DIRECT_URL sau DATABASE_URL nu este setat corect în .env!');
    process.exit(1);
}

const client = postgres(connectionString, {
    ssl: 'require',
    prepare: false, 
    max: 20, // Creștem numărul de conexiuni în pool
    idle_timeout: 30, // Închidem conexiunile idle după 30 secunde pentru a evita ECONNRESET
    connect_timeout: 10,
});

const db = drizzle(client, { schema });

module.exports = { db };
