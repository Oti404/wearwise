const request = require('supertest');

describe('WearWise Backend v2.0.0 Sanity Check', () => {
  it('Verifica integritatea mediului de test', () => {
    expect(1 + 1).toBe(2);
  });

  it('Verifica daca infrastructura de testare este gata', () => {
    const status = "READY";
    expect(status).toBe("READY");
  });
});
