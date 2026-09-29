import type { Todo, TodoList } from "./types";
import type { CreateListInput, CreateTodoInput, UpdateListInput, UpdateTodoInput } from "./validation";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  listTodos: () => request<Todo[]>("/api/todos"),
  createTodo: (input: CreateTodoInput) =>
    request<Todo>("/api/todos", { method: "POST", body: json(input) }),
  updateTodo: (id: string, patch: UpdateTodoInput) =>
    request<Todo>(`/api/todos/${id}`, { method: "PATCH", body: json(patch) }),
  deleteTodo: (id: string) => request<Todo>(`/api/todos/${id}`, { method: "DELETE" }),
  clearCompleted: (listId?: string | null) =>
    request<{ removed: Todo[] }>("/api/todos/bulk", {
      method: "POST",
      body: json({ action: "clearCompleted", listId }),
    }),
  reorder: (ids: string[]) =>
    request<{ ok: true }>("/api/todos/bulk", { method: "POST", body: json({ action: "reorder", ids }) }),
  restore: (todos: Todo[], list?: TodoList | null) =>
    request<{ restored: Todo[] }>("/api/todos/bulk", {
      method: "POST",
      body: json({ action: "restore", todos, list }),
    }),

  listLists: () => request<TodoList[]>("/api/lists"),
  createList: (input: CreateListInput) =>
    request<TodoList>("/api/lists", { method: "POST", body: json(input) }),
  updateList: (id: string, patch: UpdateListInput) =>
    request<TodoList>(`/api/lists/${id}`, { method: "PATCH", body: json(patch) }),
  deleteList: (id: string) =>
    request<{ list: TodoList; todos: Todo[] }>(`/api/lists/${id}`, { method: "DELETE" }),
};
