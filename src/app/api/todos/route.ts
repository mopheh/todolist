import type { NextRequest } from "next/server";
import { createTodo, getState } from "@/lib/db";
import { handle } from "@/lib/api-utils";
import { createTodoSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/todos?listId=…&completed=true|false&q=…
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { searchParams } = req.nextUrl;
    const listId = searchParams.get("listId");
    const completed = searchParams.get("completed");
    const q = searchParams.get("q")?.toLowerCase().trim();

    let { todos } = await getState();
    if (listId) todos = todos.filter((t) => t.listId === listId);
    if (completed === "true" || completed === "false") {
      todos = todos.filter((t) => t.completed === (completed === "true"));
    }
    if (q) {
      todos = todos.filter(
        (t) => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q),
      );
    }
    return [...todos].sort((a, b) => a.order - b.order);
  });
}

// POST /api/todos
export async function POST(req: NextRequest) {
  return handle(async () => createTodo(createTodoSchema.parse(await req.json())), 201);
}
