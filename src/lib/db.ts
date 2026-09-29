import "server-only";
import { randomUUID } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Database, ListColor, Priority, Subtask, Todo, TodoList } from "./types";
import type {
  CreateListInput,
  CreateTodoInput,
  UpdateListInput,
  UpdateTodoInput,
} from "./validation";

/**
 * Postgres persistence on Neon, via the serverless HTTP driver. Every
 * mutation is a single statement or a single non-interactive transaction, so
 * concurrent requests across serverless instances stay consistent.
 *
 * Tables are created (and seeded with sample tasks) on first use, so a fresh
 * database needs no manual migration. The API routes only depend on the
 * exported functions.
 */

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;
let _ready: Promise<void> | null = null;

// Lazily connect so `next build` doesn't need DATABASE_URL.
function client(): Sql {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

async function db(): Promise<Sql> {
  const sql = client();
  _ready ??= migrate(sql).catch((err) => {
    _ready = null; // retry on the next request
    throw err;
  });
  await _ready;
  return sql;
}

async function migrate(sql: Sql) {
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS lists (
      id          text PRIMARY KEY,
      name        text NOT NULL,
      color       text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS todos (
      id            text PRIMARY KEY,
      title         text NOT NULL,
      notes         text NOT NULL DEFAULT '',
      completed     boolean NOT NULL DEFAULT false,
      priority      text NOT NULL DEFAULT 'none',
      due_date      text,
      list_id       text REFERENCES lists(id) ON DELETE CASCADE,
      subtasks      jsonb NOT NULL DEFAULT '[]'::jsonb,
      position      double precision NOT NULL DEFAULT 0,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now(),
      completed_at  timestamptz
    )`,
    sql`CREATE INDEX IF NOT EXISTS todos_list_id_idx ON todos (list_id)`,
    sql`CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY)`,
  ]);

  // Only the instance that claims the "seeded" marker inserts sample data.
  const claimed = await sql`
    INSERT INTO meta (key) VALUES ('seeded') ON CONFLICT DO NOTHING RETURNING key`;
  if (claimed.length > 0) await insertSeed(sql);
}

// ---------- Row mapping ----------

type Row = Record<string, unknown>;

const iso = (v: unknown) => new Date(v as string | Date).toISOString();

function toTodo(r: Row): Todo {
  return {
    id: r.id as string,
    title: r.title as string,
    notes: r.notes as string,
    completed: r.completed as boolean,
    priority: r.priority as Priority,
    dueDate: (r.due_date as string | null) ?? null,
    listId: (r.list_id as string | null) ?? null,
    subtasks: (r.subtasks as Subtask[]) ?? [],
    order: Number(r.position),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    completedAt: r.completed_at ? iso(r.completed_at) : null,
  };
}

function toList(r: Row): TodoList {
  return {
    id: r.id as string,
    name: r.name as string,
    color: r.color as ListColor,
    createdAt: iso(r.created_at),
  };
}

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

/** Maps Postgres constraint violations onto the API's error types. */
async function run<T>(fn: () => Promise<T>, fkMessage = "List not found"): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23503") throw new NotFoundError(fkMessage);
    if (code === "23505") throw new ConflictError("A record with this id already exists");
    throw err;
  }
}

// ---------- Seed ----------

async function insertSeed(sql: Sql) {
  const personal = randomUUID();
  const work = randomUUID();
  const today = new Date();
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const welcomeSubtasks = [
    { id: randomUUID(), title: "Complete a task", completed: false },
    { id: randomUUID(), title: "Create your own list", completed: false },
  ];

  await sql.transaction([
    sql`INSERT INTO lists (id, name, color) VALUES
      (${personal}, 'Personal', 'violet'),
      (${work}, 'Work', 'blue')`,
    sql`INSERT INTO todos (id, title, notes, priority, due_date, list_id, subtasks, position, completed, completed_at) VALUES
      (${randomUUID()}, 'Welcome to Tempo 👋',
        'Click any task to open its details. Press N to add a task, / to search, and drag the handle to reorder.',
        'medium', ${ymd(today)}, NULL, ${JSON.stringify(welcomeSubtasks)}::jsonb, 0, false, NULL),
      (${randomUUID()}, 'Review quarterly roadmap', '', 'high', ${ymd(tomorrow)}, ${work}, '[]'::jsonb, 1, false, NULL),
      (${randomUUID()}, 'Book dentist appointment', '', 'low', NULL, ${personal}, '[]'::jsonb, 2, false, NULL),
      (${randomUUID()}, 'Buy groceries', '', 'none', NULL, ${personal}, '[]'::jsonb, 3, true, now())`,
  ]);
}

// ---------- Queries ----------

export async function getState(): Promise<Database> {
  const sql = await db();
  const [todos, lists] = await sql.transaction(
    [
      sql`SELECT * FROM todos ORDER BY position, created_at`,
      sql`SELECT * FROM lists ORDER BY created_at, name`,
    ],
    { readOnly: true },
  );
  return { todos: todos.map(toTodo), lists: lists.map(toList) };
}

export async function getTodo(id: string): Promise<Todo> {
  const sql = await db();
  const [row] = await sql`SELECT * FROM todos WHERE id = ${id}`;
  if (!row) throw new NotFoundError("Todo not found");
  return toTodo(row);
}

// ---------- Todos ----------

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const sql = await db();
  const [row] = await run(
    () => sql`
      INSERT INTO todos (id, title, notes, priority, due_date, list_id, position)
      SELECT ${input.id ?? randomUUID()}, ${input.title}, ${input.notes ?? ""},
             ${input.priority ?? "none"}, ${input.dueDate ?? null}, ${input.listId ?? null},
             COALESCE(MIN(position), 0) - 1 -- newest on top
      FROM todos
      RETURNING *`,
  );
  return toTodo(row);
}

export async function updateTodo(id: string, patch: UpdateTodoInput): Promise<Todo> {
  const sql = await db();
  const has = (k: keyof UpdateTodoInput) => patch[k] !== undefined;
  const [row] = await run(
    () => sql`
      UPDATE todos SET
        title        = COALESCE(${patch.title ?? null}, title),
        notes        = COALESCE(${patch.notes ?? null}, notes),
        priority     = COALESCE(${patch.priority ?? null}, priority),
        subtasks     = COALESCE(${patch.subtasks ? JSON.stringify(patch.subtasks) : null}::jsonb, subtasks),
        due_date     = CASE WHEN ${has("dueDate")} THEN ${patch.dueDate ?? null} ELSE due_date END,
        list_id      = CASE WHEN ${has("listId")} THEN ${patch.listId ?? null} ELSE list_id END,
        completed    = COALESCE(${patch.completed ?? null}::boolean, completed),
        completed_at = CASE
          WHEN ${patch.completed ?? null}::boolean IS NULL
            OR ${patch.completed ?? null}::boolean = completed THEN completed_at
          WHEN ${patch.completed ?? null}::boolean THEN now()
          ELSE NULL
        END,
        updated_at   = now()
      WHERE id = ${id}
      RETURNING *`,
  );
  if (!row) throw new NotFoundError("Todo not found");
  return toTodo(row);
}

export async function deleteTodo(id: string): Promise<Todo> {
  const sql = await db();
  const [row] = await sql`DELETE FROM todos WHERE id = ${id} RETURNING *`;
  if (!row) throw new NotFoundError("Todo not found");
  return toTodo(row);
}

export async function clearCompleted(listId?: string | null): Promise<Todo[]> {
  const sql = await db();
  const rows = await sql`
    DELETE FROM todos
    WHERE completed
      AND (${listId === undefined} OR list_id IS NOT DISTINCT FROM ${listId ?? null})
    RETURNING *`;
  return rows.map(toTodo);
}

export async function reorderTodos(ids: string[]): Promise<void> {
  const sql = await db();
  // Reassign order only among the given ids, keeping their existing slots.
  await sql`
    WITH input AS (
      SELECT DISTINCT ON (u.id) u.id, u.ord
      FROM unnest(${ids}::text[]) WITH ORDINALITY AS u(id, ord)
      JOIN todos t ON t.id = u.id
      ORDER BY u.id, u.ord
    ),
    ranked AS (SELECT id, row_number() OVER (ORDER BY ord) AS rn FROM input),
    slots AS (
      SELECT position, row_number() OVER (ORDER BY position) AS rn
      FROM todos WHERE id IN (SELECT id FROM input)
    )
    UPDATE todos SET position = slots.position
    FROM ranked JOIN slots USING (rn)
    WHERE todos.id = ranked.id`;
}

/** Re-inserts previously deleted records (powers "Undo"). */
export async function restore(todos: Todo[], list?: TodoList | null): Promise<Todo[]> {
  const sql = await db();
  const queries = [];
  if (list && typeof list.id === "string") {
    queries.push(sql`
      INSERT INTO lists (id, name, color, created_at)
      VALUES (${list.id}, ${list.name}, ${list.color}, ${list.createdAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  queries.push(sql`
    INSERT INTO todos (id, title, notes, completed, priority, due_date, list_id, subtasks,
                       position, created_at, updated_at, completed_at)
    SELECT x.id, x.title, x.notes, x.completed, x.priority, x."dueDate", l.id, x.subtasks,
           x."order", x."createdAt", x."updatedAt", x."completedAt"
    FROM jsonb_to_recordset(${JSON.stringify(todos)}::jsonb) AS x(
      id text, title text, notes text, completed boolean, priority text, "dueDate" text,
      "listId" text, subtasks jsonb, "order" double precision, "createdAt" timestamptz,
      "updatedAt" timestamptz, "completedAt" timestamptz
    )
    LEFT JOIN lists l ON l.id = x."listId"
    ON CONFLICT (id) DO NOTHING
    RETURNING *`);
  const results = await sql.transaction(queries);
  return results[results.length - 1].map(toTodo);
}

// ---------- Lists ----------

export async function createList(input: CreateListInput): Promise<TodoList> {
  const sql = await db();
  const [row] = await run(
    () => sql`
      INSERT INTO lists (id, name, color)
      VALUES (${input.id ?? randomUUID()}, ${input.name}, ${input.color ?? "violet"})
      RETURNING *`,
  );
  return toList(row);
}

export async function updateList(id: string, patch: UpdateListInput): Promise<TodoList> {
  const sql = await db();
  const [row] = await sql`
    UPDATE lists SET
      name  = COALESCE(${patch.name ?? null}, name),
      color = COALESCE(${patch.color ?? null}, color)
    WHERE id = ${id}
    RETURNING *`;
  if (!row) throw new NotFoundError("List not found");
  return toList(row);
}

/** Deletes a list along with every task inside it. */
export async function deleteList(id: string): Promise<{ list: TodoList; todos: Todo[] }> {
  const sql = await db();
  const [todos, lists] = await sql.transaction([
    sql`DELETE FROM todos WHERE list_id = ${id} RETURNING *`,
    sql`DELETE FROM lists WHERE id = ${id} RETURNING *`,
  ]);
  if (!lists[0]) throw new NotFoundError("List not found");
  return { list: toList(lists[0]), todos: todos.map(toTodo) };
}
