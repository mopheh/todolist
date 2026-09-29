import type { View } from "./store";

const COPY: Record<string, { title: string; body: string }> = {
  all: { title: "A clear mind", body: "Nothing on your plate. Add a task above to get started." },
  today: { title: "Nothing due today", body: "Enjoy the breathing room — or plan something small." },
  upcoming: { title: "No upcoming tasks", body: "Give a task a due date and it will appear here." },
  important: { title: "No high-priority tasks", body: "Flag a task as High priority to see it here." },
  completed: { title: "Nothing completed yet", body: "Finished tasks will collect here. You’ve got this." },
  list: { title: "This list is empty", body: "Add the first task to this list above." },
  search: { title: "No matches", body: "Try a different search term." },
  allDone: { title: "All done!", body: "Every task here is complete. Nicely done." },
};

export function EmptyState({ view, searching, allDone }: { view: View; searching: boolean; allDone?: boolean }) {
  const key = searching ? "search" : allDone ? "allDone" : view.kind === "list" ? "list" : view.id;
  const { title, body } = COPY[key];
  return (
    <div className="animate-fade-in flex flex-col items-center px-6 py-16 text-center">
      <Illustration done={allDone && !searching} />
      <h3 className="mt-5 font-display text-2xl text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Illustration({ done }: { done?: boolean }) {
  return (
    <svg width="132" height="104" viewBox="0 0 132 104" fill="none" aria-hidden>
      <ellipse cx="66" cy="96" rx="44" ry="5" fill="var(--surface-3)" />
      <rect x="22" y="14" width="88" height="72" rx="14" fill="var(--surface)" stroke="var(--border-strong)" />
      <rect x="22" y="14" width="88" height="16" rx="14" fill="var(--surface-2)" />
      <rect x="22" y="24" width="88" height="6" fill="var(--surface-2)" />
      <circle cx="32" cy="22" r="2.5" fill="var(--border-strong)" />
      <circle cx="40" cy="22" r="2.5" fill="var(--border-strong)" />
      {[42, 56, 70].map((y, i) => (
        <g key={y}>
          <circle
            cx="38"
            cy={y}
            r="5"
            fill={done || i === 0 ? "var(--accent)" : "none"}
            stroke={done || i === 0 ? "var(--accent)" : "var(--border-strong)"}
            strokeWidth="1.5"
          />
          {(done || i === 0) && (
            <path d={`M35.6 ${y}.2l1.7 1.7 3.2-3.4`} stroke="var(--accent-contrast)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          <rect x="50" y={y - 2.5} width={[44, 34, 40][i]} height="5" rx="2.5" fill="var(--surface-3)" />
        </g>
      ))}
      <path d="M112 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="var(--accent)" opacity="0.7" />
      <path d="M16 70l1.3 3.2 3.2 1.3-3.2 1.3L16 79l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="var(--accent)" opacity="0.45" />
    </svg>
  );
}
