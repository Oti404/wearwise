'use strict';

/**
 * /ai/analyze integration test. Points AI_ENGINE_URL at a closed port, so it checks the
 * backend's guards and error mapping without needing the Python engine.
 * Skipped when DATABASE_URL is not set.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

describe('AiService (HTTP)', { skip }, () => {
  let server;
  let baseUrl;
  let client;
  let token;
  const email = `ai-${Date.now()}@example.com`;

  const analyze = (buffer, authToken = token) => {
    const form = new FormData();
    form.append('image', new Blob([buffer]), 'image.png');
    return fetch(`${baseUrl}/ai/analyze`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: form,
    });
  };

  before(async () => {
    process.env.AI_ENGINE_URL = 'http://127.0.0.1:9';
    const app = require('../../app');
    ({ client } = require('../../drizzle/db'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'ai-test-password', firstName: 'Ai', lastName: 'Test', phone: `07${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 10)}` }),
    });
    ({ token } = await res.json());
  });

  after(async () => {
    await client`DELETE FROM users WHERE email = ${email}`;
    server.close();
    await client.end();
  });

  it('should reject analysis without a token', async () => {
    assert.equal((await analyze(PNG, null)).status, 401);
  });

  it('should reject images over 5 MB with 413', async () => {
    assert.equal((await analyze(Buffer.alloc(5 * 1024 * 1024 + 10))).status, 413);
  });

  it('should return 503 when the AI engine is unreachable', async () => {
    assert.equal((await analyze(PNG)).status, 503);
  });
});
