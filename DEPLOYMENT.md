# Web SaaS Deployment

## Target

This project is a browser-based SaaS web app.

It is not:

- Electron
- Windows installer
- Mobile app
- Local database software

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Shadcn-style UI
- Supabase Auth + Postgres
- OpenAI API
- Vercel deployment

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Enable Email auth in Supabase Authentication.
4. Add the deployed Vercel domain to Supabase Auth redirect URLs:
   - `https://YOUR_DOMAIN.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

## Vercel Environment Variables

Set these variables in Vercel Project Settings:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Reserved for later:

- `CLAUDE_API_KEY`
- `GEMINI_API_KEY`
- `PERPLEXITY_API_KEY`
- `GROK_API_KEY`
- `CUSTOM_AI_BASE_URL`
- `CUSTOM_AI_API_KEY`

## Deploy

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Add environment variables.
4. Deploy.
5. Open the generated Vercel URL in Chrome.

## SaaS Behavior

When Supabase environment variables are configured:

- Unauthenticated users are redirected to `/login`.
- Users can create an account or sign in by email/password.
- App pages and APIs are protected by middleware.
- AI reports, scores, decisions, market intelligence, opportunities, and alerts can be saved to Supabase.

When Supabase variables are not configured:

- The app can still run locally for development.
- Auth protection is skipped.
- Data stores fall back to in-memory behavior.
