import "server-only";

/** Metadata goes in the query string and the PDF, when there is one, is the request body. */
export function pdfUploadRequest(
  meta: Record<string, string | number | undefined>,
  file?: File,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  if (file) query.set("fileName", file.name);

  return {
    query,
    init: file ? { headers: { "Content-Type": "application/pdf" }, body: file } : {},
  };
}
