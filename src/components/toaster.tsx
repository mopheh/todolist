"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useStore } from "./store";
import { cn } from "./ui";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "animate-toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl py-2 pl-3.5 pr-2 text-[13px] shadow-soft-lg",
            "bg-[#1b1b1f] text-white dark:bg-[#ededf0] dark:text-[#1b1b1f]",
          )}
        >
          {t.tone === "error" ? (
            <AlertCircle className="size-4 shrink-0 text-[#ff6369] dark:text-[#e5484d]" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-[#3dd68c] dark:text-[#30a46c]" />
          )}
          <span className="min-w-0 flex-1 truncate">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick();
                dismissToast(t.id);
              }}
              className="rounded-md px-2 py-1 font-semibold text-[#a79fff] transition-colors hover:bg-white/10 dark:text-[#5b4fe9] dark:hover:bg-black/5"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(t.id)}
            className="grid size-6 place-items-center rounded-md opacity-50 transition hover:bg-white/10 hover:opacity-100 dark:hover:bg-black/5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
