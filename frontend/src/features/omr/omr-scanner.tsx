"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { omScanTargetAction, scanOmrAction } from "./actions";
import { checkFrame } from "./sheet-align";
import type { OmScanIdentity, OmScanResult, OmScanTarget } from "@/types/om-scan";

type OmrScannerProps = {
  onScanned: (result: OmScanResult) => void;
};

function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const COMPACT_SIDE = 2200;

/** Phone camera JPEGs are huge; shrink before the ngrok hop so Reading does not stall. */
async function compactOmrFile(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPACT_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_200_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export function OmrScanner({ onScanned }: OmrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rollRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [rollNo, setRollNo] = useState("");
  const [testId, setTestId] = useState("");
  const [examDate, setExamDate] = useState(today);
  const [lookup, setLookup] = useState<{
    query: string;
    target: OmScanTarget | null;
    error: string;
  } | null>(null);
  const [checking, startChecking] = useTransition();
  const [cameraWanted, setLive] = useState(false);
  const [hint, setHint] = useState("Fill the frame with questions 1–100");
  const [locked, setLocked] = useState(false);
  const [pending, setPending] = useState(false);
  /** Bumped on every read and on Stop; a reply from an older read is ignored. */
  const readIdRef = useRef(0);
  const goodFrames = useRef(0);
  const lastThumb = useRef<Uint8Array | null>(null);
  /** True from the moment a frame is grabbed until the server answers. */
  const busyRef = useRef(false);
  /** After a failed read, auto-capture waits so the teacher can re-frame the sheet. */
  const retryAtRef = useRef(0);
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
          result.ok ? { query, target: result.target, error: "" } : { query, target: null, error: result.message },
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
    let lastCheck = 0;

    const loop = (now: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || now - lastCheck < 120) {
        raf = requestAnimationFrame(loop);
        return;
      }
      lastCheck = now;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const scale = 480 / Math.max(video.videoWidth, video.videoHeight);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const status = checkFrame(ctx.getImageData(0, 0, canvas.width, canvas.height), lastThumb.current);
      lastThumb.current = status.thumb;
      setHint(status.reason);
      setLocked(status.ok);
      if (status.ok) goodFrames.current += 1;
      else goodFrames.current = 0;
      if (goodFrames.current >= 5 && !busyRef.current && now >= retryAtRef.current) {
        goodFrames.current = 0;
        void snapNow();
      }
      raf = requestAnimationFrame(loop);
    };

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((next) => {
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = next;
        streamRef.current = next;
        const track = next.getVideoTracks()[0];
        void track
          ?.applyConstraints({
            advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
          })
          .catch(() => undefined);
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
      if (streamRef.current === stream) streamRef.current = null;
    };
    // submit reads identityRef, so the loop does not need to restart when details change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  /**
   * The frame on screen, at the stream's full resolution. ImageCapture.takePhoto is not used:
   * on many Android phones it returns the sensor image sideways with no orientation tag.
   */
  async function captureStill(video: HTMLVideoElement): Promise<File | null> {
    if (!video.videoWidth || !video.videoHeight) return null;
    const full = document.createElement("canvas");
    full.width = video.videoWidth;
    full.height = video.videoHeight;
    full.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => full.toBlob(resolve, "image/jpeg", 0.92));
    return blob ? new File([blob], "omr-capture.jpg", { type: "image/jpeg" }) : null;
  }

  function submit(file: File) {
    const identity = identityRef.current;
    if (!identity) {
      busyRef.current = false;
      toast.error("Enter roll no and test ID first");
      return;
    }
    busyRef.current = true;
    const id = ++readIdRef.current;
    setPending(true);
    void (async () => {
      try {
        const compact = await compactOmrFile(file);
        const form = new FormData();
        form.append("rollNo", identity.rollNo);
        form.append("testId", identity.testId);
        form.append("examDate", identity.examDate);
        form.append("file", compact);
        const result = await scanOmrAction(form);
        if (id !== readIdRef.current) return;
        if (!result.ok) {
          toast.error(result.message);
          goodFrames.current = 0;
          retryAtRef.current = performance.now() + 2500;
          return;
        }
        onScanned(result.result);
        toast.success(
          `${result.result.scan.student.name} · ${result.result.scan.total}/${result.result.scan.maxTotal}`,
        );
        setLive(false);
        setRollNo("");
        rollRef.current?.focus();
      } catch {
        if (id !== readIdRef.current) return;
        toast.error("Could not send the photo. Check the connection and try again.");
        retryAtRef.current = performance.now() + 2500;
      } finally {
        if (id === readIdRef.current) {
          busyRef.current = false;
          setPending(false);
        }
      }
    })();
  }

  /** The server may still finish this read; its reply is dropped so the teacher can retake. */
  function stopReading() {
    readIdRef.current += 1;
    busyRef.current = false;
    goodFrames.current = 0;
    retryAtRef.current = performance.now() + 2000;
    setPending(false);
    toast("Reading stopped. Retake the photo.");
  }

  async function snapNow() {
    const video = videoRef.current;
    if (!video || busyRef.current) return;
    busyRef.current = true;
    const file = await captureStill(video);
    if (file) submit(file);
    else busyRef.current = false;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="omr-roll">Roll no.</Label>
            <Input
              ref={rollRef}
              id="omr-roll"
              value={rollNo}
              autoComplete="off"
              inputMode="text"
              enterKeyHint="next"
              disabled={pending}
              className="h-11 min-w-0"
              onChange={(event) => setRollNo(event.target.value.toUpperCase())}
            />
          </div>
          <div className="min-w-0 space-y-1">
            <Label htmlFor="omr-test">Test ID</Label>
            <Input
              id="omr-test"
              value={testId}
              autoComplete="off"
              inputMode="numeric"
              enterKeyHint="next"
              disabled={pending}
              className="h-11 min-w-0"
              onChange={(event) => setTestId(event.target.value.trim())}
            />
          </div>
          <div className="col-span-2 min-w-0 space-y-1">
            <Label htmlFor="omr-date">Date</Label>
            <Input
              id="omr-date"
              type="date"
              value={examDate}
              max={today()}
              disabled={pending}
              className="h-11 w-full min-w-0"
              onChange={(event) => setExamDate(event.target.value)}
            />
          </div>
        </div>
        {checking || (query && !current) ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin" />
          </p>
        ) : target ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
            <span className="font-semibold text-emerald-950">{target.student.name}</span>
            <span className="min-w-0 text-emerald-800">
              Class {target.student.classLevel}
              {target.student.sectionName ? `-${target.student.sectionName}` : ""}
              {" · "}
              {target.student.programName}
              {" · Test "}
              {target.test.testNumber}
              {" · ID "}
              {target.test.testId}
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
            className="h-[56vh] w-full object-contain lg:h-auto lg:aspect-[3/4]"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <div className="flex h-[56vh] w-full flex-col items-center justify-center bg-neutral-950 text-white lg:h-auto lg:aspect-[3/4]">
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

      {pending ? (
        <Button type="button" variant="destructive" onClick={stopReading} className="h-12 w-full text-base">
          <X />
          Stop reading
        </Button>
      ) : (
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
          {live ? (
            <Button
              type="button"
              disabled={!ready || pending}
              onClick={() => void snapNow()}
              className="h-12 text-base"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Snap
            </Button>
          ) : (
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
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-base font-semibold",
                  (pending || !ready) && "opacity-60",
                )}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Photo
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
