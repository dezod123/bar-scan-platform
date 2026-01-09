"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
} from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { CodeType, CreateScanResponse, createScan } from "../lib/api";

type ScanStatus = {
  state: "initializing" | "ready" | "processing" | "cooldown" | "error";
  message: string;
};

type Detection = {
  text: string;
  format: BarcodeFormat;
  ts: number;
};

type ScannerPanelProps = {
  cooldownSeconds?: number;
  onScanSaved?: (response: CreateScanResponse) => void;
};

export default function ScannerPanel({ cooldownSeconds = 5, onScanSaved }: ScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const cooldownUntilRef = useRef<number>(0);
  const processingRef = useRef(false);
  const lastDetectRef = useRef<number>(Date.now());
  
  const [status, setStatus] = useState<ScanStatus>({
    state: "initializing",
    message: "Requesting camera access…",
  });
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ text: string; tone: "success" | "warn" | "error" } | null>(
    null,
  );
  const [online, setOnline] = useState(true);
  const [sessionKey, setSessionKey] = useState(0);
  const [idleHint, setIdleHint] = useState<string | null>(null);
  const safeCooldownSeconds =
    Number.isFinite(cooldownSeconds) && cooldownSeconds > 0 ? cooldownSeconds : 5;

  const playTone = (type: "success" | "warn" | "error") => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type === "error" ? "square" : "sine";
    oscillator.frequency.value = type === "warn" ? 320 : type === "error" ? 180 : 520;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  };

  const vibrate = (pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (processingRef.current) {
        return;
      }
      const idleMs = Date.now() - lastDetectRef.current;
      if (idleMs > 10000) {
        setIdleHint("Slow focus? Move closer or increase lighting.");
      } else {
        setIdleHint(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!processingRef.current) {
        return;
      }
      if (Date.now() >= cooldownUntilRef.current) {
        processingRef.current = false;
        detectionsRef.current = [];
        setStatus({ state: "ready", message: "Scanning resumed." });
        setOverlay(null);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const start = async () => {
      if (!videoRef.current) {
        return;
      }

      try {
        setStatus({ state: "ready", message: "Camera ready. Scanning…" });
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, error) => {
          if (!mounted) {
            return;
          }

          if (error && !(error instanceof NotFoundException)) {
            setStatus({ state: "error", message: "Camera error. Check permissions." });
            return;
          }

          if (!result || processingRef.current) {
            return;
          }

          const now = Date.now();
          lastDetectRef.current = now;
          if (now < cooldownUntilRef.current) {
            return;
          }

          const text = result.getText();
          const format = result.getBarcodeFormat();

          detectionsRef.current = detectionsRef.current.filter(
            (item) => now - item.ts < 1500,
          );
          detectionsRef.current.push({ text, format, ts: now });

          const matches = detectionsRef.current.filter(
            (item) => item.text === text && item.format === format,
          );

          if (matches.length < 3) {
            return;
          }

          processingRef.current = true;
          setStatus({ state: "processing", message: "Processing scan…" });

          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.videoWidth && video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setSnapshot(canvas.toDataURL("image/jpeg", 0.72));
              }
            }
          }

          try {
            if (!canvasRef.current) {
              throw new Error("Capture failed.");
            }

            if (!online) {
              throw new Error("Offline. Check your network connection.");
            }

            const decoded = reader.decodeFromCanvas(canvasRef.current);
            const decodedValue = decoded.getText();
            const decodedFormat = decoded.getBarcodeFormat();
            const codeType: CodeType =
              decodedFormat === BarcodeFormat.QR_CODE ? "QR" : "BARCODE";

            const response = await createScan({
              codeValue: decodedValue,
              codeType,
            });
            onScanSaved?.(response);
            setStatus({
              state: "cooldown",
              message: response.wasDuplicate
                ? "Duplicate detected. Cooling down…"
                : "Scan saved. Cooling down…",
            });
            setOverlay({
              text: response.wasDuplicate ? "Duplicate scan" : "Scan captured",
              tone: response.wasDuplicate ? "warn" : "success",
            });
            playTone(response.wasDuplicate ? "warn" : "success");
            vibrate(response.wasDuplicate ? [30, 40, 30] : 40);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Scan failed.";
            const lower = message.toLowerCase();
            const isUnknown = lower.includes("unknown code");
            setStatus({
              state: "error",
              message,
            });
            setOverlay({ text: isUnknown ? "Unknown code" : "Scan failed", tone: "error" });
            playTone("error");
            vibrate([60, 40, 60]);
          } finally {
            detectionsRef.current = [];
            cooldownUntilRef.current = Date.now() + safeCooldownSeconds * 1000;
            setTimeout(() => {
              if (!mounted) {
                return;
              }
              processingRef.current = false;
              setStatus({ state: "ready", message: "Scanning resumed." });
              setOverlay(null);
            }, safeCooldownSeconds * 1000);
          }
        },
      );

        controlsRef.current = controls;
      } catch (err) {
        setStatus({
          state: "error",
          message:
            err instanceof Error
              ? `Camera access denied. ${err.message}`
              : "Camera access denied.",
        });
      }
    };

    start();

    return () => {
      mounted = false;
      controlsRef.current?.stop();
      readerRef.current = null;
    };
  }, [safeCooldownSeconds, onScanSaved, online, sessionKey]);

  return (
    <div className="rounded-3xl border border-[color:var(--panel-border)] bg-white/85 p-6 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">Live feed</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{status.message}</p>
          {!online && (
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-red-500">
              Offline — scans will not sync.
            </p>
          )}
          {idleHint && status.state === "ready" && (
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
              {idleHint}
            </p>
          )}
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] ${
            status.state === "ready"
              ? "border-emerald-400/60 bg-emerald-50 text-emerald-700"
              : status.state === "error"
                ? "border-red-400/60 bg-red-50 text-red-700"
                : "border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--muted)]"
          }`}
        >
          {status.state}
        </span>
      </div>
      {status.state === "error" && (
        <button
          className="mt-4 w-full rounded-full border border-[color:var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
          onClick={() => {
            setOverlay(null);
            setSnapshot(null);
            setStatus({ state: "initializing", message: "Reconnecting camera…" });
            setSessionKey((prev) => prev + 1);
          }}
        >
          Retry Camera
        </button>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--panel-border)] bg-[#0e0b0a]">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted />
          {overlay && (
            <div
              className={`absolute inset-0 flex items-center justify-center text-center text-sm uppercase tracking-[0.35em] ${
                overlay.tone === "success"
                  ? "bg-emerald-500/20 text-emerald-50"
                  : overlay.tone === "warn"
                    ? "bg-amber-500/20 text-amber-50"
                    : "bg-red-500/30 text-red-50"
              }`}
            >
              <div className="rounded-full border border-white/30 bg-black/40 px-6 py-3 font-semibold backdrop-blur">
                {overlay.text}
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-dashed border-[color:var(--panel-border)] bg-[linear-gradient(140deg,_#fdf6ee,_#f6eadc)] p-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">
            Last capture
          </p>
          <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-white">
            {snapshot ? (
              <img src={snapshot} alt="Last scan capture" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--muted)]">
                Awaiting scan…
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
