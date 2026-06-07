# Family Tree Frontend

Run locally:

1. Install dependencies and run dev server:

```powershell
cd "D:\Family Tree Project\frontend"
npm install
npm run dev
```

This starts Next.js on port 3000. The backend is expected on port 3001 at `/api`.

Login: open `/login` and use a mock token like `alice` with role `admin`/`editor`/`viewer`.

Supabase setup:

- Create a Supabase project at https://app.supabase.com
- Go to Project Settings > API and copy the `Project URL` and `anon public` key.
- In Project Settings > API find the `JWT Secret` and copy it for the backend.
- In Authentication > Settings > External OAuth Providers enable Google and add redirect URL: `http://localhost:3000/login`.

Create a `.env.local` with these values:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

After login, the app stores the Supabase access token in `localStorage` and sends it as `Authorization: Bearer <token>` to the backend.
