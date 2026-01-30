# PocketBase schema

## User tiers

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

---

## Projects collection (user project library)

The **projects** collection stores saved editor snapshots so each user has a library of projects.

### Create the `projects` collection

1. Start PocketBase and open Admin UI: http://127.0.0.1:8090/_/
2. **Collections** → **"+ New collection"** → Name: `projects`.
3. Add these fields:

| Field         | Type     | Required | Notes                                      |
|---------------|----------|----------|--------------------------------------------|
| `user`        | Relation | Yes      | Single, collection: **users** (owner)      |
| `name`        | Text     | Yes      | Project display name                       |
| `description` | Text     | No       | Optional description                       |
| `snapshot`    | JSON     | Yes      | Full project state (objects, timeline, messages, etc.) |

4. **API Rules** (so only the owner can access their projects):

   - **List:** `user = @request.auth.id`
   - **View:** `user = @request.auth.id`
   - **Create:** `@request.auth.id != ""` (and send `user: auth.id` from the app)
   - **Update:** `user = @request.auth.id`
   - **Delete:** `user = @request.auth.id`

5. Save the collection.

### What you need to do

- Create the `projects` collection and fields as above.
- Set the API rules so only the authenticated user can list/create/update/delete their own projects.
- Ensure users are logged in when using the dashboard and editor; the app sends `user: pb.authStore.model.id` when creating a project.
