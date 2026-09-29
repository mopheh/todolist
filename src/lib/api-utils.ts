import "server-only";
import { ZodError } from "zod";
import { ConflictError, NotFoundError } from "./db";

export async function handle<T>(fn: () => Promise<T>, status = 200): Promise<Response> {
  try {
    const data = await fn();
    return Response.json(data, { status });
  } catch (err) {
    if (err instanceof ZodError) {
      return Response.json(
        { error: err.issues[0]?.message ?? "Invalid request", issues: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof NotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ConflictError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Malformed JSON body" }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
