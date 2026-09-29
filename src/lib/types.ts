export type Priority = "none" | "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null; // YYYY-MM-DD
  listId: string | null;
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TodoList {
  id: string;
  name: string;
  color: ListColor;
  createdAt: string;
}

export const LIST_COLORS = [
  "violet",
  "blue",
  "teal",
  "green",
  "amber",
  "orange",
  "rose",
  "slate",
] as const;

export type ListColor = (typeof LIST_COLORS)[number];

export interface Database {
  todos: Todo[];
  lists: TodoList[];
}
