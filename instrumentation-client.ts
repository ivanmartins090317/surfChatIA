import * as Sentry from "@sentry/nextjs";

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function scrubString(value: string): string {
  return value.replace(EMAIL_PATTERN, "[email]");
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn?.trim()),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
