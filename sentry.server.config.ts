import * as Sentry from "@sentry/nextjs";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function scrubString(value: string): string {
  return value.replace(EMAIL_PATTERN, "[email]");
}

const tracesSampleRate = process.env.NODE_ENV === "production" ? 0.1 : 1;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN?.trim()),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.message) {
      event.message = scrubString(event.message);
    }

    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((entry) => ({
        ...entry,
        value: entry.value ? scrubString(entry.value) : entry.value,
      }));
    }

    return event;
  },
});
