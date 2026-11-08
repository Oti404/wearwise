'use strict';

/**
 * Auth integration test — runs against a real Postgres.
 * Usage: DATABASE_URL=... JWT_SECRET=... npm run test:integration
 * Skipped when DATABASE_URL is not set, so it never fails a machine without a database.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set';

describe('AuthService (HTTP)', { skip }, () => {
  let server;
  let baseUrl;
  let client;
  const email = `test-${Date.now()}@example.com`;
  const password = 'correct-horse-battery';

  const call = async (method, path, body, token) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  before(async () => {
    const app = require('../../app');
    ({ client } = require('../../drizzle/db'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await client`DELETE FROM users WHERE email = ${email}`;
    server.close();
    await client.end();
  });

  let token;
  let uid;

  it('should create an account and return a token when registering', async () => {
    const res = await call('POST', '/auth/register', {
      email: email.toUpperCase(), password, firstName: 'Ana', lastName: 'Pop', phone: `07${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 10)}`,
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, email, 'email is normalized to lowercase');
    assert.equal(res.body.user.uid, res.body.user.id);
    assert.equal('passwordHash' in res.body.user, false, 'hash never leaves the server');
    ({ token } = res.body);
    uid = res.body.user.uid;
  });

  it('should reject a duplicate email with 409', async () => {
    const res = await call('POST', '/auth/register', {
      email, password, firstName: 'Ana', lastName: 'Pop', phone: `07${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 10)}`,
    });
    assert.equal(res.status, 409);
  });

  it('should log in when the password is correct', async () => {
    const res = await call('POST', '/auth/login', { identifier: email, password });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.uid, uid);
  });

  it('should return the same 401 for a wrong password and an unknown email', async () => {
    const wrong = await call('POST', '/auth/login', { identifier: email, password: 'wrong-password' });
    const unknown = await call('POST', '/auth/login', { identifier: 'nobody@example.com', password });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message);
  });

  it('should return the current user from /auth/me when the token is valid', async () => {
    const res = await call('GET', '/auth/me', null, token);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.uid, uid);
  });

  it('should reject /auth/me when the token is missing or tampered with', async () => {
    assert.equal((await call('GET', '/auth/me')).status, 401);
    assert.equal((await call('GET', '/auth/me', null, `${token}x`)).status, 401);
  });

  it('should forbid editing another user\'s profile', async () => {
    const res = await call('PATCH', '/user/00000000-0000-0000-0000-000000000000', { city: 'Cluj' }, token);
    assert.equal(res.status, 403);
  });

  it('should allow editing your own profile', async () => {
    const res = await call('PATCH', `/user/${uid}`, { city: 'Cluj' }, token);
    assert.equal(res.status, 200);
    assert.equal(res.body.city, 'Cluj');
  });
});
