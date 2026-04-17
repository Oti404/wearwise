# IMPLEMENTATION.md — Sale-Only Mode Cleanup

## Goal
Simplify the WearWise listing system to support **only the `sell` mode** for now.
Remove all traces of `donate`, `trade`, and `both` from the frontend and backend logic.
Keep the DB schema intact for future extensibility.

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Remove `donate`, `trade`, `both` from all frontend UI | MVP focus — sale only |
| 2 | Backend validator restricts `mode` to `'sell'` only | Prevent invalid data via direct API calls |
| 3 | Keep `donationsCount` / `tradesCount` columns in `users` table | Future extensibility — do NOT update them in checkout |
| 4 | Keep `mode` column in `clothes` table | Future extensibility — will always be `'sell'` for now |
| 5 | Delete `DonationsView.tsx` and its navigation entry | Feature is removed, no dead code allowed |
| 6 | DB: hard delete all rows with `mode IN ('donate', 'trade', 'both')` | All current data is fictional/demo |
| 7 | Items with `mode = 'both'` are also deleted (not converted) | Demo data only, no real data at risk |

---

## Scope

### In Scope
- Frontend UI cleanup (add-item, cards, filters, navigation)
- Backend validator restriction
- Checkout service simplification
- DB data cleanup (demo data only)

### Out of Scope
- DB schema changes (no column drops, no migrations)
- Backend routes and controllers (no structural changes)
- Any new feature development

---

## Affected Files

### Frontend — Modify
| File | Change |
|------|--------|
| `frontend/app/add-item.tsx` | Remove mode selector UI entirely; hardcode `mode = 'sell'`; price field always visible |
| `frontend/components/SwipeCard.tsx` | Remove trade / donate / both badges; keep only sell badge |
| `frontend/components/FilterModal.tsx` | Remove `trade` and `donate` entries from MODES array |
| `frontend/store/useAppStore.ts` | Remove `'donations'` from `view` type union; remove any donations-related state or actions |
| `frontend/hooks/useClothes.ts` | Update `ClothingItem.mode` type from `'trade' \| 'sell' \| 'both' \| 'donate'` to `'sell'` only |
| `frontend/app/item/[id].tsx` | Remove trade / donate / both badge display logic |
| `frontend/components/ProfilePage.tsx` | **[C] ADDED** — Remove `isTrade`, `isDonate`, trade/donate badge blocks; simplify price display (lines 353–415) |
| `frontend/app/user/[id].tsx` | **[C] ADDED** — Remove trade/donate/both badge blocks; simplify price fallback from 'TRADE' to price only (lines 227–246) |
| `frontend/app/resale/[id].tsx` | **[C] ADDED** — Update type annotation on `mode` field from full union to `'sell'`; simplify `handleSave` price validation condition |

### Frontend — Delete
| File | Reason |
|------|--------|
| `frontend/components/DonationsView.tsx` | Feature removed entirely |

### Backend — Modify
| File | Change |
|------|--------|
| `backend/validators/clothesSchemas.js` | `MODE_ENUM = z.enum(['sell'])` — remove trade, both, donate |
| `backend/services/checkoutSqlService.js` | Remove mode-based stat branching; always increment `salesCount` |
| `backend/services/clothesSqlService.js` | Remove `price = 0` branch for donate/trade; price is always required |

### Backend — No Change
- Routes (`clothesRoutes.js`, `checkoutRoutes.js`) — untouched
- Controllers — untouched
- DB schema (`drizzle/schema.ts`) — untouched

---

## Database Cleanup

### Step 1 — Verify before deleting
```sql
SELECT mode, COUNT(*) FROM clothes GROUP BY mode;
```
Confirm all non-sell rows are demo data before proceeding.

### Step 2 — Delete
```sql
DELETE FROM clothes WHERE mode IN ('donate', 'trade', 'both');
```

### Step 3 — Verify after
```sql
SELECT mode, COUNT(*) FROM clothes GROUP BY mode;
-- Expected: only 'sell' rows remain (or empty table)
```

---


---

## Technical Notes [C]

### Findings from code validation

**1. `DonationsView.tsx` is never imported anywhere.**
Grep across all `.ts` / `.tsx` files confirms zero imports of `DonationsView`. It is already dead code. Deletion requires no cleanup in any other file.

**2. `setView('donations')` is never called anywhere.**
The `'donations'` union member in `useAppStore` is dead. Removing it from the type is a pure cleanup with zero runtime impact.

**3. Three files were missing from the original plan:**
- `ProfilePage.tsx` — renders mode badges (isTrade, isDonate) in the user's closet grid
- `app/user/[id].tsx` — renders mode badges and price fallback ('TRADE') in public profile view
- `app/resale/[id].tsx` — type annotation on `mode` field still references the full union; validation condition on line 82 checks for `both` which no longer exists

**4. `add-item.tsx` — specific changes beyond UI removal:**
- `form.mode` initial state must change from `'' as 'trade' | 'sell' | 'both' | 'donate'` → `'sell'`
- `canSave` check `!!form.mode` can be removed (always true when hardcoded)
- `getSaveBtnLabel()` case `'Select a listing mode'` must be removed
- Price field condition `(form.mode === 'sell' || form.mode === 'both')` → always visible
- Imports `ArrowRightLeft`, `Heart` become unused → remove

**5. `item/[id].tsx` — specific changes:**
- `renderModeBadge`: remove `trade`, `donate`, `both` cases; keep only `sell`
- Price display: `item.mode === 'donate' ? 'FREE' : (item.price ? ... : 'TRADE')` → `item.price ? \`${item.price} RON\` : '-'`
- CTA button label: `item.mode === 'sell' ? 'ADD TO CART' : 'PROPOSE TRADE'` → always `'ADD TO CART'`
- Imports `ArrowRightLeft`, `Gift` become unused → remove
- Styles `tradeBadge`, `donateBadge`, `bothBadge` → remove

**6. `clothesSchemas.js` — refine simplification:**
The `.refine()` currently checks `if mode === 'sell' || mode === 'both'`. With mode always being `'sell'`, price is always required. Recommend removing the refine and making `price` directly required in the schema: `z.number().positive()`.

**7. `clothesSqlService.js` line 179:**
`price: data.mode === 'trade' || data.mode === 'donate' ? 0 : parseFloat(data.price)` → `price: parseFloat(data.price)`

## Execution Order

1. DB cleanup (verify → delete → verify)
2. `backend/validators/clothesSchemas.js` — restrict enum + simplify price validation
3. `backend/services/checkoutSqlService.js` — always `salesCount++`
4. `backend/services/clothesSqlService.js` — remove price branch
5. `frontend/hooks/useClothes.ts` — type update
6. `frontend/store/useAppStore.ts` — remove `'donations'` view type
7. `frontend/app/add-item.tsx` — UI and logic cleanup
8. `frontend/components/SwipeCard.tsx` — badge cleanup
9. `frontend/components/FilterModal.tsx` — MODES array cleanup
10. `frontend/app/item/[id].tsx` — badge + price + CTA cleanup
11. `frontend/components/ProfilePage.tsx` — closet grid badge cleanup
12. `frontend/app/user/[id].tsx` — public profile badge cleanup
13. `frontend/app/resale/[id].tsx` — type annotation update
14. Delete `frontend/components/DonationsView.tsx`

## Open Questions / Future Extensibility Notes

- [C] The `mode` column in `clothes` is retained. When new listing types are introduced (e.g., `auction`, `rental`), extend the validator enum and add UI selectively.
- [C] `donationsCount` and `tradesCount` in `users` remain as dead columns for now. If the feature is permanently dropped, a future migration can remove them.
- [C] No Drizzle migration is required for this task — schema is unchanged.
