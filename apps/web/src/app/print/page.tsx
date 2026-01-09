"use client";

import { useEffect, useState } from "react";
import LabelPreview from "../../components/LabelPreview";
import { Product, getProducts } from "../../lib/api";

export default function PrintPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    getProducts()
      .then((data) => {
        if (!alive) {
          return;
        }
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load products.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,_#f7f3ea,_#efe6d6)] px-6 py-10 print:bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Printable Labels
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
              Product QR + Barcode Sheet
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Generated from the seeded product catalog.
            </p>
          </div>
          <button
            className="rounded-full border border-[color:var(--panel-border)] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink)] shadow-sm transition hover:border-[color:var(--accent)]"
            onClick={() => window.print()}
          >
            Print Labels
          </button>
        </header>

        {loading && (
          <div className="rounded-2xl border border-dashed border-[color:var(--panel-border)] bg-white/80 p-8 text-sm text-[color:var(--muted)]">
            Loading product labels…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 print:gap-3">
            {products.map((product) => (
              <LabelPreview
                key={product.id}
                label={product.name}
                codeValue={product.codeValue}
                codeType={product.codeType}
              />
            ))}
            <LabelPreview
              key="unknown-test"
              label="Unknown Test Item"
              codeValue="BAR-9999"
              codeType="BARCODE"
            />
          </section>
        )}
      </div>
    </div>
  );
}
