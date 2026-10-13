export const ANSWER_KEYS_PATH = "/admin/answer-keys";
export const ANSWER_KEY_UPLOAD_PATH = `${ANSWER_KEYS_PATH}/upload`;

export const ANSWER_KEY_MAX_BYTES = 10 * 1024 * 1024;

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

export const TEST_NUMBERS = range(1, 100);
export const CLASS_LEVELS = range(1, 12);

/** Where a signed-in school opens an answer key's PDF. */
export const SCHOOL_ANSWER_KEYS_PATH = "/answer-keys";
export const schoolAnswerKeyFileHref = (id: string) => `${SCHOOL_ANSWER_KEYS_PATH}/${id}/file`;
export const schoolAnswerKeyDownloadHref = (id: string) => `${schoolAnswerKeyFileHref(id)}?download=1`;

export const answerKeyFileHref = (id: string) => `${ANSWER_KEYS_PATH}/${id}/file`;
export const answerKeyEditHref = (id: string) => `${ANSWER_KEYS_PATH}/${id}/edit`;

/** Saves within the same second as the upload aren't edits. */
export const wasEdited = ({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) =>
  new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
