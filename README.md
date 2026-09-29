# Tempo — a calm, focused to-do app

A full-stack to-do list built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** and **TypeScript**.

## Features

- **Full CRUD** for tasks and lists, with a REST API and Zod validation
- **Optimistic UI**: every change shows up instantly and rolls back if the server rejects it
- **Undo** for deleting tasks, deleting lists and clearing completed tasks
- **Smart views**: All, Today (includes overdue), Upcoming (grouped by date), Important, Completed
- **Custom lists** with colour labels (create, rename, recolour, delete)
- **Task details panel**: title, list, due date, priority, subtasks with progress, notes
- **Drag-and-drop reordering** (mouse, touch and keyboard)
- **Search** across titles, notes and subtasks; **sorting** by manual order, due date, priority, newest or A–Z
- Inline rename (double-click a task), progress ring, empty-state illustrations
- **Light, dark and system themes** with no flash on load
- **Keyboard shortcuts**: `N` new task · `/` search · `Space` toggle focused task · `Enter` open · `Esc` close
- Responsive: the sidebar becomes a drawer and the details panel becomes a sheet on small screens
- Accessible: ARIA roles, visible focus rings, and support for reduced motion

## Getting started

Data is stored in [Neon](https://neon.com) Postgres. Set `DATABASE_URL` to a Neon connection string (adding Neon to the project from the Vercel Marketplace sets it for you), then:

```bash
npm install
vercel env pull .env.local   # or put DATABASE_URL=… in .env.local yourself
npm run dev
# open http://localhost:3000
```

Tables are created on the first request, along with a few sample tasks.

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/todos?listId=&completed=&q=` | List tasks (filterable) |
| POST | `/api/todos` | Create a task |
| GET / PATCH / DELETE | `/api/todos/:id` | Read / update / delete a task |
| POST | `/api/todos/bulk` | `clearCompleted`, `reorder`, `restore` |
| GET / POST | `/api/lists` | List / create lists |
| PATCH / DELETE | `/api/lists/:id` | Update / delete a list (and its tasks) |

## Project structure

```
src/
  app/            layout, page (server-loads initial data), api/ route handlers
  components/     store (context + optimistic actions), UI primitives, views
  lib/            db (Neon Postgres), validation (zod), selectors, dates
```

`src/lib/db.ts` is the only module that touches storage.
