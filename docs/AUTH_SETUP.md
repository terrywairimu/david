# Auth & Settings Setup

## Overview

The app uses **Supabase Auth** with email/password and Google OAuth. Role-based access is stored in `app_user_profiles`.

## Environment Variables

Ensure `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Google OAuth Setup

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google OAuth Client ID and Secret (from Google Cloud Console)
4. Add redirect URL: `https://your-domain.com/auth/callback` (or `http://localhost:3000/auth/callback` for dev)

## Roles & Access

| Role | Settings Access | Can Assign Roles | Can Assign Sections/Actions |
|------|-----------------|------------------|-----------------------------|
| **superadmin** | ✅ | ✅ | ✅ |
| **ceo** | ✅ | ✅ | ✅ |
| **deputy_ceo** | ✅ | ✅ | ✅ |
| sales, finance, design | ❌ | ❌ | ❌ |
| No role | ❌ | ❌ | ❌ |

- New sign-ups have **no role** until assigned in Settings by an admin
- **Sections**: Controls sidebar visibility (register, sales, payments, etc.)
- **Action buttons**: add, edit, delete, export, view — use `useAuth().canPerformAction('add')` in components

## First-Time Setup

1. Sign up with email or Google
2. In Supabase Dashboard → **Table Editor** → `app_user_profiles`, set your user's `role` to `superadmin` (or run SQL: `UPDATE app_user_profiles SET role = 'superadmin' WHERE email = 'your@email.com'`)
3. Refresh the app — Settings link appears below Analytics
4. Assign roles, sections, and action buttons to other users
