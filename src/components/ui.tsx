"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------- Checkbox ----------

export function Checkbox({
  checked,
  onChange,
  color,
  size = "md",
  label,
}: {
  checked: boolean;
  onChange: () => void;
  color?: string;
  size?: "sm" | "md";
  label: string;
}) {
  const dim = size === "sm" ? "size-4" : "size-[20px]";
  const ring = color ?? "var(--border-strong)";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "group/check relative grid shrink-0 place-items-center rounded-full border-[1.5px] transition-all duration-200",
        dim,
        checked ? "animate-check-pop" : "hover:scale-110",
      )}
      style={{
        borderColor: checked ? "var(--accent)" : ring,
        background: checked ? "var(--accent)" : color ? `color-mix(in srgb, ${color} 10%, transparent)` : "transparent",
      }}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="size-[70%]" fill="none">
          <path
            className="check-path"
            d="M2.5 6.2 5 8.6l4.6-5"
            stroke="var(--accent-contrast)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 12 12"
          className="size-[70%] opacity-0 transition-opacity group-hover/check:opacity-60"
          fill="none"
        >
          <path
            d="M2.5 6.2 5 8.6l4.6-5"
            stroke={color ?? "var(--muted)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ---------- Buttons ----------

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" && "bg-accent text-accent-contrast shadow-soft-sm hover:bg-accent-hover",
        variant === "secondary" && "border border-line bg-surface text-ink shadow-soft-sm hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-ink",
        variant === "danger" && "bg-danger text-white shadow-soft-sm hover:brightness-110",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-surface-2 px-1 font-mono text-[10.5px] font-medium text-subtle">
      {children}
    </kbd>
  );
}

// ---------- Popover menu ----------

export function Popover({
  trigger,
  children,
  align = "start",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <div
          id={id}
          role="menu"
          className={cn(
            "animate-pop-in absolute top-full z-50 mt-1.5 min-w-48 rounded-xl border border-line bg-surface p-1 shadow-soft-lg",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onSelect,
  active,
  danger,
  icon,
  hint,
}: {
  children: ReactNode;
  onSelect: () => void;
  active?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors",
        danger ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-surface-2",
        active && "bg-surface-2 font-medium",
      )}
    >
      {icon && <span className="grid size-4 place-items-center text-muted">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {hint}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-subtle">{children}</div>;
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />;
}

// ---------- Dialog ----------

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      const el =
        panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel?.querySelector<HTMLElement>("input");
      el?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-pop-in relative w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-soft-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-1.5 -mt-1.5 size-7">
            <X className="size-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
