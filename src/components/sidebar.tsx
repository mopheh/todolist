"use client";

import { useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Flag,
  Inbox,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { LIST_COLOR_HEX } from "@/lib/constants";
import { SMART_VIEWS, countFor } from "@/lib/selectors";
import type { TodoList } from "@/lib/types";
import { ListDialog } from "./list-dialog";
import { useStore, type SmartView, type View } from "./store";
import { ThemeToggle } from "./theme-toggle";
import { Button, Dialog, IconButton, Kbd, MenuItem, Popover, cn } from "./ui";

const SMART_ICONS: Record<SmartView, typeof Inbox> = {
  all: Inbox,
  today: CalendarDays,
  upcoming: CalendarClock,
  important: Flag,
  completed: CheckCircle2,
};

export function Sidebar({ onNavigate, onSearch }: { onNavigate?: () => void; onSearch: () => void }) {
  const { todos, lists, view, setView, addList, updateList, removeList } = useStore();
  const [dialog, setDialog] = useState<{ open: boolean; list: TodoList | null }>({ open: false, list: null });
  const [confirmDelete, setConfirmDelete] = useState<TodoList | null>(null);

  const go = (v: View) => {
    setView(v);
    onNavigate?.();
  };
  const isActive = (v: View) => v.kind === view.kind && v.id === view.id;

  const totalActive = todos.filter((t) => !t.completed).length;
  const doneToday = todos.filter(
    (t) => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-[22px] leading-none tracking-tight text-ink">Tempo</span>
        </div>
        {onNavigate && (
          <IconButton label="Close menu" onClick={onNavigate} className="lg:hidden">
            <X className="size-4" />
          </IconButton>
        )}
      </div>

      {/* Search trigger */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => {
            onSearch();
            onNavigate?.();
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-subtle shadow-soft-sm transition-colors hover:border-line-strong hover:text-muted"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search tasks…</span>
          <Kbd>/</Kbd>
        </button>
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto px-3 pb-4">
        {/* Smart views */}
        <ul className="space-y-0.5 pt-1">
          {SMART_VIEWS.map(({ id, label }) => {
            const Icon = SMART_ICONS[id];
            const v: View = { kind: "smart", id };
            const count = countFor(todos, v);
            return (
              <li key={id}>
                <NavItem
                  active={isActive(v)}
                  onClick={() => go(v)}
                  icon={<Icon className="size-[15px]" />}
                  label={label}
                  count={count}
                />
              </li>
            );
          })}
        </ul>

        {/* Lists */}
        <div className="mb-1 mt-6 flex items-center justify-between pl-2.5 pr-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">Lists</span>
          <IconButton
            label="New list"
            className="size-6 rounded-md"
            onClick={() => setDialog({ open: true, list: null })}
          >
            <Plus className="size-3.5" />
          </IconButton>
        </div>
        <ul className="space-y-0.5">
          {lists.map((list) => {
            const v: View = { kind: "list", id: list.id };
            return (
              <li key={list.id} className="group/list relative">
                <NavItem
                  active={isActive(v)}
                  onClick={() => go(v)}
                  icon={
                    <span
                      className="size-2.5 rounded-[4px]"
                      style={{ background: LIST_COLOR_HEX[list.color] }}
                    />
                  }
                  label={list.name}
                  count={countFor(todos, v)}
                  hideCountOnHover
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/list:opacity-100">
                  <Popover
                    align="end"
                    trigger={({ toggle, open, id }) => (
                      <IconButton
                        label={`Options for ${list.name}`}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        aria-controls={id}
                        onClick={toggle}
                        className="size-6 rounded-md"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </IconButton>
                    )}
                  >
                    {(close) => (
                      <>
                        <MenuItem
                          icon={<Pencil className="size-3.5" />}
                          onSelect={() => {
                            close();
                            setDialog({ open: true, list });
                          }}
                        >
                          Edit list
                        </MenuItem>
                        <MenuItem
                          danger
                          icon={<Trash2 className="size-3.5" />}
                          onSelect={() => {
                            close();
                            setConfirmDelete(list);
                          }}
                        >
                          Delete list
                        </MenuItem>
                      </>
                    )}
                  </Popover>
                </div>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDialog({ open: true, list: null })}
              className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-subtle transition-colors hover:bg-surface-2 hover:text-muted"
            >
              <Plus className="size-[15px]" />
              New list
            </button>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="space-y-3 border-t border-line p-3">
        <div className="rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="text-[12px] text-muted">
            <span className="font-semibold text-ink">{doneToday}</span> done today ·{" "}
            <span className="font-semibold text-ink">{totalActive}</span> remaining
          </div>
        </div>
        <ThemeToggle />
      </div>

      <ListDialog
        open={dialog.open}
        initial={dialog.list}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSubmit={(name, color) => {
          if (dialog.list) {
            updateList(dialog.list.id, { name, color });
          } else {
            addList(name, color);
            onNavigate?.();
          }
        }}
      />

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={`Delete “${confirmDelete?.name}”?`}
        description={(() => {
          const n = todos.filter((t) => t.listId === confirmDelete?.id).length;
          return n
            ? `This list and its ${n} ${n === 1 ? "task" : "tasks"} will be deleted. You can undo right after.`
            : "This empty list will be deleted.";
        })()}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            data-autofocus
            onClick={() => {
              if (confirmDelete) removeList(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </nav>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  count,
  hideCountOnHover,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  hideCountOnHover?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
        active ? "bg-surface font-medium text-ink shadow-soft-sm ring-1 ring-line" : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <span className={cn("grid size-4 place-items-center", active ? "text-accent" : "text-subtle")}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "text-[11.5px] tabular-nums text-subtle",
            hideCountOnHover && "group-hover/list:opacity-0 group-focus-within/list:opacity-0",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect width="28" height="28" rx="8" fill="var(--accent)" />
      <path
        d="M8.5 14.5 12.2 18 19.5 10"
        stroke="var(--accent-contrast)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
