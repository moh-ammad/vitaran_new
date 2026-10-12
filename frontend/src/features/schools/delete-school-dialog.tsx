"use client";

import { useTransition } from "react";
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
import { deleteSchoolAction } from "./actions";

type DeleteSchoolDialogProps = {
  school: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
};

export function DeleteSchoolDialog({
  school,
  open,
  onOpenChange,
  redirectTo,
}: DeleteSchoolDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      const result = await deleteSchoolAction(school.id);

      if (result.ok) {
        toast.success(`${school.name} was deleted`);
      } else {
        toast.error(result.message);
      }

      onOpenChange(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this school?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{school.name}</span>{" "}
            and all of its details will be permanently removed. This can&apos;t
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="animate-spin" />}
            Delete school
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
