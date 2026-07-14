import * as Sentry from "@sentry/nextjs";

export interface ServerErrorContext {
  area: "ai" | "upload" | "auth" | "rate-limit";
  operation: string;
  userId?: string;
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function scrubString(value: string): string {
  return value.replace(EMAIL_PATTERN, "[email]");
}

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubString(value);
  }

  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, scrubValue(nested)]),
    );
  }

  return value;
}

function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function reportServerError(
  error: unknown,
  context: ServerErrorContext,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);
    scope.setTag("operation", context.operation);

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    if (error instanceof Error) {
      scope.setExtra("message_scrubbed", scrubString(error.message));
    }

    scope.addEventProcessor((event) => {
      if (event.message) {
        event.message = scrubString(event.message);
      }

      if (event.exception?.values) {
        event.exception.values = event.exception.values.map((entry) => ({
          ...entry,
          value: entry.value ? scrubString(entry.value) : entry.value,
        }));
      }

      if (event.extra) {
        event.extra = scrubValue(event.extra) as Record<string, unknown>;
      }

      return event;
    });

    Sentry.captureException(error);
  });
}

export function reportServerMessage(
  message: string,
  context: ServerErrorContext,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);
    scope.setTag("operation", context.operation);

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    Sentry.captureMessage(scrubString(message), "error");
  });
}
