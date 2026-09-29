"use client";

import { forwardRef, useMemo, useState, type RefObject } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "./dnd-modifiers";
import {
  ArrowDownUp,
  Check,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { LIST_COLOR_HEX } from "@/lib/constants";
import { daysFromToday, formatDue, formatLongDate } from "@/lib/dates";
import { SMART_VIEWS, matchesSearch, matchesView, sortTodos } from "@/lib/selectors";
import type { Todo } from "@/lib/types";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { useStore, type SortKey } from "./store";
import { TaskItem } from "./task-item";
import { IconButton, Kbd, MenuItem, MenuLabel, MenuSeparator, Popover, cn } from "./ui";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "manual", label: "Manual" },
  { id: "due", label: "Due date" },
  { id: "priority", label: "Priority" },
  { id: "created", label: "Newest first" },
  { id: "alpha", label: "Alphabetical" },
];

export function MainView({
  composerRef,
  searchRef,
  onOpenSidebar,
}: {
  composerRef: RefObject<HTMLInputElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  onOpenSidebar: () => void;
}) {
  const { todos, lists, view, search, setSearch, sort, setSort, reorder, clearCompleted } = useStore();
  const [showCompleted, setShowCompleted] = useState(true);

  const listById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const currentList = view.kind === "list" ? listById.get(view.id) : undefined;
  const smart = view.kind === "smart" ? SMART_VIEWS.find((s) => s.id === view.id) : undefined;
  const title = currentList?.name ?? smart?.label ?? "Tasks";
  const isCompletedView = view.kind === "smart" && view.id === "completed";

  const inView = useMemo(() => todos.filter((t) => matchesView(t, view)), [todos, view]);
  const visible = useMemo(() => inView.filter((t) => matchesSearch(t, search.trim())), [inView, search]);

  const active = useMemo(() => sortTodos(visible.filter((t) => !t.completed), sort), [visible, sort]);
  const completed = useMemo(
    () =>
      visible
        .filter((t) => t.completed)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [visible],
  );

  const doneCount = inView.filter((t) => t.completed).length;
  const total = inView.length;
  const canDrag = sort === "manual" && !search.trim() && !isCompletedView;
  const showListChip = view.kind !== "list";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const ids = active.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(String(a.id)), ids.indexOf(String(over.id)));
    reorder(next);
  };

  // Upcoming view: group by due date.
  const groups = useMemo(() => {
    if (!(view.kind === "smart" && view.id === "upcoming") || sort !== "manual") return null;
    const map = new Map<string, Todo[]>();
    [...active]
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || a.order - b.order)
      .forEach((t) => {
        const k = t.dueDate!;
        map.set(k, [...(map.get(k) ?? []), t]);
      });
    return [...map.entries()];
  }, [active, view, sort]);

  const overdue = view.kind === "smart" && view.id === "today" ? active.filter((t) => daysFromToday(t.dueDate!) < 0).length : 0;
  const searching = !!search.trim();
  const nothing = active.length === 0 && completed.length === 0;
  const allDone = !nothing && active.length === 0 && !isCompletedView;

  const renderItem = (t: Todo) => (
    <TaskItem key={t.id} todo={t} list={t.listId ? listById.get(t.listId) : undefined} showList={showListChip} draggable={canDrag} />
  );

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-transparent bg-bg/80 px-4 backdrop-blur-md sm:px-8">
        <IconButton label="Open menu" onClick={onOpenSidebar} className="-ml-1.5 lg:hidden">
          <Menu className="size-[18px]" />
        </IconButton>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchBox ref={searchRef} value={search} onChange={setSearch} />
          <Popover
            align="end"
            trigger={({ toggle, open, id }) => (
              <IconButton
                label="Sort"
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={id}
                className={cn(sort !== "manual" && "text-accent")}
              >
                <ArrowDownUp className="size-4" />
              </IconButton>
            )}
          >
            {(close) => (
              <>
                <MenuLabel>Sort by</MenuLabel>
                {SORTS.map((s) => (
                  <MenuItem
                    key={s.id}
                    active={sort === s.id}
                    onSelect={() => {
                      setSort(s.id);
                      close();
                    }}
                    hint={sort === s.id ? <Check className="size-3.5 text-accent" /> : null}
                  >
                    {s.label}
                  </MenuItem>
                ))}
              </>
            )}
          </Popover>
          <Popover
            align="end"
            trigger={({ toggle, open, id }) => (
              <IconButton label="More" onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-controls={id}>
                <MoreHorizontal className="size-4" />
              </IconButton>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<Trash2 className="size-3.5" />}
                  danger
                  onSelect={() => {
                    clearCompleted(currentList ? currentList.id : undefined);
                    close();
                  }}
                >
                  Clear completed{currentList ? " in list" : ""}
                </MenuItem>
                <MenuSeparator />
                <div className="space-y-1.5 px-2.5 py-1.5 text-[12px] text-muted">
                  <Shortcut k="N">New task</Shortcut>
                  <Shortcut k="/">Search</Shortcut>
                  <Shortcut k="Space">Toggle focused task</Shortcut>
                  <Shortcut k="Esc">Close panel</Shortcut>
                </div>
              </>
            )}
          </Popover>
        </div>
      </header>

      <div className="scroll-quiet flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-32 pt-4 sm:px-8 sm:pt-8">
          {/* Heading */}
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-medium text-subtle">
                {currentList && (
                  <span className="size-2.5 rounded-[4px]" style={{ background: LIST_COLOR_HEX[currentList.color] }} />
                )}
                {view.kind === "smart" && view.id === "today" ? formatLongDate() : currentList ? "List" : smart?.description}
              </p>
              <h1 className="truncate font-display text-[40px] leading-[1.05] tracking-tight text-ink sm:text-[46px]">
                {title}
              </h1>
              {overdue > 0 && (
                <p className="mt-2 text-[13px] text-danger">
                  {overdue} overdue {overdue === 1 ? "task" : "tasks"}
                </p>
              )}
            </div>
            {total > 0 && !isCompletedView && <ProgressRing done={doneCount} total={total} />}
          </div>

          {!isCompletedView && (
            <div className="mb-5">
              <Composer ref={composerRef} />
            </div>
          )}

          {searching && (
            <div className="mb-3 flex items-center gap-2 text-[12.5px] text-muted">
              <Search className="size-3.5" />
              {visible.length} {visible.length === 1 ? "result" : "results"} for “{search.trim()}”
              <button type="button" onClick={() => setSearch("")} className="font-medium text-accent hover:underline">
                Clear
              </button>
            </div>
          )}

          {nothing || (isCompletedView && completed.length === 0) ? (
            <EmptyState view={view} searching={searching} />
          ) : (
            <>
              {isCompletedView ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12.5px] text-muted">
                      {completed.length} completed {completed.length === 1 ? "task" : "tasks"}
                    </span>
                    <button
                      type="button"
                      onClick={() => clearCompleted()}
                      className="rounded-md px-2 py-1 text-[12.5px] font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="space-y-0.5">{completed.map(renderItem)}</ul>
                </>
              ) : (
                <>
                  {allDone && !searching ? (
                    <EmptyState view={view} searching={false} allDone />
                  ) : groups ? (
                    <div className="space-y-6">
                      {groups.map(([date, items]) => (
                        <section key={date}>
                          <h2 className="mb-1 flex items-baseline gap-2 px-1 text-[13px] font-semibold text-ink">
                            {formatDue(date)}
                            <span className="text-[12px] font-normal text-subtle">
                              {new Date(`${date}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </h2>
                          <ul className="space-y-0.5">{items.map(renderItem)}</ul>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={onDragEnd}
                    >
                      <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        <ul className="space-y-0.5">{active.map(renderItem)}</ul>
                      </SortableContext>
                    </DndContext>
                  )}

                  {completed.length > 0 && (
                    <section className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCompleted((s) => !s)}
                        aria-expanded={showCompleted}
                        className="group mb-1 flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
                      >
                        <ChevronRight className={cn("size-3.5 transition-transform", showCompleted && "rotate-90")} />
                        Completed
                        <span className="text-[12px] font-normal tabular-nums text-subtle">{completed.length}</span>
                        <span className="ml-3 h-px flex-1 bg-line" />
                      </button>
                      {showCompleted && <ul className="space-y-0.5">{completed.map(renderItem)}</ul>}
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {!canDrag && !isCompletedView && active.length > 1 && sort !== "manual" && (
            <p className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-subtle">
              <Sparkles className="size-3" />
              Sorted by {SORTS.find((s) => s.id === sort)?.label.toLowerCase()} — switch to Manual to drag &amp; reorder
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Shortcut({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span>{children}</span>
      <Kbd>{k}</Kbd>
    </div>
  );
}

const SearchBox = forwardRef<HTMLInputElement, { value: string; onChange: (v: string) => void }>(function SearchBox(
  { value, onChange },
  ref,
) {
  return (
    <div className="group relative flex items-center">
      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-subtle" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onChange("");
            e.currentTarget.blur();
          }
        }}
        placeholder="Search"
        aria-label="Search tasks"
        className={cn(
          "h-8 rounded-lg border border-transparent bg-transparent pl-8 pr-7 text-[13px] text-ink outline-none transition-all duration-200 placeholder:text-subtle",
          "w-9 cursor-pointer hover:bg-surface-2 focus:w-44 focus:cursor-text focus:border-line focus:bg-surface focus:shadow-soft-sm sm:focus:w-56",
          value && "w-44 cursor-text border-line bg-surface sm:w-56",
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-1.5 grid size-5 place-items-center rounded text-subtle hover:text-ink"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
});

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex shrink-0 items-center gap-3" title={`${done} of ${total} done`}>
      <div className="hidden text-right sm:block">
        <div className="text-[13px] font-semibold tabular-nums text-ink">{Math.round(pct * 100)}%</div>
        <div className="text-[11.5px] tabular-nums text-subtle">
          {done} of {total} done
        </div>
      </div>
      <svg width="42" height="42" viewBox="0 0 42 42" className="-rotate-90" role="img" aria-label={`${done} of ${total} tasks complete`}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r={r}
          fill="none"
          stroke={pct === 1 ? "var(--success)" : "var(--accent)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 500ms cubic-bezier(0.22,1,0.36,1), stroke 300ms" }}
        />
      </svg>
    </div>
  );
}
