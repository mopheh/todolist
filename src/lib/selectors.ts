import type { SmartView, SortKey, View } from "@/components/store";
import { PRIORITY_META } from "./constants";
import { daysFromToday } from "./dates";
import type { Todo } from "./types";

export function matchesView(t: Todo, view: View): boolean {
  if (view.kind === "list") return t.listId === view.id;
  switch (view.id) {
    case "all":
      return true;
    case "today":
      return t.dueDate !== null && daysFromToday(t.dueDate) <= 0;
    case "upcoming":
      return t.dueDate !== null && daysFromToday(t.dueDate) > 0;
    case "important":
      return t.priority === "high";
    case "completed":
      return t.completed;
  }
}

export function matchesSearch(t: Todo, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    t.title.toLowerCase().includes(needle) ||
    t.notes.toLowerCase().includes(needle) ||
    t.subtasks.some((s) => s.title.toLowerCase().includes(needle))
  );
}

export function sortTodos(todos: Todo[], sort: SortKey): Todo[] {
  const arr = [...todos];
  const byOrder = (a: Todo, b: Todo) => a.order - b.order;
  switch (sort) {
    case "manual":
      return arr.sort(byOrder);
    case "due":
      return arr.sort((a, b) => {
        if (a.dueDate === b.dueDate) return byOrder(a, b);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case "priority":
      return arr.sort(
        (a, b) => PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank || byOrder(a, b),
      );
    case "created":
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "alpha":
      return arr.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }
}

/** Active-task count for each sidebar entry. */
export function countFor(todos: Todo[], view: View): number {
  if (view.kind === "smart" && view.id === "completed") return todos.filter((t) => t.completed).length;
  return todos.filter((t) => !t.completed && matchesView(t, view)).length;
}

export const SMART_VIEWS: { id: SmartView; label: string; description: string }[] = [
  { id: "all", label: "All tasks", description: "Everything on your plate" },
  { id: "today", label: "Today", description: "Due today & overdue" },
  { id: "upcoming", label: "Upcoming", description: "Scheduled for later" },
  { id: "important", label: "Important", description: "High-priority tasks" },
  { id: "completed", label: "Completed", description: "Things you've finished" },
];
