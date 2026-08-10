import { createClient } from "@/lib/supabase/client";
import { toUploadErrorMessage } from "@/lib/media/upload-error-message";

interface UploadMediaFileInput {
  storagePath: string;
  file: File;
  mimeType: string;
}

export async function uploadMediaFileToStorage({
  storagePath,
  file,
  mimeType,
}: UploadMediaFileInput): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error(
      "Sessão expirada ou sem permissão para enviar o arquivo. Faça login novamente.",
    );
  }

  const { error } = await supabase.storage.from("media").upload(storagePath, file, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(toUploadErrorMessage(error));
  }
}
