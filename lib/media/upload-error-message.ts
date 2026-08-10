import { videoOversizeMessage } from "@/lib/media/upload-limits";

interface StorageUploadErrorLike {
  message?: string;
  statusCode?: string | number;
  error?: string;
  name?: string;
}

export function toUploadErrorMessage(error: StorageUploadErrorLike): string {
  const code = String(error.statusCode ?? error.error ?? error.name ?? "");
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "404" ||
    code === "NoSuchBucket" ||
    message.includes("bucket not found") ||
    message.includes("no such bucket")
  ) {
    return "Armazenamento de mídia indisponível. Contate o suporte ou tente novamente em alguns minutos.";
  }

  if (
    code === "413" ||
    message.includes("maximum allowed size") ||
    message.includes("payload too large") ||
    message.includes("entity too large") ||
    message.includes("exceeded the maximum") ||
    message.includes("object exceeded")
  ) {
    return videoOversizeMessage();
  }

  if (
    code === "403" ||
    message.includes("row-level security") ||
    message.includes("not authorized") ||
    message.includes("jwt")
  ) {
    return "Sessão expirada ou sem permissão para enviar o arquivo. Faça login novamente.";
  }

  if (
    code === "409" ||
    message.includes("already exists") ||
    message.includes("duplicate")
  ) {
    return "Este arquivo já foi enviado. Selecione o arquivo novamente e tente outra vez.";
  }

  return "Falha no upload. Verifique sua conexão e tente novamente.";
}
