"use client";

import { useEffect, useRef, useState } from "react";
import { MainView } from "./main-view";
import { Sidebar } from "./sidebar";
import { useStore } from "./store";
import { TaskDetail } from "./task-detail";
import { Toaster } from "./toaster";

function isTyping(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  return !!node && (node.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName));
}

export function AppShell() {
  const { selectedId, setSelectedId } = useStore();
  const [mobileNav, setMobileNav] = useState(false);
  const composerRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (mobileNav) setMobileNav(false);
        else if (selectedId && !isTyping(e.target)) setSelectedId(null);
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        composerRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNav, selectedId, setSelectedId]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-[264px] shrink-0 border-r border-line bg-surface-2/50 lg:block dark:bg-surface/40">
        <Sidebar onSearch={() => searchRef.current?.focus()} />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={() => setMobileNav(false)} />
          <aside className="animate-slide-in-left absolute inset-y-0 left-0 w-[284px] max-w-[85vw] border-r border-line bg-bg shadow-soft-lg">
            <Sidebar
              onNavigate={() => setMobileNav(false)}
              onSearch={() => setTimeout(() => searchRef.current?.focus(), 50)}
            />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <MainView composerRef={composerRef} searchRef={searchRef} onOpenSidebar={() => setMobileNav(true)} />
      </main>

      <TaskDetail />
      <Toaster />
    </div>
  );
}
