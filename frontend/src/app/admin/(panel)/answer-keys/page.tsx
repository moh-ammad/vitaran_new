import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { ANSWER_KEY_UPLOAD_PATH } from "@/features/answer-keys/constants";
import { RecentUploads } from "@/features/answer-keys/recent-uploads";
import { listRecentAnswerKeys } from "@/services/answer-keys";

export const metadata: Metadata = { title: "Answer Keys" };

export default async function AdminAnswerKeysPage() {
  const answerKeys = await listRecentAnswerKeys();

  return (
    <>
      <PageHeader
        title="Answer Keys"
        description="Upload answer keys for regular programs or for a customized school."
        actions={
          <Link
            href={ANSWER_KEY_UPLOAD_PATH}
            className={buttonVariants({ className: "h-10 rounded-lg bg-brand-900 px-4 text-white hover:bg-brand-800" })}
          >
            <Upload />
            Upload answer key
          </Link>
        }
      />
      <RecentUploads answerKeys={answerKeys} />
    </>
  );
}
