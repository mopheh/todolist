"use client";

import { forwardRef, useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { todayISO } from "@/lib/dates";
import type { Priority } from "@/lib/types";
import { DuePicker, ListPicker, PriorityPicker } from "./pickers";
import { useStore, type View } from "./store";
import { cn } from "./ui";

function defaultsFor(view: View) {
  return {
    dueDate: view.kind === "smart" && view.id === "today" ? todayISO() : null,
    priority: (view.kind === "smart" && view.id === "important" ? "high" : "none") as Priority,
    listId: view.kind === "list" ? view.id : null,
  };
}

export const Composer = forwardRef<HTMLInputElement>(function Composer(_props, ref) {
  const { view, lists, addTodo } = useStore();
  // Remount on view change so defaults follow the active view.
  const key = `${view.kind}:${view.id}`;
  return <ComposerInner key={key} ref={ref} defaults={defaultsFor(view)} lists={lists} addTodo={addTodo} />;
});

const ComposerInner = forwardRef<
  HTMLInputElement,
  {
    defaults: ReturnType<typeof defaultsFor>;
    lists: ReturnType<typeof useStore>["lists"];
    addTodo: ReturnType<typeof useStore>["addTodo"];
  }
>(function ComposerInner({ defaults, lists, addTodo }, ref) {
  const [title, setTitle] = useState("");
  const [focused, setFocused] = useState(false);
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [priority, setPriority] = useState<Priority>(defaults.priority);
  const [listId, setListId] = useState(defaults.listId);

  const expanded = focused || title.length > 0;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTodo({ title: trimmed, dueDate, priority, listId });
    setTitle("");
    setDueDate(defaults.dueDate);
    setPriority(defaults.priority);
    setListId(defaults.listId);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Stay expanded while focus moves between the composer's own controls or popovers.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      className={cn(
        "rounded-2xl border bg-surface transition-all duration-200",
        expanded ? "border-line-strong shadow-soft-md" : "border-line shadow-soft-sm hover:border-line-strong",
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <span
          className={cn(
            "grid size-[20px] shrink-0 place-items-center rounded-full border-[1.5px] border-dashed transition-colors",
            expanded ? "border-accent text-accent" : "border-line-strong text-subtle",
          )}
        >
          <Plus className="size-3" strokeWidth={2.5} />
        </span>
        <input
          ref={ref}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setTitle("");
              e.currentTarget.blur();
            }
          }}
          maxLength={200}
          placeholder="Add a task…"
          aria-label="New task title"
          className="h-[52px] w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle"
          autoComplete="off"
        />
      </div>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className={cn(expanded ? "overflow-visible" : "overflow-hidden")}>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2.5">
            <DuePicker value={dueDate} onChange={setDueDate} />
            <PriorityPicker value={priority} onChange={setPriority} />
            <ListPicker value={listId} lists={lists} onChange={setListId} />
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-[11.5px] text-subtle sm:inline">Press Enter ↵</span>
              <button
                type="submit"
                disabled={!title.trim()}
                aria-label="Add task"
                className="grid size-8 place-items-center rounded-lg bg-accent text-accent-contrast shadow-soft-sm transition-all hover:bg-accent-hover active:scale-95 disabled:bg-surface-3 disabled:text-subtle disabled:shadow-none"
              >
                <ArrowUp className="size-4" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
});
