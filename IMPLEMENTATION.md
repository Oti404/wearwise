# Feature: Community Feed & Social Wardrobe (Replacing Donations)

### [A] Architecture Validation
- **Problem Statement:** The user wants to replace the legacy "Donations" page with a new "Community" feature (Instagram for clothes). Users can follow/unfollow each other, view a profile's wardrobe for sale, buy directly, and have a dedicated scrollable feed of followed users' items. Follow notifications are required.
- **Proposed Solution:** 
  1. **UI Restructuring (BottomNav):** We will remove the `donations.tsx` screen and modify `BottomNav.tsx` to eliminate the Donations tab. 
  2. **Top Tabs in SwipeView:** Inside the main swipe tab (`SwipeView.tsx`), we will introduce a sticky top toggle with two modes: **Discover** (default Swipe mechanism) and **Community** (a vertical `FlatList` feed).
  3. **The Network Page (Searching & Discovery):** A new `network.tsx` screen will be the hub for finding new accounts.
     - **Topbar:** Sticky search bar for searching users by name or style.
     - **Trendy Carousel:** A "Featured" horizontal list showing local trendy accounts. Each card will showcase the user's avatar, name, and a "preview" of 3 recent clothing items from their wardrobe.
     - **Explore Section:** A grid layout ("Explore accounts") showing suggested users based on location and style similarity.
  4. **The Feed (Frontend -> Backend):** The "Community" scrolling list will fetch data from the already existing backend route `GET /api/follows/following-feed`. This route natively handles joining the `clothes` table with the `follows` table.
  5. **Public Profile & Wardrobe:** We will create a new dynamic screen at `app/user/[id].tsx`. This page will fetch `GET /api/follows/public-profile/:userId`, displaying the user's avatar, stats (followers/following), and a grid of their active clothing items. 
  6. **Follow & Notifications:** A "Follow" button will be placed on the profile screen hitting `POST /api/follows/follow`. *Advantage:* The backend `followService.followUser` is already perfectly programmed to automatically insert a notification with `type: 'follow'` and a message: `"[Name] started following you."`. We just need to ensure the frontend notification tap redirects to `/user/[id]`.
- **Modules Affected:** Frontend App (Routing, `BottomNav.tsx`, `SwipeView.tsx`, `network.tsx`, new `user/[id].tsx`), API hooks.
- **Risks & Tradeoffs:** 
  - *Performance:* Loading a FlatList inside the same parent container as the Deck Swiper might cause minor state lags. We must cleanly unmount the Swiper when "Community" is active.
  - *Refactoring:* The donations feature code will be entirely removed or hidden. If we remove it from `_layout.tsx`, all its assets/store bindings might become dead code.
- **Status:** Pending User Approval

### [A] Missing Elements / Suggestions (Answers to user's questions)
- **Question:** "Ce alte sugestii sau imbunatatiri imi lipsesc mie aici?"
- **Suggestion 1 (Search):** We need a way to FIND users to follow in the first place! I suggest adding a "Search Users" or "Suggested Accounts" horizontal list at the very top of the Community vertical feed. The backend already has `GET /api/follows/community/suggested` ready for this!
- **Suggestion 2 (Bottom Nav Fix):** With "Donations" removed, the bottom nav only has 3 items: [Empty?], Swipe(Center), Profile. I suggest replacing "Donations" with a "Network / Search" tab, or just neatly spacing a 2-item + 1-center layout. For now, we can just center "Activity/Notifications" and "Profile".
- **Suggestion 3 (Add to Cart UX):** When tapping a clothing item from the profile page, we will route them directly to `/app/item/[id]` where the native UI for Add to Cart already exists. This ensures we don't duplicate code.

### [C] Execution Plan
- [x] 1. Clean up `donations.tsx` and reconfigure `BottomNav` to include the **Network** tab (replacing Donations).
- [x] 2. Update the frontend API hook (`useFollow.ts`) to connect `getFollowingFeed`, `followUser`, `unfollowUser`, `getPublicProfile`, and `getSuggestedAccounts`.
- [x] 3. Create the `app/user/[id].tsx` public profile screen.
- [x] 4. Build the `app/(tabs)/network.tsx` screen:
    - [x] Implement Top Search Bar.
    - [x] Implement "Trendy Local Accounts" Carousel (User Card with 3-item preview).
    - [x] Implement "Explore Accounts" section.
- [x] 5. Refactor `SwipeView.tsx` to include the `Discover | Community` top toggle and render the `FlatList` feed.
- [x] 6. Implement Add to Cart UX: Ensure tapping items in profile/network routes to `/app/item/[id]`.
- [x] 7. Connect notification routing so tapping a "follow" notification sends the user to the profile.
