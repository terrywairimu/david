# Auth & Data Loading Troubleshooting

## Cabinet Masters 2024 / No Data Loading

### Investigation Summary (Feb 2025)

**Database check (zimjjyazuwjopvsubcuk):**
- ✅ `cabinetmasters2024@gmail.com` exists in `app_user_profiles` with `superadmin` role
- ✅ Profile has full sections and action_buttons
- ✅ RLS policies on all data tables: `allow_authenticated_all` with `qual: true` — any authenticated user can SELECT/INSERT/UPDATE/DELETE

**Root cause:** If a user sees no data, the Supabase client is making requests as **anon** (unauthenticated) instead of **authenticated**. RLS allows only `authenticated` role, so anon requests return empty.

### Session/Cookie Sync Fix Applied

The middleware was updated to:
1. **Properly propagate refreshed cookies** — When Supabase refreshes the token, `setAll` now updates both `request.cookies` and `supabaseResponse.cookies` so the browser receives the session
2. **Use `getClaims()`** — Validates JWT and triggers refresh (per Supabase SSR docs)

### If Data Still Doesn't Load

1. **Run the debug route** — While logged in as cabinetmasters2024, visit `/api/debug-auth`. Check:
   - `hasUser` / `hasSession` — should be `true`
   - `profile` — should show your superadmin profile
   - `entitiesCount` — should be a number (not null)
   - If `hasUser` is false, the server isn't seeing your session (cookies not sent or wrong domain)

2. **Clear browser cookies** for your site and sign in again
3. **Check browser DevTools** → Application → Cookies — look for `sb-zimjjyazuwjopvsubcuk-auth-token` (or similar)
4. **Network tab** — When the app fetches from Supabase (e.g. `rest/v1/registered_entities`), the request should include `Authorization: Bearer <jwt>`. If it's missing, the session isn't being sent
5. **Sign out and sign in again** — Ensures a fresh session with correct cookies

### Redirect URLs (Supabase Dashboard)

Ensure **Authentication → URL Configuration** includes:
- Production: `https://your-domain.com/auth/callback`
- Local: `http://localhost:3000/auth/callback`

### RLS Policies (Reference)

All main tables use:
```sql
create policy "allow_authenticated_all" on <table>
  for all to authenticated
  using (true) with check (true);
```

No user-specific filtering — any authenticated user sees all rows.
