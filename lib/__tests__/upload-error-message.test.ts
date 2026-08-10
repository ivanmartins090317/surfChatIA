import { describe, expect, it } from "vitest";
import { toUploadErrorMessage } from "@/lib/media/upload-error-message";

describe("toUploadErrorMessage", () => {
  it("traduz bucket ausente", () => {
    expect(
      toUploadErrorMessage({
        statusCode: "404",
        error: "Bucket not found",
        message: "Bucket not found",
      }),
    ).toMatch(/Armazenamento de mídia indisponível/);
  });

  it("traduz arquivo grande demais", () => {
    expect(
      toUploadErrorMessage({
        statusCode: "413",
        message: "The object exceeded the maximum allowed size",
      }),
    ).toMatch(/acima de 50 MB/);
  });

  it("traduz falha de autorização/RLS", () => {
    expect(
      toUploadErrorMessage({
        statusCode: "403",
        message: "new row violates row-level security policy",
      }),
    ).toMatch(/login novamente/);
  });

  it("mantém mensagem genérica para erros desconhecidos", () => {
    expect(toUploadErrorMessage({ message: "network boom" })).toMatch(
      /Verifique sua conexão/,
    );
  });
});
