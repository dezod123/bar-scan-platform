"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/createProduct", label: "Create Product" },
  { href: "/print", label: "Print Labels" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[color:var(--panel-border)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="text-sm uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Scan
            </span>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  pathname === item.href
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                    : "border-[color:var(--panel-border)] bg-white/80 text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            className="rounded-full border border-[color:var(--panel-border)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--muted)] shadow-sm transition hover:border-[color:var(--accent)] hover:text-[color:var(--ink)] md:hidden"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            Menu
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 border-l border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Navigation
          </span>
          <button
            className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            Close
          </button>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                pathname === item.href
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                  : "border-[color:var(--panel-border)] bg-white text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
              }`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main>{children}</main>
    </div>
  );
}
