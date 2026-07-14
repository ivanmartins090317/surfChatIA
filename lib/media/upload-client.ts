import { createClient } from "@/lib/supabase/client";

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
  const { error } = await supabase.storage.from("media").upload(storagePath, file, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error("Falha no upload. Verifique sua conexão e tente novamente.");
  }
}
