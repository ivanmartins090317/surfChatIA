import { describe, expect, it } from "vitest";
import { isLegalPublicPath } from "@/components/legal/public-paths";
import {
  buildAccountExportPayload,
  hasAcceptedLegalTerms,
  isValidDeleteConfirmation,
  DELETE_ACCOUNT_CONFIRMATION,
} from "@/services/account-privacy-shared";

describe("rotas legais públicas", () => {
  it("libera termos, privacidade e reembolso", () => {
    expect(isLegalPublicPath("/termos")).toBe(true);
    expect(isLegalPublicPath("/privacidade")).toBe(true);
    expect(isLegalPublicPath("/reembolso")).toBe(true);
    expect(isLegalPublicPath("/termos/extra")).toBe(true);
  });

  it("não libera rotas autenticadas como públicas legais", () => {
    expect(isLegalPublicPath("/dashboard")).toBe(false);
    expect(isLegalPublicPath("/profile")).toBe(false);
    expect(isLegalPublicPath("/")).toBe(false);
  });
});

describe("aceite legal no cadastro", () => {
  it("aceita valores explícitos de checkbox", () => {
    expect(hasAcceptedLegalTerms("1")).toBe(true);
    expect(hasAcceptedLegalTerms("on")).toBe(true);
    expect(hasAcceptedLegalTerms("true")).toBe(true);
  });

  it("rejeita ausência ou valores inválidos", () => {
    expect(hasAcceptedLegalTerms(null)).toBe(false);
    expect(hasAcceptedLegalTerms("")).toBe(false);
    expect(hasAcceptedLegalTerms("0")).toBe(false);
    expect(hasAcceptedLegalTerms("no")).toBe(false);
  });
});

describe("exclusão e exportação de conta", () => {
  it("exige confirmação EXCLUIR", () => {
    expect(isValidDeleteConfirmation("EXCLUIR")).toBe(true);
    expect(isValidDeleteConfirmation(" excluir ")).toBe(true);
    expect(isValidDeleteConfirmation("apagar")).toBe(false);
    expect(DELETE_ACCOUNT_CONFIRMATION).toBe("EXCLUIR");
  });

  it("monta pacote de portabilidade legível", () => {
    const payload = buildAccountExportPayload({
      userId: "user-1",
      email: "surf@example.com",
      profile: { display_name: "Ana" },
      mediaItems: [{ id: "m1" }],
      analyses: [{ id: "a1" }],
      boards: [{ id: "b1" }],
      productFeedback: [],
      usageLedger: [{ credits_delta: -1 }],
      exportedAt: "2026-08-10T12:00:00.000Z",
    });

    expect(payload).toEqual({
      exportedAt: "2026-08-10T12:00:00.000Z",
      userId: "user-1",
      email: "surf@example.com",
      profile: { display_name: "Ana" },
      mediaItems: [{ id: "m1" }],
      analyses: [{ id: "a1" }],
      boards: [{ id: "b1" }],
      productFeedback: [],
      usageLedger: [{ credits_delta: -1 }],
    });
  });

  it("normaliza listas nulas para arrays vazios", () => {
    const payload = buildAccountExportPayload({
      userId: "user-2",
      email: null,
      profile: null,
      mediaItems: null,
      analyses: null,
      boards: null,
      productFeedback: null,
      usageLedger: null,
    });

    expect(payload.mediaItems).toEqual([]);
    expect(payload.analyses).toEqual([]);
    expect(payload.boards).toEqual([]);
    expect(payload.productFeedback).toEqual([]);
    expect(payload.usageLedger).toEqual([]);
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
