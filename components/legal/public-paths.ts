export const LEGAL_PUBLIC_PATHS = [
  "/termos",
  "/privacidade",
  "/reembolso",
] as const;

export function isLegalPublicPath(pathname: string): boolean {
  return LEGAL_PUBLIC_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
