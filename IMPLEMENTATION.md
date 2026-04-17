# IMPLEMENTATION.md — Residual Legacy Code Cleanup

## Goal
Remove or update all remaining files that still reference the old listing modes (`donate`, `trade`, `both`, `trade_buy`, `buy`).
This is a continuation of the sale-only mode cleanup. The app now uses `mode: 'sell'` exclusively.

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Delete `AddItemModal.tsx` | Never imported anywhere — dead code |
| 2 | Delete `backend/database/seeds/seed.js` | Targets deprecated Firestore — fully obsolete |
| 3 | Update `backend/database/seeds/sql_seed.js` | Remove 'trade', 'both', 'donate' from mode array — use 'sell' only |
| 4 | Investigate `frontend/data/clothes.ts` + `ClosetGallery.tsx` | Active but disconnected from real API — needs validation before deciding delete vs. update |

---

## Scope

### In Scope
- Delete dead/legacy components and seed files
- Update active seed files to reflect sell-only mode
- Align mock data field naming if `ClosetGallery` is still used

### Out of Scope
- Any new feature development
- DB schema changes
- Backend routes or controllers

---

## Affected Files

### Delete
| File | Reason |
|------|--------|
| `frontend/components/AddItemModal.tsx` | Never imported, dead code |
| `backend/database/seeds/seed.js` | Firestore seed — Firestore is deprecated, SQL is the current standard |

### Modify
| File | Change |
|------|--------|
| `backend/database/seeds/sql_seed.js` | Replace `['sell', 'trade', 'both', 'donate']` with `['sell']` only; remove price conditional for trade/donate |

### Delete (confirmed after validation)
| File | Reason |
|------|--------|
| `frontend/components/ClosetGallery.tsx` | Never imported anywhere — dead code |
| `frontend/data/clothes.ts` | Only consumer was `ClosetGallery.tsx` (dead) and `AddItemModal.tsx` (dead) — safe to delete |

---

## Execution Order

1. Delete `frontend/components/AddItemModal.tsx`
2. Delete `frontend/components/ClosetGallery.tsx`
3. Delete `frontend/data/clothes.ts`
4. Delete `backend/database/seeds/seed.js`
5. Update `backend/database/seeds/sql_seed.js` — mode always `'sell'`; price always required (remove null branch)

---

## Notes [C]

- `sql_seed_manual.js` and `test_seed.js` already use `mode: 'sell'` only — no changes needed
- `ClosetGallery.tsx` confirmed dead: grep across all `.ts`/`.tsx` finds it only in its own definition
- `data/clothes.ts` confirmed safe to delete: only consumers are `ClosetGallery.tsx` and `AddItemModal.tsx`, both dead
- `sql_seed.js` line 115 also has `price: (Math.random() > 0.2) ? ... : null` — the null branch is now invalid since price is always required; fix to always set a price
- `seed.js` targets Firestore (deprecated) — straightforward delete, no SQL impact
