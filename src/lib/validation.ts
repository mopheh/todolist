import { z } from "zod";
import { LIST_COLORS } from "./types";

const priority = z.enum(["none", "low", "medium", "high"]);
const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .nullable();

const subtask = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  completed: z.boolean(),
});

export const createTodoSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().max(5000).optional().default(""),
  priority: priority.optional().default("none"),
  dueDate: dueDate.optional().default(null),
  listId: z.string().nullable().optional().default(null),
});

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    notes: z.string().max(5000),
    completed: z.boolean(),
    priority,
    dueDate,
    listId: z.string().nullable(),
    subtasks: z.array(subtask).max(100),
  })
  .partial();

export const bulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("clearCompleted"), listId: z.string().nullable().optional() }),
  z.object({ action: z.literal("reorder"), ids: z.array(z.string()).max(5000) }),
  z.object({
    action: z.literal("restore"),
    todos: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().trim().min(1).max(200),
          notes: z.string().max(5000),
          completed: z.boolean(),
          priority,
          dueDate,
          listId: z.string().nullable(),
          subtasks: z.array(subtask).max(100),
          order: z.number(),
          createdAt: z.string(),
          updatedAt: z.string(),
          completedAt: z.string().nullable(),
        }),
      )
      .max(5000),
    list: z
      .object({
        id: z.string(),
        name: z.string().trim().min(1).max(60),
        color: z.enum(LIST_COLORS),
        createdAt: z.string(),
      })
      .nullable()
      .optional(),
  }),
]);

export const createListSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.enum(LIST_COLORS).optional().default("violet"),
});

export const updateListSchema = createListSchema.omit({ id: true }).partial();

export type CreateTodoInput = z.input<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type CreateListInput = z.input<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
