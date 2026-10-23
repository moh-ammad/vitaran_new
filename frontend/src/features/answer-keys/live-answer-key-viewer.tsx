"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useLiveContent } from "@/features/live/use-live-content";
import type { AnswerKeyDetail } from "@/types/answer-key";
import { KeyCorrectionsList } from "./key-corrections-list";
import { loadSchoolAnswerKeyAction, loadTeacherAnswerKeyAction } from "./portal-answer-keys-action";

type LiveAnswerKeyViewerProps = {
  role: "school" | "teacher";
  answerKey: AnswerKeyDetail;
};

/** School / teacher — only options admin changed. PDF is not reprinted. */
export function LiveAnswerKeyViewer({ role, answerKey }: LiveAnswerKeyViewerProps) {
  const [current, setCurrent] = useState(answerKey);
  const [, startReload] = useTransition();

  const apply = useCallback((next: AnswerKeyDetail) => {
    setCurrent((prev) => {
      if (prev.updatedAt === next.updatedAt) return prev;
      toast.message("Key corrections updated");
      return next;
    });
  }, []);

  const reload = useCallback(() => {
    startReload(async () => {
      const next =
        role === "school"
          ? await loadSchoolAnswerKeyAction(answerKey.id)
          : await loadTeacherAnswerKeyAction(answerKey.id);
      if (next) apply(next);
    });
  }, [apply, answerKey.id, role]);

  useLiveContent("answer-keys", reload);

  useEffect(() => {
    setCurrent(answerKey);
  }, [answerKey]);

  return <KeyCorrectionsList key={current.updatedAt} answerKey={current} />;
}
