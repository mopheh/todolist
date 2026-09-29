"use client";

import { Calendar, CalendarX2, Check, Flag, Hash, Inbox, Sun, Sunrise } from "lucide-react";
import { LIST_COLOR_HEX, PRIORITIES, PRIORITY_META } from "@/lib/constants";
import { addDaysISO, daysFromToday, formatDue, parseISODate, todayISO } from "@/lib/dates";
import type { Priority, TodoList } from "@/lib/types";
import { MenuItem, MenuLabel, MenuSeparator, Popover, cn } from "./ui";

const chip =
  "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[12px] font-medium transition-colors";

export function dueTone(iso: string | null, completed = false) {
  if (!iso || completed) return "text-muted";
  const d = daysFromToday(iso);
  if (d < 0) return "text-danger";
  if (d === 0) return "text-success";
  if (d === 1) return "text-warning";
  return "text-muted";
}

export function DuePicker({
  value,
  onChange,
  variant = "chip",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  variant?: "chip" | "field";
}) {
  const nextMonday = (() => {
    const d = new Date();
    const add = ((8 - d.getDay()) % 7) || 7;
    return addDaysISO(add);
  })();

  return (
    <Popover
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          className={cn(
            variant === "chip"
              ? cn(chip, value ? "border-line bg-surface-2" : "border-dashed border-line-strong text-subtle hover:text-muted", value && dueTone(value))
              : cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px] hover:bg-surface-2", value ? dueTone(value) : "text-subtle"),
          )}
        >
          <Calendar className="size-3.5" />
          {value ? formatDue(value) : variant === "chip" ? "Due date" : "No due date"}
        </button>
      )}
    >
      {(close) => {
        const pick = (v: string | null) => {
          onChange(v);
          close();
        };
        return (
          <>
            <MenuItem icon={<Sun className="size-3.5" />} onSelect={() => pick(todayISO())} active={value === todayISO()}
              hint={<Hint>{new Date().toLocaleDateString(undefined, { weekday: "short" })}</Hint>}>
              Today
            </MenuItem>
            <MenuItem icon={<Sunrise className="size-3.5" />} onSelect={() => pick(addDaysISO(1))} active={value === addDaysISO(1)}
              hint={<Hint>{parseISODate(addDaysISO(1)).toLocaleDateString(undefined, { weekday: "short" })}</Hint>}>
              Tomorrow
            </MenuItem>
            <MenuItem icon={<Calendar className="size-3.5" />} onSelect={() => pick(nextMonday)} active={value === nextMonday}
              hint={<Hint>Mon</Hint>}>
              Next week
            </MenuItem>
            <MenuSeparator />
            <div className="px-1.5 py-1">
              <input
                type="date"
                aria-label="Pick a date"
                value={value ?? ""}
                onChange={(e) => e.target.value && pick(e.target.value)}
                className="h-8 w-full rounded-lg border border-line bg-surface-2 px-2 text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
            {value && (
              <>
                <MenuSeparator />
                <MenuItem danger icon={<CalendarX2 className="size-3.5" />} onSelect={() => pick(null)}>
                  Remove date
                </MenuItem>
              </>
            )}
          </>
        );
      }}
    </Popover>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-subtle">{children}</span>;
}

export function PriorityFlag({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <Flag
      className={cn("size-3.5", className)}
      style={{ color: PRIORITY_META[priority].color }}
      fill={priority === "none" ? "none" : PRIORITY_META[priority].color}
      fillOpacity={0.2}
    />
  );
}

export function PriorityPicker({
  value,
  onChange,
  variant = "chip",
}: {
  value: Priority;
  onChange: (v: Priority) => void;
  variant?: "chip" | "field";
}) {
  return (
    <Popover
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          className={cn(
            variant === "chip"
              ? cn(chip, value !== "none" ? "border-line bg-surface-2 text-ink" : "border-dashed border-line-strong text-subtle hover:text-muted")
              : cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px] hover:bg-surface-2", value === "none" ? "text-subtle" : "text-ink"),
          )}
        >
          <PriorityFlag priority={value} />
          {value === "none" ? (variant === "chip" ? "Priority" : "No priority") : PRIORITY_META[value].label}
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Priority</MenuLabel>
          {PRIORITIES.map((p) => (
            <MenuItem
              key={p}
              icon={<PriorityFlag priority={p} />}
              active={value === p}
              onSelect={() => {
                onChange(p);
                close();
              }}
              hint={value === p ? <Check className="size-3.5 text-accent" /> : null}
            >
              {PRIORITY_META[p].label}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}

export function ListPicker({
  value,
  lists,
  onChange,
  variant = "chip",
}: {
  value: string | null;
  lists: TodoList[];
  onChange: (v: string | null) => void;
  variant?: "chip" | "field";
}) {
  const current = lists.find((l) => l.id === value) ?? null;
  return (
    <Popover
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={id}
          className={cn(
            variant === "chip"
              ? cn(chip, current ? "border-line bg-surface-2 text-ink" : "border-dashed border-line-strong text-subtle hover:text-muted")
              : cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px] hover:bg-surface-2", current ? "text-ink" : "text-subtle"),
          )}
        >
          {current ? (
            <span className="size-2.5 rounded-[4px]" style={{ background: LIST_COLOR_HEX[current.color] }} />
          ) : (
            <Hash className="size-3.5" />
          )}
          <span className="max-w-32 truncate">{current ? current.name : variant === "chip" ? "List" : "No list"}</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuLabel>Move to</MenuLabel>
          <MenuItem
            icon={<Inbox className="size-3.5" />}
            active={value === null}
            onSelect={() => {
              onChange(null);
              close();
            }}
          >
            No list
          </MenuItem>
          {lists.map((l) => (
            <MenuItem
              key={l.id}
              active={value === l.id}
              icon={<span className="size-2.5 rounded-[4px]" style={{ background: LIST_COLOR_HEX[l.color] }} />}
              onSelect={() => {
                onChange(l.id);
                close();
              }}
              hint={value === l.id ? <Check className="size-3.5 text-accent" /> : null}
            >
              {l.name}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}
