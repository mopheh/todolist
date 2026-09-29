"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "./ui";

type Theme = "light" | "dark" | "system";
const KEY = "tempo-theme";

function apply(theme: Theme) {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from storage after hydration
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const choose = (t: Theme) => {
    setTheme(t);
    apply(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {}
  };

  const options: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          onClick={() => choose(id)}
          className={cn(
            "grid h-7 flex-1 place-items-center rounded-md transition-all",
            theme === id ? "bg-surface text-ink shadow-soft-sm" : "text-subtle hover:text-muted",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
