'use strict';

/**
 * Checkout integration test — concurrency and ownership rules.
 * Skipped when DATABASE_URL is not set.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set';

describe('CheckoutService (HTTP)', { skip }, () => {
  let server;
  let baseUrl;
  let client;
  const stamp = Date.now();
  const people = ['seller', 'buyerA', 'buyerB'].map((name, i) => ({
    name,
    email: `${name.toLowerCase()}-${stamp}@example.com`,
    phone: `07${i}${String(stamp).slice(-7)}`,
    password: `${name}-password-1`,
  }));
  const [seller, buyerA, buyerB] = people;

  const call = async (method, path, body, token) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  const listItem = async (name) => {
    const res = await call('POST', '/clothes', {
      name, price: 30, category: 'T-shirts', size: 'M', condition: 'good', mode: 'sell', images: [],
    }, seller.token);
    assert.ok([200, 201].includes(res.status), JSON.stringify(res.body));
    return res.body.id ?? res.body.item?.id;
  };

  before(async () => {
    const app = require('../../app');
    ({ client } = require('../../drizzle/db'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    for (const p of people) {
      const res = await call('POST', '/auth/register', { ...p, firstName: p.name, lastName: 'Test' });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      p.token = res.body.token;
    }
  });

  after(async () => {
    await client`DELETE FROM users WHERE email IN ${client(people.map((p) => p.email))}`;
    server.close();
    await client.end();
  });

  it('should sell an item to exactly one buyer when many check out at the same time', async () => {
    const itemId = await listItem('Contested Tee');
    // Ten simultaneous attempts make the read-then-update race window reliably observable.
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) =>
      call('POST', '/checkout', { items: [itemId] }, (i % 2 ? buyerA : buyerB).token)));
    const statuses = results.map((r) => r.status);
    assert.equal(statuses.filter((s) => s === 200).length, 1, `exactly one success: ${statuses}`);
    assert.equal(statuses.filter((s) => s === 409).length, 9, `the rest are rejected: ${statuses}`);

    const [{ count }] = await client`
      SELECT count(*)::int AS count FROM notifications WHERE item_id = ${itemId} AND type = 'sale_notification'`;
    assert.equal(count, 1, 'seller is notified once');
  });

  it('should reject buying your own item', async () => {
    const itemId = await listItem('Own Tee');
    const res = await call('POST', '/checkout', { items: [itemId] }, seller.token);
    assert.equal(res.status, 400);
  });

  it('should roll back the whole order when one item is unavailable', async () => {
    const free = await listItem('Free Tee');
    const taken = await listItem('Taken Tee');
    assert.equal((await call('POST', '/checkout', { items: [taken] }, buyerA.token)).status, 200);

    const res = await call('POST', '/checkout', { items: [free, taken] }, buyerB.token);
    assert.equal(res.status, 409);
    const [row] = await client`SELECT status FROM clothes WHERE id = ${free}`;
    assert.equal(row.status, 'active', 'the available item was not sold');
  });

  it('should accept a cart that lists the same item twice', async () => {
    const itemId = await listItem('Double Tee');
    const res = await call('POST', '/checkout', { items: [itemId, itemId] }, buyerA.token);
    assert.equal(res.status, 200, JSON.stringify(res.body));
  });

  it('should reject malformed item ids with 400', async () => {
    assert.equal((await call('POST', '/checkout', { items: ['not-a-uuid'] }, buyerA.token)).status, 400);
  });
});
