import type { NextRequest } from "next/server";
import { deleteList, updateList } from "@/lib/db";
import { handle } from "@/lib/api-utils";
import { updateListSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/lists/[id]">) {
  return handle(async () => {
    const { id } = await ctx.params;
    return updateList(id, updateListSchema.parse(await req.json()));
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/lists/[id]">) {
  return handle(async () => deleteList((await ctx.params).id));
}
