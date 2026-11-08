'use strict';

/**
 * Access-control integration tests: profile privacy, phone sign-in, notifications and ratings.
 * Skipped when DATABASE_URL is not set.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set';

describe('Access control (HTTP)', { skip }, () => {
  let server;
  let baseUrl;
  let client;
  const stamp = Date.now();
  const seller = { email: `seller-${stamp}@example.com`, phone: `071${String(stamp).slice(-7)}`, password: 'seller-password-1' };
  const buyer = { email: `buyer-${stamp}@example.com`, phone: `072${String(stamp).slice(-7)}`, password: 'buyer-password-1' };

  const call = async (method, path, body, token) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  const register = async (u, firstName) => {
    const res = await call('POST', '/auth/register', { ...u, firstName, lastName: 'Test' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { token: res.body.token, uid: res.body.user.uid, id: res.body.user.id };
  };

  before(async () => {
    const app = require('../../app');
    ({ client } = require('../../drizzle/db'));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    Object.assign(seller, await register(seller, 'Sally'));
    Object.assign(buyer, await register(buyer, 'Bob'));
  });

  after(async () => {
    await client`DELETE FROM users WHERE email IN (${seller.email}, ${buyer.email})`;
    server.close();
    await client.end();
  });

  describe('profiles', () => {
    it('should hide email and phone from anonymous visitors', async () => {
      const res = await call('GET', `/user/${seller.uid}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.firstName, 'Sally');
      assert.equal('email' in res.body, false);
      assert.equal('phone' in res.body, false);
    });

    it('should hide email and phone from other signed-in users', async () => {
      const res = await call('GET', `/user/${seller.uid}`, null, buyer.token);
      assert.equal('email' in res.body, false);
    });

    it('should return the full profile to its owner', async () => {
      const res = await call('GET', `/user/${seller.uid}`, null, seller.token);
      assert.equal(res.body.email, seller.email);
      assert.equal(res.body.phone, seller.phone);
    });

    it('should not find users by email or phone', async () => {
      assert.equal((await call('GET', `/user/${encodeURIComponent(seller.email)}`)).status, 404);
      assert.equal((await call('GET', `/user/${seller.phone}`)).status, 404);
    });

    it('should not match user search on email addresses', async () => {
      const res = await call('GET', `/follows/community/search?q=${encodeURIComponent(`seller-${stamp}`)}`);
      assert.equal(res.status, 200);
      assert.equal(JSON.stringify(res.body).includes(seller.uid), false);
    });
  });

  describe('sign-in', () => {
    it('should sign in with a phone number', async () => {
      const res = await call('POST', '/auth/login', { identifier: seller.phone, password: seller.password });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.uid, seller.uid);
    });

    it('should reject registering a phone number that is already used', async () => {
      const res = await call('POST', '/auth/register', {
        email: `dup-${stamp}@example.com`, phone: seller.phone, password: 'dup-password-1', firstName: 'D', lastName: 'Up',
      });
      assert.equal(res.status, 409);
    });
  });

  describe('notifications', () => {
    it('should require a token', async () => {
      assert.equal((await call('GET', `/notifications/${seller.uid}`)).status, 401);
    });

    it('should forbid reading another user\'s notifications', async () => {
      assert.equal((await call('GET', `/notifications/${seller.uid}`, null, buyer.token)).status, 403);
    });
  });

  describe('ratings', () => {
    let requestId;

    before(async () => {
      const item = await call('POST', '/clothes', {
        name: 'Test Jacket', price: 50, category: 'Outerwear', size: 'M', condition: 'good', mode: 'sell', images: [],
      }, seller.token);
      assert.ok([200, 201].includes(item.status), JSON.stringify(item.body));
      const itemId = item.body.id ?? item.body.item?.id;

      const checkout = await call('POST', '/checkout', { userId: buyer.uid, items: [itemId] }, buyer.token);
      assert.equal(checkout.status, 200, JSON.stringify(checkout.body));

      const notifs = await call('GET', `/notifications/${buyer.uid}`, null, buyer.token);
      requestId = notifs.body.find((n) => n.type === 'rating_request')?.id;
      assert.ok(requestId, 'buyer received a rating request');
    });

    it('should require a token', async () => {
      assert.equal((await call('POST', '/ratings', { notificationId: requestId, rating: 5 })).status, 401);
    });

    it('should not let another user answer the buyer\'s rating request', async () => {
      const res = await call('POST', '/ratings', { notificationId: requestId, rating: 1 }, seller.token);
      assert.equal(res.status, 404);
    });

    it('should accept the buyer\'s rating and credit the seller', async () => {
      const res = await call('POST', '/ratings', { notificationId: requestId, rating: 4, comment: 'Nice' }, buyer.token);
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const profile = await call('GET', `/user/${seller.uid}`);
      assert.equal(profile.body.rating, 4);
      assert.equal(profile.body.reviewCount, 1);
    });

    it('should reject rating the same purchase twice', async () => {
      const res = await call('POST', '/ratings', { notificationId: requestId, rating: 5 }, buyer.token);
      assert.equal(res.status, 404);
    });

    it('should ignore client-supplied rater and target ids', async () => {
      const res = await call('POST', '/ratings', { notificationId: requestId, rating: 1, raterId: seller.id, targetUserId: buyer.id }, buyer.token);
      assert.equal(res.status, 404, 'still bound to the (already answered) request');
    });
  });
});
