# PocketBase schema: User tiers

This project uses **3 paid tiers** stored on the `users` collection:

| Value | Name    | Meaning                    |
|-------|--------|----------------------------|
| `0`   | Free   | Not paying (default)       |
| `1`   | Tier 1 | Lowest paid plan           |
| `2`   | Tier 2 | Middle paid plan           |
| `3`   | Tier 3 | Highest paid plan          |

## Add `tier` to the users collection

1. Start PocketBase: from repo root run `pocketbase serve`.
2. Open Admin UI: http://127.0.0.1:8090/_/
3. Log in and go to **Collections** → **users**.
4. Click **"+ New field"**.
5. Configure:
   - **Type:** Number
   - **Name:** `tier`
   - **Required:** No (so existing users and free users have no tier = treated as 0)
   - **Min:** 0
   - **Max:** 3
   - **Default value:** 0 (optional; leave empty if you prefer null for “not set”)
6. Save.

## API behavior

- **Auth responses** (e.g. `authWithPassword`, `auth-refresh`) will include `tier` on the user record.
- **Backend** `get_current_user` includes `tier` in the user payload.
- **Frontend** `useAuthStore` exposes `user.tier`; use `TIER_1`, `TIER_2`, `TIER_3` from `constants/tiers.js` for checks.

## Updating a user’s tier

- In Admin UI: **Collections** → **users** → select user → set **tier** (0–3).
- Via API (e.g. after payment): `PATCH /api/collections/users/records/<userId>` with `{ "tier": 1 }` (or 2, 3). Ensure the request is authenticated and only allowed for your backend or admin.
