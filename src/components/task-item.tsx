"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, ListChecks, StickyNote, Trash2 } from "lucide-react";
import { LIST_COLOR_HEX, PRIORITY_META } from "@/lib/constants";
import { formatDue } from "@/lib/dates";
import type { Todo, TodoList } from "@/lib/types";
import { dueTone } from "./pickers";
import { useStore } from "./store";
import { Checkbox, IconButton, cn } from "./ui";

export function TaskItem({
  todo,
  list,
  showList,
  draggable,
}: {
  todo: Todo;
  list?: TodoList;
  showList: boolean;
  draggable: boolean;
}) {
  const { toggleTodo, removeTodo, updateTodo, selectedId, setSelectedId } = useStore();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: !draggable,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  const selected = selectedId === todo.id;
  const doneSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const priorityColor = todo.priority !== "none" ? PRIORITY_META[todo.priority].color : undefined;

  const commit = () => {
    const t = draft.trim();
    setEditing(false);
    if (t && t !== todo.title) updateTodo(todo.id, { title: t });
    else setDraft(todo.title);
  };

  const hasMeta =
    todo.dueDate || todo.subtasks.length > 0 || todo.notes.trim() || (showList && list);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "animate-row-in group/row relative",
        isDragging && "z-10",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${todo.title}`}
        onClick={() => !editing && setSelectedId(todo.id)}
        onKeyDown={(e) => {
          if (editing || e.target !== e.currentTarget) return;
          if (e.key === "Enter") setSelectedId(todo.id);
          if (e.key === " ") {
            e.preventDefault();
            toggleTodo(todo.id);
          }
          if (e.key === "Delete" || e.key === "Backspace") removeTodo(todo.id);
        }}
        className={cn(
          "relative flex items-start gap-3 rounded-xl border px-3 py-3 outline-none transition-all duration-150 sm:pl-2",
          selected
            ? "border-accent/40 bg-accent-soft/60 shadow-soft-sm"
            : "border-transparent hover:border-line hover:bg-surface hover:shadow-soft-sm focus-visible:border-accent/50 focus-visible:bg-surface",
          isDragging && "border-line bg-surface shadow-soft-lg",
        )}
      >
        {/* Drag handle */}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "-ml-1 mt-0.5 hidden h-5 w-4 shrink-0 cursor-grab place-items-center rounded text-subtle opacity-0 transition-opacity active:cursor-grabbing sm:grid",
            draggable ? "group-hover/row:opacity-100 focus-visible:opacity-100" : "pointer-events-none invisible",
          )}
        >
          <GripVertical className="size-3.5" />
        </button>

        <div className="pt-px">
          <Checkbox
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            color={priorityColor}
            label={todo.completed ? `Mark “${todo.title}” as not done` : `Mark “${todo.title}” as done`}
          />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(todo.title);
                  setEditing(false);
                }
              }}
              aria-label="Edit title"
              className="-my-0.5 w-full rounded-md bg-surface-2 px-1.5 py-0.5 text-[14.5px] text-ink outline-none ring-2 ring-[var(--ring)]"
            />
          ) : (
            <p
              onDoubleClick={(e) => {
                e.stopPropagation();
                setDraft(todo.title);
                setEditing(true);
              }}
              className={cn(
                "break-words text-[14.5px] leading-5 transition-colors",
                todo.completed ? "text-subtle line-through decoration-subtle/60" : "text-ink",
              )}
            >
              {todo.title}
            </p>
          )}

          {hasMeta && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              {todo.dueDate && (
                <span className={cn("inline-flex items-center gap-1", dueTone(todo.dueDate, todo.completed))}>
                  <Calendar className="size-3" />
                  {formatDue(todo.dueDate)}
                </span>
              )}
              {todo.subtasks.length > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    doneSubtasks === todo.subtasks.length ? "text-success" : "text-muted",
                  )}
                >
                  <ListChecks className="size-3" />
                  {doneSubtasks}/{todo.subtasks.length}
                </span>
              )}
              {todo.notes.trim() && (
                <span className="inline-flex items-center gap-1 text-subtle" title="Has notes">
                  <StickyNote className="size-3" />
                </span>
              )}
              {showList && list && (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-[3px]" style={{ background: LIST_COLOR_HEX[list.color] }} />
                  {list.name}
                </span>
              )}
            </div>
          )}
        </div>

        <IconButton
          label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            removeTodo(todo.id);
          }}
          className="-my-1 size-7 shrink-0 opacity-100 hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover/row:opacity-100 sm:focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
    </li>
  );
}
