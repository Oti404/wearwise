# IMPLEMENTATION.md — Frontend Copy & Text Cleanup

## Goal
Audit and correct all user-facing text in the frontend. Three categories of issues:
1. **Language mixing** — Romanian strings mixed into an otherwise English UI
2. **Stale references** — text that references deleted features (donate, trade)
3. **Copy quality** — unprofessional, vague, or inconsistent phrasing

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | All user-facing text must be English | Consistency with app language policy |
| 2 | Remove all donate/trade copy references | Feature was removed |
| 3 | Standardize tone: professional but warm | Target audience is fashion-conscious users |
| 4 | Remove emojis from UI labels | Emojis belong in marketing, not functional UI labels |
| 5 | Fix "Investment" as price label — use "Price" | "Investment" is misleading in a marketplace context |

---

## Changes Per File

### `frontend/components/NotificationsView.tsx`
| Before | After |
|--------|-------|
| "Activitate" (header tag) | "Activity" |
| "Notificări" (title) | "Notifications" |
| "Reîmprospătează" (button) | "Refresh" |
| "Nu ai nicio notificare momentan." | "You have no notifications yet." |
| "Apasă pentru a evalua" | "Tap to rate" |
| "Evaluare trimisă ✅" | "Review submitted" |
| "Sfârșitul actualizărilor" | "You're all caught up" |
| "Recent" | "Just now" |

### `frontend/components/AuthUI.tsx`
| Before | After |
|--------|-------|
| "Se încarcă..." | "Loading..." |

### `frontend/app/register.tsx` (RegisterScreen)
| Before | After |
|--------|-------|
| "Se încarcă..." (loading state) | "Loading..." |

### `frontend/components/ProfilePage.tsx`
| Before | After |
|--------|-------|
| "Istoric (cumpărări / vânzări)" (settings item) | "Purchase & Sales History" |
| "TRADES" (stat label) | Remove stat or rename to "RESALES" |
| "DONATIONS" (stat label) | Remove stat |
| "My Wardrobe ♻️" (section title) | "My Wardrobe" |
| "Coming soon!" (edit profile) | "Edit Profile" (disable button gracefully instead) |

### `frontend/components/CartView.tsx`
| Before | After |
|--------|-------|
| "FREE / TRADE" (item price display) | "—" |
| "Explore the wardrobe and add clothes you love by Swiping Right ❤️" | "Browse the feed and swipe right on items you want to buy." |

### `frontend/app/item/[id].tsx`
| Before | After |
|--------|-------|
| "Investment" (price label) | "Price" |
| "This item doesn't have a description, but it's certainly waiting for a fresh start!" | "No description provided." |
| "Back to Wardrobe" (error back button) | "Go Back" |

### `frontend/app/add-item.tsx`
| Before | After |
|--------|-------|
| "New in Wardrobe" (screen title) | "List an Item" |
| "Item Story (Description)" (label) | "Description" |
| "Where can we find you?" (section title) | "Location" |
| "Help the buyer know where the item is located." | "Set a pickup or reference location for buyers." |
| "Fields pre-filled by AI — feel free to edit" | "AI-suggested fields — review before saving." |
| "Uploading Item..." | "Uploading..." |

### `frontend/app/resale/[id].tsx`
| Before | After |
|--------|-------|
| "Your resale price (RON)" (label) | "Resale Price (RON)" |
| "Relisting will move the product to your buy list and make it visible to others." | "This item will be listed in your wardrobe and visible to other users." |
| "The item was relisted with new details! ✨" (alert) | "Item relisted successfully." |
| "Awesome!" (alert button) | "Done" |

### `frontend/app/(tabs)/notifications.tsx`
| Before | After |
|--------|-------|
| "Your donation request was accepted." (hardcoded example) | Remove or replace with relevant example |
| "Activity" (title) | "Notifications" |

### `frontend/components/SwipeView.tsx`
| Before | After |
|--------|-------|
| "Wardrobe explored!" (empty state title) | "You're all caught up" |
| "We checked everything within a radius of {radius}km. Check back soon for updates!" | "No new items within {radius} km. Check back soon." |
| "Nothing yet..." (community empty title) | "Nothing here yet" |
| "Follow users in the Network tab to see their items here!" | "Follow users in the Network tab to see their listings." |
| "Finalizing addition..." | "Finishing up..." |

### `frontend/app/user/[id].tsx`
| Before | After |
|--------|-------|
| "Digital Nomad" (fallback location) | "Location not set" |

### `frontend/components/RatingModal.tsx`
| Before | After |
|--------|-------|
| "Product Rating" (title) | "Rate Your Purchase" |
| "How was the purchase for {itemName}?" | "How was your experience with {itemName}?" |
| "Very poor" | "Poor" |
| "Excellent! ✨" | "Excellent" |

---

## Files NOT Changing
- `FilterModal.tsx` — copy is clean
- `SwipeCard.tsx` — minimal text, correct
- `LoginScreen.tsx` — copy is acceptable
- `RegisterScreen.tsx` — copy is acceptable (except loading state)
- `RadiusSelector.tsx` — minimal, correct

---

## Execution Order
1. `NotificationsView.tsx` — highest density of Romanian text
2. `AuthUI.tsx` — quick single fix
3. `ProfilePage.tsx` — stale feature references
4. `CartView.tsx` — stale trade reference
5. `item/[id].tsx` — copy quality fixes
6. `add-item.tsx` — copy quality fixes
7. `resale/[id].tsx` — copy quality fixes
8. `SwipeView.tsx` — empty state improvements
9. `notifications.tsx` tab — stale donation reference
10. `user/[id].tsx` — minor fix
11. `RatingModal.tsx` — tone improvements
