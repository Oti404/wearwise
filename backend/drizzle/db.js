'use strict';

/**
 * Drizzle ORM database connection (CommonJS).
 *
 * Connects to the self-hosted Postgres (pgvector) instance via DATABASE_URL.
 * SSL is off by default because the database runs on the internal Docker network;
 * set DB_SSL=require when connecting to a remote database over the internet.
 */

require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./schema');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
}

const client = postgres(connectionString, {
    ssl: process.env.DB_SSL === 'require' ? 'require' : false,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idle_timeout: 30,
    connect_timeout: 10,
});

const db = drizzle(client, { schema });

module.exports = { db, client };
