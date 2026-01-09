"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ActionType,
  CreateScanResponse,
  Scan,
  getScans,
  updateScanAction,
} from "../lib/api";
import ScannerPanel from "../components/ScannerPanel";

const actionFilters: Array<{ label: string; value?: ActionType | "AWAITING" }> = [
  { label: "All", value: undefined },
  { label: "Deployed", value: "DEPLOY" },
  { label: "Returned", value: "RETURN" },
  { label: "Awaiting Action", value: "AWAITING" },
];

export default function Home() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<ActionType | "AWAITING" | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [lastScanNote, setLastScanNote] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = scans.length;
    const deployed = scans.filter((scan) => scan.action === "DEPLOY").length;
    const returned = scans.filter((scan) => scan.action === "RETURN").length;
    const awaiting = scans.filter(
      (scan) => !scan.action || scan.action === "AWAITING",
    ).length;
    return { total, deployed, returned, awaiting };
  }, [scans]);

  const filteredScans = useMemo(() => {
    if (filter === "AWAITING") {
      return scans.filter((scan) => !scan.action || scan.action === "AWAITING");
    }
    if (filter) {
      return scans.filter((scan) => scan.action === filter);
    }
    return scans;
  }, [filter, scans]);
  
  const fetchScans = async () => {
    try {
      setError(null);
      const data = await getScans();
      setScans(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the API service.");
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (!alive) {
        return;
      }
      await fetchScans();
    };

    load();
    timer = setInterval(load, 3000);

    return () => {
      alive = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [filter]);

  const handleAction = async (scan: Scan, action: ActionType) => {
    try {
      setActionBusy(scan.id);
      await updateScanAction(scan.id, action);
      const data = await getScans(filter);
      setScans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionBusy(null);
    }
  };

  const handleScanSaved = (response: CreateScanResponse) => {
    setLastScanNote(
      response.wasDuplicate
        ? `Duplicate ${response.scan.codeValue} detected.`
        : `Captured ${response.scan.codeValue}.`,
    );
    fetchScans();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4b79d,_transparent_55%),radial-gradient(circle_at_30%_20%,_#fff5e8,_transparent_45%),linear-gradient(135deg,_#f7f3ea,_#f3efe6)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Bar Scan Operations
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-[color:var(--ink)] sm:text-5xl">
                Live scan control room.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-[color:var(--muted)] sm:text-lg">
                Automatic scans will appear here in real time. Actions are locked to a single
                transition and stored immediately on the backend.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-col items-end gap-3 rounded-2xl border border-[color:var(--panel-border)] bg-white/70 p-4 text-right shadow-sm">
                <span className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  Scanner Status
                </span>
                <span className="text-lg font-semibold text-[color:var(--ink)]">Idle</span>
                <span className="text-xs text-[color:var(--muted)]">
                  Cooldown: 5s • Auto-resume enabled
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total scans", value: stats.total.toString().padStart(2, "0") },
              { label: "Deployed", value: stats.deployed.toString().padStart(2, "0") },
              { label: "Returned", value: stats.returned.toString().padStart(2, "0") },
              {
                label: "Awaiting action",
                value: stats.awaiting.toString().padStart(2, "0"),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[color:var(--panel-border)] bg-white/80 p-4"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
                      Scan history
                    </h2>
                    <span className="ml-auto text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Total: {filteredScans.length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Latest scans from the API. Use the filter to isolate actions.
                  </p>
                </div>
                <div className="flex flex-wrap justify-items-start gap-2">
                  {actionFilters.map((option) => (
                    <button
                      key={option.label}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        filter === option.value
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                          : "border-[color:var(--panel-border)] bg-white text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
                      }`}
                      onClick={() => setFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading && (
                <div className="rounded-2xl border border-dashed border-[color:var(--panel-border)] p-6 text-sm text-[color:var(--muted)]">
                  Loading scans...
                </div>
              )}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {!loading && filteredScans.length === 0 && !error && (
                <div className="rounded-2xl border border-dashed border-[color:var(--panel-border)] p-6 text-sm text-[color:var(--muted)]">
                  No scans yet. Start scanning to populate the audit trail.
                </div>
              )}
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[color:var(--panel-border)] bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--ink)]">
                        {scan.product.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
                        {scan.codeType} • {scan.codeValue}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
                        {!scan.action || scan.action === "AWAITING"
                          ? "Awaiting action"
                          : scan.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        (scan.action && scan.action !== "AWAITING") ||
                        actionBusy === scan.id
                      }
                      onClick={() => handleAction(scan, "DEPLOY")}
                    >
                      Deploy
                    </button>
                    <button
                      className="rounded-full border border-[color:var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        (scan.action && scan.action !== "AWAITING") ||
                        actionBusy === scan.id
                      }
                      onClick={() => handleAction(scan, "RETURN")}
                    >
                      Return
                    </button>
                    {scan.action && scan.action !== "AWAITING" && (
                      <span className="rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <ScannerPanel
              cooldownSeconds={Number(process.env.NEXT_PUBLIC_SCAN_COOLDOWN_SECONDS ?? 5)}
              onScanSaved={handleScanSaved}
            />
            {lastScanNote && (
              <div className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 text-sm text-[color:var(--muted)] shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                {lastScanNote}
              </div>
            )}
            <div className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">System notes</h3>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                <li>Auto-scan triggers are locked for the cooldown window.</li>
                <li>Unknown codes are rejected server-side.</li>
                <li>Actions transition once and persist to history.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
