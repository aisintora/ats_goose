# AI Call Demo

## Deployment

- **Vercel**: No CI/CD. Deploy manually via `npx vercel --prod`
- **Supabase migrations**: Push via `supabase db push` (project already linked). Migration files in `supabase/migrations/`

## Stack

- SvelteKit (Svelte 5, runes) + Tailwind CSS v4
- Supabase (Postgres + Realtime + Storage)
- ElevenLabs Conversational AI (voice agents via SIP trunk)
- Zadarma (SIP telephony) — **NEVER use Twilio**
- Anthropic SDK + MiniMax for post-call analysis (NOT OpenAI)

## Rules

- Never expose technology provider names (ElevenLabs, Zadarma) in UI
- Never fix issues by editing database directly — always fix in code
- Always build locally (`npx vite build`) before deploying
- Ukrainian language only in UI
