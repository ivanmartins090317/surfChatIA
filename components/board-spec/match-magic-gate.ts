/**
 * Gate UX do Match: só libera novo fluxo quando existe prancha mágica `ready`.
 * Backend continua aceitando Match sem referência — a dependência é só de produto/UI.
 */

export const MATCH_GATE_COPY = {
  noBoard: "Cadastre sua prancha mágica para liberar o Match.",
  waitingReady:
    "Aguarde a ficha ficar pronta para comparar outras pranchas.",
  readyNoMatches: "Compare uma prancha candidata com a sua mágica.",
} as const;

export const MATCH_GATE_KIND = {
  noBoard: "no_board",
  waitingReady: "waiting_ready",
  unlocked: "unlocked",
} as const;

export type MatchGateKind =
  (typeof MATCH_GATE_KIND)[keyof typeof MATCH_GATE_KIND];

interface BoardStatusLike {
  id?: string;
  status: string;
}

export function hasReadyMagicBoard(boards: BoardStatusLike[]): boolean {
  return boards.some((board) => board.status === "ready");
}

export function resolveMatchGate(boards: BoardStatusLike[]): MatchGateKind {
  if (boards.length === 0) return MATCH_GATE_KIND.noBoard;
  if (!hasReadyMagicBoard(boards)) return MATCH_GATE_KIND.waitingReady;
  return MATCH_GATE_KIND.unlocked;
}

export function getMatchGateMessage(kind: MatchGateKind): string {
  if (kind === MATCH_GATE_KIND.noBoard) return MATCH_GATE_COPY.noBoard;
  if (kind === MATCH_GATE_KIND.waitingReady)
    return MATCH_GATE_COPY.waitingReady;
  return MATCH_GATE_COPY.readyNoMatches;
}

export function getMatchGateCta(kind: MatchGateKind): {
  href: string;
  label: string;
} {
  if (kind === MATCH_GATE_KIND.noBoard) {
    return { href: "/boards/new", label: "Cadastrar prancha mágica" };
  }
  if (kind === MATCH_GATE_KIND.waitingReady) {
    return { href: "/boards", label: "Ver minhas pranchas" };
  }
  return { href: "/compatibility/new", label: "Fazer Match" };
}

export function buildNewMatchHref(referenceBoardId?: string | null): string {
  if (!referenceBoardId) return "/compatibility/new";
  return `/compatibility/new?board=${encodeURIComponent(referenceBoardId)}`;
}

export function resolveInitialReferenceBoardId(
  readyBoards: Array<{ id: string }>,
  preferredBoardId: string | null | undefined,
): string {
  if (!preferredBoardId) return "";
  const isReady = readyBoards.some((board) => board.id === preferredBoardId);
  return isReady ? preferredBoardId : "";
}
