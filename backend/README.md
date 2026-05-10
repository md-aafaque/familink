# Family Tree Backend

Run locally:

1. Copy `.env.example` to `.env` and set credentials (Neo4j, SUPABASE_JWT_SECRET)

2. Install and run:

```powershell
cd backend
npm install
npm run dev
```

API base: `http://localhost:3001/api`

Auth: send `Authorization: Bearer <token>` header. For quick testing you can use `MOCK:<userId>:<role>` token, e.g. `MOCK:alice:admin`.

Supabase integration (server-side)
- If you want the backend to verify Supabase access tokens, set these env vars in `backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # keep this secret, server-only
```

The auth plugin will use the service role key to call `auth.getUser()` to validate incoming access tokens. If the service key is not provided, it will fall back to the legacy `SUPABASE_JWT_SECRET` verification or accept `MOCK:` tokens for local testing.
