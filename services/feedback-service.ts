import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/admin/require-admin";
import type { ProductFeedbackListItem } from "@/lib/domain/types";

const submitFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Selecione uma nota.").max(5),
  comment: z
    .string()
    .trim()
    .max(2000, "Comentário deve ter no máximo 2000 caracteres.")
    .optional()
    .transform((value) => value || null),
  page_path: z.string().max(500).optional().nullable(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

interface FeedbackRow {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  page_path: string | null;
  created_at: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
}

function getProfileDisplayName(
  profiles: FeedbackRow["profiles"],
): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0]?.display_name ?? null;
  return profiles.display_name;
}

export async function submitProductFeedback(
  userId: string,
  input: SubmitFeedbackInput,
) {
  const parsed = submitFeedbackSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_feedback")
    .insert({
      user_id: userId,
      rating: parsed.rating,
      comment: parsed.comment,
      page_path: parsed.page_path ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Não foi possível enviar sua avaliação. Tente novamente.");
  }

  return data;
}

export async function listProductFeedbackForAdmin(): Promise<
  ProductFeedbackListItem[]
> {
  await requireAdminUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_feedback")
    .select(
      `
      id,
      user_id,
      rating,
      comment,
      page_path,
      created_at,
      profiles (
        display_name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar as avaliações.");
  }

  return ((data ?? []) as FeedbackRow[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    rating: row.rating,
    comment: row.comment,
    page_path: row.page_path,
    created_at: row.created_at,
    display_name: getProfileDisplayName(row.profiles),
  }));
}
