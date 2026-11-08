'use strict';

/**
 * Upload integration test — runs against a real Postgres (needs a user for the token).
 * Skipped when DATABASE_URL is not set.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set';

// Smallest valid PNG (1x1 transparent pixel).
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

describe('StorageService (HTTP)', { skip }, () => {
  let server;
  let baseUrl;
  let client;
  let token;
  const email = `upload-${Date.now()}@example.com`;

  const upload = (buffer, filename, authToken = token) => {
    const form = new FormData();
    form.append('image', new Blob([buffer]), filename);
    return fetch(`${baseUrl}/uploads`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: form,
    });
  };

  before(async () => {
    process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-uploads-'));
    const app = require('../../app');
    ({ client } = require('../../drizzle/db'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'upload-test-pass', firstName: 'Up', lastName: 'Load', phone: '0712345678' }),
    });
    ({ token } = await res.json());
  });

  after(async () => {
    await client`DELETE FROM users WHERE email = ${email}`;
    server.close();
    await client.end();
    fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
  });

  it('should store a PNG and serve it back when the user is authenticated', async () => {
    const res = await upload(PNG, 'pixel.png');
    assert.equal(res.status, 201);
    const { url } = await res.json();
    assert.match(url, /\/uploads\/[0-9a-f-]{36}\.png$/);

    const served = await fetch(`${baseUrl}${new URL(url).pathname}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('cross-origin-resource-policy'), 'cross-origin');
    assert.deepEqual(Buffer.from(await served.arrayBuffer()), PNG);
  });

  it('should reject uploads without a token', async () => {
    assert.equal((await upload(PNG, 'pixel.png', null)).status, 401);
  });

  it('should reject a non-image even when it is named .png', async () => {
    assert.equal((await upload(Buffer.from('<script>alert(1)</script>'), 'evil.png')).status, 400);
  });

  it('should reject files over 5 MB with 413', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    assert.equal((await upload(big, 'big.png')).status, 413);
  });

  it('should return 404 for a missing file', async () => {
    assert.equal((await fetch(`${baseUrl}/uploads/does-not-exist.png`)).status, 404);
  });
});
