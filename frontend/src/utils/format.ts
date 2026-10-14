const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const numberFormatter = new Intl.NumberFormat("en-IN");

export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

export const formatDateTime = (iso: string) =>
  dateTimeFormatter.format(new Date(iso));

export const formatTime = (iso: string) => timeFormatter.format(new Date(iso));

export const formatNumber = (value: number) => numberFormatter.format(value);

export const classLabel = (level: number) => `Class ${level}`;
