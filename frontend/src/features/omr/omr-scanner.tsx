"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
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
  const [hint, setHint] = useState("Hold the sheet in frame");
  const [locked, setLocked] = useState(false);
  const [pending, startTransition] = useTransition();
  const goodFrames = useRef(0);
  const lastMarks = useRef<AlignStatus["marks"]>(undefined);
  const pendingRef = useRef(false);
  pendingRef.current = pending;
  const identityRef = useRef<OmScanIdentity | null>(null);
  const query = rollNo.trim() && testId.trim() ? `${rollNo.trim()}|${testId.trim()}` : "";
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
      setHint(status.ok && !steady ? "Hold still" : status.reason);
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
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
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
        toast.error("Allow the camera, or upload a photo.");
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
      toast.success(`${result.result.scan.student.name} · ${result.result.scan.total}/${result.result.scan.maxTotal}`);
      setLive(false);
      setRollNo("");
      rollRef.current?.focus();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="omr-roll">Roll</Label>
            <Input
              ref={rollRef}
              id="omr-roll"
              value={rollNo}
              autoComplete="off"
              inputMode="text"
              enterKeyHint="next"
              disabled={pending}
              className="h-11"
              onChange={(event) => setRollNo(event.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="omr-test">Test ID</Label>
            <Input
              id="omr-test"
              value={testId}
              autoComplete="off"
              inputMode="numeric"
              enterKeyHint="next"
              disabled={pending}
              className="h-11"
              onChange={(event) => setTestId(event.target.value.trim())}
            />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor="omr-date">Date</Label>
            <Input
              id="omr-date"
              type="date"
              value={examDate}
              max={today()}
              disabled={pending}
              className="h-11"
              onChange={(event) => setExamDate(event.target.value)}
            />
          </div>
        </div>
        {checking || (query && !current) ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin" />
          </p>
        ) : target ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
            <span className="font-semibold text-emerald-950">{target.student.name}</span>
            <span className="text-emerald-800">
              {target.student.classLevel}
              {target.student.sectionName ? `-${target.student.sectionName}` : ""}
            </span>
            {target.previous ? (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {target.previous.total}/{target.previous.maxTotal}
              </span>
            ) : null}
          </div>
        ) : targetError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{targetError}</p>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-black">
        {live ? (
          <video
            ref={videoRef}
            className="h-[52vh] w-full object-cover lg:h-auto lg:aspect-[3/4]"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <div className="flex h-[52vh] w-full flex-col items-center justify-center bg-neutral-950 text-white lg:h-auto lg:aspect-[3/4]">
            <Camera className="size-12 opacity-60" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        {live && (
          <div
            className={cn(
              "pointer-events-none absolute inset-4 rounded-xl border-2 sm:inset-6",
              locked ? "border-emerald-400" : "border-white/70",
            )}
          />
        )}
        {(live || pending) && (
          <p
            className={cn(
              "absolute inset-x-0 bottom-0 px-3 py-2.5 text-center text-sm font-semibold",
              locked || pending ? "bg-emerald-600 text-white" : "bg-black/70 text-white",
            )}
          >
            {pending ? "Reading…" : hint}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={!ready || pending}
          onClick={() => setLive(!live)}
          variant={live ? "outline" : "default"}
          className="h-12 text-base"
        >
          <Camera />
          {live ? "Stop" : "Camera"}
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
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
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-base font-semibold",
              (pending || !ready) && "opacity-60",
            )}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Photo
          </span>
        </label>
      </div>
    </div>
  );
}
