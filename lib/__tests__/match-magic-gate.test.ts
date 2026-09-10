import { describe, expect, it } from "vitest";
import {
  MATCH_GATE_COPY,
  MATCH_GATE_KIND,
  buildNewMatchHref,
  getMatchGateCta,
  getMatchGateMessage,
  hasReadyMagicBoard,
  resolveInitialReferenceBoardId,
  resolveMatchGate,
} from "@/components/board-spec/match-magic-gate";

describe("resolveMatchGate", () => {
  it("bloqueia quando não há prancha", () => {
    expect(resolveMatchGate([])).toBe(MATCH_GATE_KIND.noBoard);
  });

  it("bloqueia quando só há rascunho, processando ou erro", () => {
    expect(
      resolveMatchGate([
        { status: "draft" },
        { status: "processing" },
        { status: "error" },
      ]),
    ).toBe(MATCH_GATE_KIND.waitingReady);
  });

  it("libera quando existe pelo menos uma pronta", () => {
    expect(
      resolveMatchGate([{ status: "draft" }, { status: "ready" }]),
    ).toBe(MATCH_GATE_KIND.unlocked);
  });
});

describe("hasReadyMagicBoard", () => {
  it("retorna true só com status ready", () => {
    expect(hasReadyMagicBoard([{ status: "processing" }])).toBe(false);
    expect(hasReadyMagicBoard([{ status: "ready" }])).toBe(true);
  });
});

describe("getMatchGateMessage", () => {
  it("usa as copies da Spec", () => {
    expect(getMatchGateMessage(MATCH_GATE_KIND.noBoard)).toBe(
      MATCH_GATE_COPY.noBoard,
    );
    expect(getMatchGateMessage(MATCH_GATE_KIND.waitingReady)).toBe(
      MATCH_GATE_COPY.waitingReady,
    );
    expect(getMatchGateMessage(MATCH_GATE_KIND.unlocked)).toBe(
      MATCH_GATE_COPY.readyNoMatches,
    );
  });
});

describe("getMatchGateCta", () => {
  it("aponta cadastro sem prancha e lista quando aguarda ficha", () => {
    expect(getMatchGateCta(MATCH_GATE_KIND.noBoard)).toEqual({
      href: "/boards/new",
      label: "Cadastrar prancha mágica",
    });
    expect(getMatchGateCta(MATCH_GATE_KIND.waitingReady)).toEqual({
      href: "/boards",
      label: "Ver minhas pranchas",
    });
    expect(getMatchGateCta(MATCH_GATE_KIND.unlocked)).toEqual({
      href: "/compatibility/new",
      label: "Fazer Match",
    });
  });
});

describe("buildNewMatchHref", () => {
  it("monta deep link com referência pré-selecionada", () => {
    expect(buildNewMatchHref()).toBe("/compatibility/new");
    expect(buildNewMatchHref("abc-123")).toBe(
      "/compatibility/new?board=abc-123",
    );
  });
});

describe("resolveInitialReferenceBoardId", () => {
  const readyBoards = [{ id: "board-a" }, { id: "board-b" }];

  it("aceita preferred quando a mágica está pronta", () => {
    expect(resolveInitialReferenceBoardId(readyBoards, "board-b")).toBe(
      "board-b",
    );
  });

  it("ignora preferred ausente ou não pronta", () => {
    expect(resolveInitialReferenceBoardId(readyBoards, null)).toBe("");
    expect(resolveInitialReferenceBoardId(readyBoards, "board-x")).toBe("");
  });
});
