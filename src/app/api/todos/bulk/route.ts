import type { NextRequest } from "next/server";
import { clearCompleted, reorderTodos, restore } from "@/lib/db";
import { handle } from "@/lib/api-utils";
import { bulkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/todos/bulk  { action: "clearCompleted" | "reorder" | "restore", … }
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = bulkSchema.parse(await req.json());
    switch (body.action) {
      case "clearCompleted":
        return { removed: await clearCompleted(body.listId) };
      case "reorder":
        await reorderTodos(body.ids);
        return { ok: true };
      case "restore":
        return { restored: await restore(body.todos, body.list) };
    }
  });
}
