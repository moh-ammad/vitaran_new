"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteAnswerKeyAction } from "./actions";

export function DeleteAnswerKeyButton({ id, fileName }: { id: string; fileName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      const result = await deleteAnswerKeyAction(id);
      if (result.ok) toast.success("Answer key deleted");
      else toast.error(result.message);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        title="Delete"
        aria-label={`Delete ${fileName}`}
        onClick={() => setOpen(true)}
        className="inline-flex size-8 items-center justify-center text-neutral-500 transition-colors hover:bg-destructive/10 hover:text-destructive [&_svg]:size-4"
      >
        <Trash2 />
      </button>
      <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this answer key?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{fileName}</span> will be
              permanently removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
              {pending && <Loader2 className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
