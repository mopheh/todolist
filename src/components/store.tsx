"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import type { ListColor, Priority, Todo, TodoList } from "@/lib/types";
import type { UpdateTodoInput } from "@/lib/validation";

export type SmartView = "all" | "today" | "upcoming" | "important" | "completed";
export type View = { kind: "smart"; id: SmartView } | { kind: "list"; id: string };
export type SortKey = "manual" | "due" | "priority" | "created" | "alpha";

export interface Toast {
  id: number;
  message: string;
  tone?: "default" | "error";
  action?: { label: string; onClick: () => void };
}

interface NewTodo {
  title: string;
  priority?: Priority;
  dueDate?: string | null;
  listId?: string | null;
  notes?: string;
}

interface StoreValue {
  todos: Todo[];
  lists: TodoList[];
  view: View;
  setView: (v: View) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  search: string;
  setSearch: (s: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  notify: (t: Omit<Toast, "id">) => void;

  addTodo: (input: NewTodo) => Promise<void>;
  updateTodo: (id: string, patch: UpdateTodoInput) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  clearCompleted: (listId?: string | null) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;

  addList: (name: string, color: ListColor) => Promise<TodoList | null>;
  updateList: (id: string, patch: { name?: string; color?: ListColor }) => Promise<void>;
  removeList: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function StoreProvider({
  initialTodos,
  initialLists,
  children,
}: {
  initialTodos: Todo[];
  initialLists: TodoList[];
  children: ReactNode;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [lists, setLists] = useState(initialLists);
  const [view, setViewState] = useState<View>({ kind: "smart", id: "all" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("manual");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastSeq.current;
      setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
      setTimeout(() => dismissToast(id), t.action ? 6000 : 3500);
    },
    [dismissToast],
  );

  const fail = useCallback(
    (err: unknown) => {
      notify({ message: err instanceof Error ? err.message : "Something went wrong", tone: "error" });
    },
    [notify],
  );

  /** Re-sync with the server after a failed optimistic write. */
  const resync = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([api.listTodos(), api.listLists()]);
      setTodos(t);
      setLists(l);
    } catch {
      /* offline — keep local state */
    }
  }, []);

  const setView = useCallback((v: View) => {
    setViewState(v);
    setSelectedId(null);
  }, []);

  // ---------- Todos ----------

  const addTodo = useCallback(
    async (input: NewTodo) => {
      const t = new Date().toISOString();
      const todo: Todo = {
        id: crypto.randomUUID(),
        title: input.title,
        notes: input.notes ?? "",
        completed: false,
        priority: input.priority ?? "none",
        dueDate: input.dueDate ?? null,
        listId: input.listId ?? null,
        subtasks: [],
        order: 0,
        createdAt: t,
        updatedAt: t,
        completedAt: null,
      };
      setTodos((ts) => {
        todo.order = ts.reduce((m, x) => Math.min(m, x.order), 0) - 1;
        return [todo, ...ts];
      });
      try {
        const saved = await api.createTodo({
          id: todo.id,
          title: todo.title,
          notes: todo.notes,
          priority: todo.priority,
          dueDate: todo.dueDate,
          listId: todo.listId,
        });
        setTodos((ts) => ts.map((x) => (x.id === saved.id ? saved : x)));
      } catch (err) {
        setTodos((ts) => ts.filter((x) => x.id !== todo.id));
        fail(err);
      }
    },
    [fail],
  );

  const updateTodo = useCallback(
    async (id: string, patch: UpdateTodoInput) => {
      setTodos((ts) =>
        ts.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch, updatedAt: new Date().toISOString() };
          if (patch.completed !== undefined && patch.completed !== t.completed) {
            next.completedAt = patch.completed ? new Date().toISOString() : null;
          }
          return next;
        }),
      );
      try {
        await api.updateTodo(id, patch);
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, resync],
  );

  // Latest-value refs so callbacks stay stable without stale closures.
  const todosRef = useRef(todos);
  const listsRef = useRef(lists);
  useEffect(() => {
    todosRef.current = todos;
    listsRef.current = lists;
  }, [todos, lists]);

  const toggleTodo = useCallback(
    async (id: string) => {
      const t = todosRef.current.find((x) => x.id === id);
      if (t) await updateTodo(id, { completed: !t.completed });
    },
    [updateTodo],
  );

  const restore = useCallback(
    async (items: Todo[], list?: TodoList) => {
      if (list) setLists((ls) => (ls.some((l) => l.id === list.id) ? ls : [...ls, list]));
      setTodos((ts) => {
        const ids = new Set(ts.map((t) => t.id));
        return [...ts, ...items.filter((t) => !ids.has(t.id))];
      });
      try {
        await api.restore(items, list);
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, resync],
  );

  const removeTodo = useCallback(
    async (id: string) => {
      const todo = todosRef.current.find((t) => t.id === id);
      if (!todo) return;
      setTodos((ts) => ts.filter((t) => t.id !== id));
      setSelectedId((s) => (s === id ? null : s));
      try {
        await api.deleteTodo(id);
        notify({
          message: `Deleted “${truncate(todo.title)}”`,
          action: { label: "Undo", onClick: () => restore([todo]) },
        });
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, notify, restore, resync],
  );

  const clearCompleted = useCallback(
    async (listId?: string | null) => {
      const removed = todosRef.current.filter(
        (t) => t.completed && (listId === undefined || t.listId === listId),
      );
      if (!removed.length) return;
      const ids = new Set(removed.map((t) => t.id));
      setTodos((ts) => ts.filter((t) => !ids.has(t.id)));
      try {
        await api.clearCompleted(listId);
        notify({
          message: `Cleared ${removed.length} completed ${removed.length === 1 ? "task" : "tasks"}`,
          action: { label: "Undo", onClick: () => restore(removed) },
        });
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, notify, restore, resync],
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      setTodos((ts) => {
        const set = new Set(orderedIds);
        const slots = ts
          .filter((t) => set.has(t.id))
          .map((t) => t.order)
          .sort((a, b) => a - b);
        const newOrder = new Map(orderedIds.map((id, i) => [id, slots[i]]));
        return ts.map((t) => (newOrder.has(t.id) ? { ...t, order: newOrder.get(t.id)! } : t));
      });
      try {
        await api.reorder(orderedIds);
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, resync],
  );

  // ---------- Lists ----------

  const addList = useCallback(
    async (name: string, color: ListColor) => {
      const list: TodoList = { id: crypto.randomUUID(), name, color, createdAt: new Date().toISOString() };
      setLists((ls) => [...ls, list]);
      // Navigate immediately so the user can start adding tasks to it.
      setViewState({ kind: "list", id: list.id });
      setSelectedId(null);
      try {
        return await api.createList({ id: list.id, name, color });
      } catch (err) {
        setLists((ls) => ls.filter((l) => l.id !== list.id));
        setViewState((v) => (v.kind === "list" && v.id === list.id ? { kind: "smart", id: "all" } : v));
        fail(err);
        return null;
      }
    },
    [fail],
  );

  const updateList = useCallback(
    async (id: string, patch: { name?: string; color?: ListColor }) => {
      setLists((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      try {
        await api.updateList(id, patch);
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, resync],
  );

  const removeList = useCallback(
    async (id: string) => {
      const list = listsRef.current.find((l) => l.id === id);
      if (!list) return;
      const removedTodos = todosRef.current.filter((t) => t.listId === id);
      setLists((ls) => ls.filter((l) => l.id !== id));
      setTodos((ts) => ts.filter((t) => t.listId !== id));
      setViewState((v) => (v.kind === "list" && v.id === id ? { kind: "smart", id: "all" } : v));
      setSelectedId(null);
      try {
        await api.deleteList(id);
        notify({
          message: `Deleted list “${truncate(list.name)}”`,
          action: { label: "Undo", onClick: () => restore(removedTodos, list) },
        });
      } catch (err) {
        fail(err);
        resync();
      }
    },
    [fail, notify, restore, resync],
  );

  const value = useMemo<StoreValue>(
    () => ({
      todos,
      lists,
      view,
      setView,
      selectedId,
      setSelectedId,
      search,
      setSearch,
      sort,
      setSort,
      toasts,
      dismissToast,
      notify,
      addTodo,
      updateTodo,
      toggleTodo,
      removeTodo,
      clearCompleted,
      reorder,
      addList,
      updateList,
      removeList,
    }),
    [
      todos, lists, view, setView, selectedId, search, sort, toasts, dismissToast, notify,
      addTodo, updateTodo, toggleTodo, removeTodo, clearCompleted, reorder, addList, updateList, removeList,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function truncate(s: string, n = 32) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
