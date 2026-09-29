"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { LIST_COLOR_HEX } from "@/lib/constants";
import { LIST_COLORS, type ListColor, type TodoList } from "@/lib/types";
import { Button, Dialog } from "./ui";

export function ListDialog({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial?: TodoList | null;
  onSubmit: (name: string, color: ListColor) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? "Edit list" : "New list"}
      description={initial ? undefined : "Group related tasks together — projects, areas, or anything else."}
    >
      {/* Keyed so the form resets each time the dialog opens */}
      <ListForm key={`${open}-${initial?.id ?? "new"}`} initial={initial} onClose={onClose} onSubmit={onSubmit} />
    </Dialog>
  );
}

function ListForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: TodoList | null;
  onClose: () => void;
  onSubmit: (name: string, color: ListColor) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<ListColor>(initial?.color ?? "violet");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onSubmit(trimmed, color);
        onClose();
      }}
    >
      <label className="mb-1.5 block text-[12px] font-medium text-muted" htmlFor="list-name">
        Name
      </label>
      <div className="flex h-10 items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-[var(--ring)]">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: LIST_COLOR_HEX[color] }} />
        <input
          id="list-name"
          data-autofocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Side project"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
          autoComplete="off"
        />
      </div>

      <div className="mb-1.5 mt-4 text-[12px] font-medium text-muted">Color</div>
      <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
        {LIST_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            onClick={() => setColor(c)}
            className="grid size-7 place-items-center rounded-full transition-transform hover:scale-110"
            style={{
              background: LIST_COLOR_HEX[c],
              boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${LIST_COLOR_HEX[c]}` : undefined,
            }}
          >
            {color === c && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={!name.trim()}>
          {initial ? "Save changes" : "Create list"}
        </Button>
      </div>
    </form>
  );
}
