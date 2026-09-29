# AGENTS.md

Tempo is a to-do app: Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Neon Postgres.

## Commands
- Install: `npm install`
- Dev: `npm run dev` (http://localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test`  <!-- delete if package.json has no test script -->
- Typecheck: `npx tsc --noEmit`

## Setup
- `DATABASE_URL` (a Neon connection string) is required in `.env.local`
- Get it with `vercel env pull .env.local`, or paste it in yourself
- Tables and sample tasks are created automatically on the first request. Don't write schema or seed scripts.

## Architecture
- `src/lib/db.ts` is the only module that touches storage. Never query the database from anywhere else.
- Validate all API input with Zod (`src/lib/validation`)
- `src/app/page` loads the initial data on the server
- Client state lives in the store (`src/components/store`). All mutations go through its optimistic actions, which roll back if the server rejects the change.
- Destructive actions (delete task, delete list, clear completed) must stay undoable
- Smart views (All, Today, Upcoming, Important, Completed) are computed in `src/lib/selectors`. Don't duplicate that filtering in components.
- Date logic belongs in `src/lib/dates`

## Conventions
- TypeScript strict mode; no `any`
- Tailwind v4 only: there is no `tailwind.config.js`, so configure via CSS
- Use theme tokens for colors so light, dark and system themes keep working
- Every interactive element needs an ARIA role/label and a visible focus ring
- Animations must respect `prefers-reduced-motion`
- Keep keyboard shortcuts working (`N`, `/`, `Space`, `Enter`, `Esc`) when changing task UI
- Layouts must work on small screens (sidebar becomes a drawer, details panel becomes a sheet)

## Stack notes
- Next 16 and React 19 are newer than most models' training data. Check the docs in `node_modules/next/dist/docs/` or online before using an API from memory.
- `params` and `searchParams` are async in recent Next versions. Await them.