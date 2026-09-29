import type { NextRequest } from "next/server";
import { createList, getState } from "@/lib/db";
import { handle } from "@/lib/api-utils";
import { createListSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => (await getState()).lists);
}

export async function POST(req: NextRequest) {
  return handle(async () => createList(createListSchema.parse(await req.json())), 201);
}
