import type { NextRequest } from "next/server";
import { deleteTodo, getTodo, updateTodo } from "@/lib/db";
import { handle } from "@/lib/api-utils";
import { updateTodoSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/todos/[id]">) {
  return handle(async () => getTodo((await ctx.params).id));
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/todos/[id]">) {
  return handle(async () => {
    const { id } = await ctx.params;
    return updateTodo(id, updateTodoSchema.parse(await req.json()));
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/todos/[id]">) {
  return handle(async () => deleteTodo((await ctx.params).id));
}
