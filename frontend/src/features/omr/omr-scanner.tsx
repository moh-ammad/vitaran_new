"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2, ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { omScanTargetAction, scanOmrAction } from "./actions";
import { isSteady, sheetAlignment, type AlignStatus } from "./sheet-align";
import type { OmScanIdentity, OmScanResult, OmScanTarget } from "@/types/om-scan";

type OmrScannerProps = {
  onScanned: (result: OmScanResult) => void;
};

function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function OmrScanner({ onScanned }: OmrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rollRef = useRef<HTMLInputElement>(null);
  const [rollNo, setRollNo] = useState("");
  const [testId, setTestId] = useState("");
  const [examDate, setExamDate] = useState(today);
  const [lookup, setLookup] = useState<{ query: string; target: OmScanTarget | null; error: string } | null>(null);
  const [checking, startChecking] = useTransition();
  const [cameraWanted, setLive] = useState(false);
  const [hint, setHint] = useState("Point the camera at questions 1–100");
  const [locked, setLocked] = useState(false);
  const [pending, startTransition] = useTransition();
  const goodFrames = useRef(0);
  const lastMarks = useRef<AlignStatus["marks"]>(undefined);
  const pendingRef = useRef(false);
  pendingRef.current = pending;
  /** The auto-capture loop reads this, so a capture always uses the details shown on screen. */
  const identityRef = useRef<OmScanIdentity | null>(null);
  const query = rollNo.trim() && testId.trim() ? `${rollNo.trim()}|${testId.trim()}` : "";
  // A lookup only counts for the exact roll/test currently typed.
  const current = lookup && lookup.query === query ? lookup : null;
  const target = current?.target ?? null;
  const targetError = current?.error ?? "";
  identityRef.current = target ? { rollNo: target.student.rollNo, testId: target.test.testId, examDate } : null;
  const ready = target != null && examDate !== "";
  const live = cameraWanted && ready;

  useEffect(() => {
    if (!query) return;
    const [roll = "", test = ""] = query.split("|");
    const timer = window.setTimeout(() => {
      startChecking(async () => {
        const result = await omScanTargetAction(roll, test);
        setLookup(
          result.ok
            ? { query, target: result.target, error: "" }
            : { query, target: null, error: result.message },
        );
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!live) return;
    let stream: MediaStream | undefined;
    let raf = 0;
    let cancelled = false;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const scale = 360 / Math.max(video.videoWidth, video.videoHeight);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const status = sheetAlignment(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const steady = status.ok && isSteady(lastMarks.current, status.marks, canvas.width);
      lastMarks.current = status.marks;
      setHint(status.ok && !steady ? "Hold still…" : status.reason);
      setLocked(status.ok);
      if (steady) goodFrames.current += 1;
      else goodFrames.current = 0;
      if (goodFrames.current >= 8 && !pendingRef.current) {
        goodFrames.current = 0;
        const full = document.createElement("canvas");
        full.width = video.videoWidth;
        full.height = video.videoHeight;
        full.getContext("2d")?.drawImage(video, 0, 0);
        full.toBlob((blob) => {
          if (blob) submit(new File([blob], "omr-capture.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((next) => {
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = next;
        if (videoRef.current) {
          videoRef.current.srcObject = next;
          void videoRef.current.play();
        }
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        setLive(false);
        toast.error("Camera permission is required, or upload a photo instead.");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // submit reads identityRef, so the loop does not need to restart when details change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  function submit(file: File) {
    const identity = identityRef.current;
    if (!identity) {
      toast.error("Enter roll no and test ID first");
      return;
    }
    const form = new FormData();
    form.append("rollNo", identity.rollNo);
    form.append("testId", identity.testId);
    form.append("examDate", identity.examDate);
    form.append("file", file);
    startTransition(async () => {
      const result = await scanOmrAction(form);
      if (!result.ok) {
        toast.error(result.message);
        goodFrames.current = 0;
        return;
      }
      onScanned(result.result);
      toast.success(`Scored ${result.result.scan.student.name} · ${result.result.scan.total}/${result.result.scan.maxTotal}`);
      // One sheet per student: stop the camera and clear the roll so the next sheet needs its own.
      setLive(false);
      setRollNo("");
      rollRef.current?.focus();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">1 · Sheet details</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="omr-roll">Roll no</Label>
            <Input
              ref={rollRef}
              id="omr-roll"
              value={rollNo}
              autoComplete="off"
              placeholder="22NR530"
              disabled={pending}
              onChange={(event) => setRollNo(event.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="omr-test">Test ID</Label>
            <Input
              id="omr-test"
              value={testId}
              autoComplete="off"
              inputMode="numeric"
              placeholder="23462"
              disabled={pending}
              onChange={(event) => setTestId(event.target.value.trim())}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="omr-date">Exam date</Label>
            <Input
              id="omr-date"
              type="date"
              value={examDate}
              max={today()}
              disabled={pending}
              onChange={(event) => setExamDate(event.target.value)}
            />
          </div>
        </div>
        {checking || (query && !current) ? (
          <p className="flex items-center gap-2 text-xs text-neutral-500">
            <Loader2 className="size-3.5 animate-spin" /> Checking roll no and test ID…
          </p>
        ) : target ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <CheckCircle2 className="size-4" /> {target.student.name}
            </p>
            <p className="mt-0.5 text-xs text-emerald-800">
              {target.student.programName} · Class {target.student.classLevel}
              {target.student.sectionName ? `-${target.student.sectionName}` : ""} · Test ID {target.test.testId} (test
              no. {target.test.testNumber}) · {target.test.questions} questions
            </p>
            {target.previous && (
              <p className="mt-1 text-xs text-amber-800">
                Already scanned ({target.previous.total}/{target.previous.maxTotal}). A new scan replaces it.
              </p>
            )}
          </div>
        ) : targetError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">{targetError}</p>
        ) : (
          <p className="text-xs text-neutral-500">Type the roll no and test ID written on the sheet.</p>
        )}
      </div>

      <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">2 · Scan the sheet</p>
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-black">
        {live ? (
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover" playsInline muted autoPlay />
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 bg-neutral-950 text-white">
            <Camera className="size-10 opacity-70" />
            <p className="text-sm font-semibold">{ready ? "Camera off" : "Enter the sheet details first"}</p>
            <p className="px-6 text-center text-xs text-white/70">
              Fill the frame with questions 1–100. A photo of just the bubble grid is enough — no header needed.
            </p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        {live && (
          <div
            className={cn(
              "pointer-events-none absolute inset-6 rounded-xl border-2",
              locked ? "border-emerald-400" : "border-white/70",
            )}
          />
        )}
        <p
          className={cn(
            "absolute inset-x-0 bottom-0 px-3 py-2 text-center text-xs font-semibold",
            locked ? "bg-emerald-600 text-white" : "bg-black/70 text-white",
          )}
        >
          {pending ? "Reading bubbles…" : live ? hint : ready ? "Open the camera or upload a photo" : "Waiting for sheet details"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!ready || pending}
          onClick={() => setLive(!live)}
          variant={live ? "outline" : "default"}
        >
          <Camera />
          {live ? "Stop camera" : "Open camera"}
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending || !ready}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) submit(file);
              event.target.value = "";
            }}
          />
          <span
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold",
              (pending || !ready) && "opacity-60",
            )}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload photo
          </span>
        </label>
      </div>
      {pending && (
        <p className="flex items-center gap-2 text-sm text-neutral-600">
          <ScanLine className="size-4 animate-pulse" />
          Reading bubbles and scoring against the latest key.
        </p>
      )}
    </div>
  );
}
