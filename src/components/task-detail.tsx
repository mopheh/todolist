"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Flag, Hash, ListChecks, Plus, StickyNote, Trash2, X } from "lucide-react";
import { formatTimestamp } from "@/lib/dates";
import type { Subtask, Todo } from "@/lib/types";
import { DuePicker, ListPicker, PriorityPicker } from "./pickers";
import { useStore } from "./store";
import { Checkbox, IconButton, cn } from "./ui";

export function TaskDetail() {
  const { todos, selectedId, setSelectedId } = useStore();
  const todo = todos.find((t) => t.id === selectedId);
  if (!todo) return null;

  return (
    <>
      {/* Mobile/tablet backdrop */}
      <div
        className="animate-fade-in fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] xl:hidden"
        onClick={() => setSelectedId(null)}
      />
      <aside
        aria-label="Task details"
        className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-line bg-surface shadow-soft-lg xl:static xl:z-auto xl:w-[400px] xl:max-w-none xl:shadow-none"
      >
        {/* Keyed so local drafts reset when switching tasks */}
        <DetailBody key={todo.id} todo={todo} />
      </aside>
    </>
  );
}

function DetailBody({ todo }: { todo: Todo }) {
  const { lists, updateTodo, toggleTodo, removeTodo, setSelectedId } = useStore();
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [newSubtask, setNewSubtask] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the title field.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  const saveTitle = () => {
    const t = title.trim();
    if (!t) return setTitle(todo.title);
    if (t !== todo.title) updateTodo(todo.id, { title: t });
  };
  const saveNotes = () => {
    if (notes !== todo.notes) updateTodo(todo.id, { notes });
  };

  const setSubtasks = (subtasks: Subtask[]) => updateTodo(todo.id, { subtasks });
  const addSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    setSubtasks([...todo.subtasks, { id: crypto.randomUUID(), title: t, completed: false }]);
    setNewSubtask("");
  };

  const doneSubs = todo.subtasks.filter((s) => s.completed).length;

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-subtle">Task</span>
        <div className="flex items-center gap-1">
          <IconButton
            label="Delete task"
            onClick={() => removeTodo(todo.id)}
            className="hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </IconButton>
          <IconButton label="Close details" onClick={() => setSelectedId(null)}>
            <X className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto px-5 py-5">
        {/* Title */}
        <div className="flex items-start gap-3">
          <div className="pt-[5px]">
            <Checkbox
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              label={todo.completed ? "Mark as not done" : "Mark as done"}
            />
          </div>
          <textarea
            ref={titleRef}
            value={title}
            rows={1}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            aria-label="Task title"
            className={cn(
              "w-full resize-none overflow-hidden bg-transparent text-[19px] font-semibold leading-snug tracking-tight outline-none",
              todo.completed ? "text-muted line-through decoration-subtle/60" : "text-ink",
            )}
          />
        </div>

        {/* Properties */}
        <dl className="mt-5 space-y-0.5 rounded-xl border border-line p-1.5">
          <Property icon={<Hash className="size-3.5" />} label="List">
            <ListPicker variant="field" value={todo.listId} lists={lists} onChange={(listId) => updateTodo(todo.id, { listId })} />
          </Property>
          <Property icon={<Calendar className="size-3.5" />} label="Due date">
            <DuePicker variant="field" value={todo.dueDate} onChange={(dueDate) => updateTodo(todo.id, { dueDate })} />
          </Property>
          <Property icon={<Flag className="size-3.5" />} label="Priority">
            <PriorityPicker variant="field" value={todo.priority} onChange={(priority) => updateTodo(todo.id, { priority })} />
          </Property>
        </dl>

        {/* Subtasks */}
        <section className="mt-7">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-ink">
            <ListChecks className="size-3.5 text-subtle" />
            Subtasks
            {todo.subtasks.length > 0 && (
              <span className="font-normal tabular-nums text-subtle">
                {doneSubs}/{todo.subtasks.length}
              </span>
            )}
          </div>
          {todo.subtasks.length > 0 && (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(doneSubs / todo.subtasks.length) * 100}%` }}
              />
            </div>
          )}
          <ul className="space-y-0.5">
            {todo.subtasks.map((s) => (
              <SubtaskRow
                key={s.id}
                subtask={s}
                onToggle={() =>
                  setSubtasks(todo.subtasks.map((x) => (x.id === s.id ? { ...x, completed: !x.completed } : x)))
                }
                onRename={(title) => setSubtasks(todo.subtasks.map((x) => (x.id === s.id ? { ...x, title } : x)))}
                onDelete={() => setSubtasks(todo.subtasks.filter((x) => x.id !== s.id))}
              />
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSubtask();
            }}
            className="mt-1 flex h-9 items-center gap-3 rounded-lg px-2 transition-colors focus-within:bg-surface-2 hover:bg-surface-2"
          >
            <Plus className="size-4 text-subtle" />
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              maxLength={200}
              placeholder="Add a subtask"
              aria-label="New subtask"
              className="h-full flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-subtle"
            />
          </form>
        </section>

        {/* Notes */}
        <section className="mt-7">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-ink">
            <StickyNote className="size-3.5 text-subtle" />
            Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            maxLength={5000}
            rows={6}
            placeholder="Add details, links, or context…"
            aria-label="Notes"
            className="w-full resize-y rounded-xl border border-line bg-surface-2/60 px-3.5 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-subtle focus:border-accent focus:bg-surface focus:ring-4 focus:ring-[var(--ring)]"
          />
        </section>
      </div>

      <div className="shrink-0 border-t border-line px-5 py-3 text-[11.5px] text-subtle">
        Created {formatTimestamp(todo.createdAt)}
        {todo.completedAt && <> · Completed {formatTimestamp(todo.completedAt)}</>}
      </div>
    </>
  );
}

function Property({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[108px_1fr] items-center">
      <dt className="flex items-center gap-2 px-2 text-[12.5px] text-muted">
        <span className="text-subtle">{icon}</span>
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function SubtaskRow({
  subtask,
  onToggle,
  onRename,
  onDelete,
}: {
  subtask: Subtask;
  onToggle: () => void;
  onRename: (t: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(subtask.title);
  return (
    <li className="group/sub flex h-9 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-surface-2">
      <Checkbox size="sm" checked={subtask.completed} onChange={onToggle} label={`Toggle ${subtask.title}`} />
      <input
        value={value}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const t = value.trim();
          if (!t) setValue(subtask.title);
          else if (t !== subtask.title) onRename(t);
        }}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Subtask title"
        className={cn(
          "h-full flex-1 bg-transparent text-[13.5px] outline-none",
          subtask.completed ? "text-subtle line-through" : "text-ink",
        )}
      />
      <IconButton
        label="Delete subtask"
        onClick={onDelete}
        className="size-6 opacity-0 hover:text-danger focus-visible:opacity-100 group-hover/sub:opacity-100"
      >
        <X className="size-3.5" />
      </IconButton>
    </li>
  );
}
