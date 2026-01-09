"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { CodeType } from "../lib/api";

type LabelPreviewProps = {
  codeValue: string;
  codeType: CodeType;
  label: string;
};

export default function LabelPreview({ codeValue, codeType, label }: LabelPreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (codeType !== "QR") {
      return;
    }

    QRCode.toDataURL(codeValue, { margin: 1, width: 240 })
      .then((url: string) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [codeType, codeValue]);

  useEffect(() => {
    if (codeType !== "BARCODE" || !svgRef.current) {
      return;
    }

    JsBarcode(svgRef.current, codeValue, {
      displayValue: false,
      margin: 0,
      height: 80,
      width: 2,
      fontSize: 14,
      textMargin: 4,
    });
  }, [codeType, codeValue]);

  const typeBadge = useMemo(() => (codeType === "QR" ? "QR" : "BARCODE"), [codeType]);

  return (
    <div className="flex break-inside-avoid flex-col gap-4 rounded-2xl border border-[color:var(--panel-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--ink)]">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
            {codeValue}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--panel-border)] px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
          {typeBadge}
        </span>
      </div>
      <div className="flex items-center justify-center rounded-xl border border-[color:var(--panel-border)] bg-[linear-gradient(145deg,_#fff9f1,_#f4e8db)] p-3">
        {codeType === "QR" ? (
          qrDataUrl ? (
            <img src={qrDataUrl} alt={`${label} QR`} className="h-40 w-40" />
          ) : (
            <div className="text-xs text-[color:var(--muted)]">Generating QR…</div>
          )
        ) : (
          <svg ref={svgRef} className="h-24 w-full max-w-[240px]" />
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
        Bar Scan Platform • {codeType}
      </p>
    </div>
  );
}
