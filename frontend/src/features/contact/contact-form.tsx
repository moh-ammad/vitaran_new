"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, Paperclip, Send, X } from "lucide-react";
import { interests } from "./content";

const inputClasses =
  "mt-2 w-full rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const onCancel = () => {
    formRef.current?.reset();
    setFiles([]);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center text-brand-900 shadow-2xl">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-800">
          <CheckCircle2 className="size-7" />
        </div>
        <h3 className="mt-5 text-2xl font-bold">Thank you!</h3>
        <p className="mt-2 max-w-xs text-muted-foreground">
          We&apos;ve received your request and will be in touch soon.
        </p>
        <button
          type="button"
          onClick={() => {
            onCancel();
            setSubmitted(false);
          }}
          className="mt-6 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 text-brand-900 shadow-2xl sm:p-8">
      <h2 className="text-2xl font-bold">Drop us a line!</h2>

      <form ref={formRef} onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">
              Name <span className="text-brand-500">*</span>
            </span>
            <input
              name="name"
              required
              autoComplete="name"
              className={inputClasses}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              Work Email <span className="text-brand-500">*</span>
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClasses}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">
              School / Organisation <span className="text-brand-500">*</span>
            </span>
            <input
              name="organisation"
              required
              autoComplete="organization"
              className={inputClasses}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Phone</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              className={inputClasses}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Interested in</span>
          <select name="interest" defaultValue="" className={inputClasses}>
            <option value="" disabled>
              Select a service
            </option>
            {interests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Message</span>
          <textarea
            name="message"
            rows={4}
            placeholder="Tell us about your requirements…"
            className={`${inputClasses} resize-none`}
          />
        </label>

        <div>
          <span className="text-sm font-medium">Attach Files</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-5 text-sm font-medium text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
          >
            <Paperclip className="size-4" />
            Choose files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFilesChange}
            className="sr-only"
            tabIndex={-1}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Attachments ({files.length})
          </p>
          {files.length > 0 && (
            <ul className="mt-2 space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded-full p-1 text-brand-500 hover:bg-brand-100 hover:text-brand-800"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-brand-200 px-6 py-3.5 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-50 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            Send
            <Send className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
