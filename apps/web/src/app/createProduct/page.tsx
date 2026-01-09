"use client";

import { useState } from "react";
import LabelPreview from "../../components/LabelPreview";
import { CodeType, Product, createProduct } from "../../lib/api";

const codeOptions: Array<{ label: string; value: CodeType }> = [
  { label: "QR Code", value: "QR" },
  { label: "Barcode", value: "BARCODE" },
];

export default function CreateProductPage() {
  const [name, setName] = useState("");
  const [codeType, setCodeType] = useState<CodeType>("BARCODE");
  const [created, setCreated] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const product = await createProduct({ name: name.trim(), codeType });
      setCreated(product);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(150deg,_#f7f3ea,_#efe6d6)] px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Create Product
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
            Generate a new scannable label
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Select a code type, name the product, and the next available code will be
            assigned automatically.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-[color:var(--panel-border)] bg-white/85 p-6 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-4">
              <label className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Code type
              </label>
              <div className="flex flex-wrap gap-2">
                {codeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      codeType === option.value
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--panel-border)] bg-white text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
                    }`}
                    onClick={() => setCodeType(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <label className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Product name
              </label>
              <input
                className="rounded-2xl border border-[color:var(--panel-border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                placeholder="Ex: Field Scanner Kit"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create product"}
              </button>
              <button
                className="rounded-full border border-[color:var(--panel-border)] bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:border-[color:var(--accent)]"
                onClick={() => created && window.print()}
                disabled={!created}
              >
                Print label
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-6 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">Preview</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Generated label will appear here once created.
            </p>
            <div className="mt-4">
              {created ? (
                <LabelPreview
                  label={created.name}
                  codeValue={created.codeValue}
                  codeType={created.codeType}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-[color:var(--panel-border)] bg-white/80 p-6 text-sm text-[color:var(--muted)]">
                  Create a product to generate a label.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
