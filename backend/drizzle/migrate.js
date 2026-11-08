'use strict';

/**
 * Applies pending SQL migrations from drizzle/migrations.
 * Runs before the server starts (see `npm start`); safe to run repeatedly —
 * already-applied migrations are tracked in the drizzle.__drizzle_migrations table.
 */

require('dotenv').config();
const path = require('path');
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set.');
    }

    // Dedicated single connection: migrations must not share the app pool.
    const client = postgres(connectionString, {
        max: 1,
        ssl: process.env.DB_SSL === 'require' ? 'require' : false,
        onnotice: () => {},
    });

    try {
        await migrate(drizzle(client), {
            migrationsFolder: path.join(__dirname, 'migrations'),
        });
        console.log('[migrate] Database is up to date.');
    } finally {
        await client.end();
    }
}

run().catch((err) => {
    console.error('[migrate] Migration failed:', err.message);
    process.exit(1);
});
