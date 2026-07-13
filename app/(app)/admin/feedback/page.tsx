import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/require-admin";
import { formatDatePtBr } from "@/lib/utils";
import { listProductFeedbackForAdmin } from "@/services/feedback-service";

export const metadata = { title: "Avaliações — Admin" };

export default async function AdminFeedbackPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/admin/feedback");

  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) redirect("/dashboard");

  const feedback = await listProductFeedbackForAdmin().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Avaliações da plataforma</h1>
        <p className="text-muted-foreground">
          Feedback enviado pelos usuários. Acesso restrito a administradores.
        </p>
      </div>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="p-4 py-12 text-center text-muted-foreground md:p-6 md:py-12">
            Nenhuma avaliação recebida ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {feedback.map((item) => (
            <li key={item.id}>
              <Card>
                <CardContent className="space-y-3 p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.display_name ?? "Usuário sem nome"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDatePtBr(item.created_at)}
                        {item.page_path ? ` · ${item.page_path}` : ""}
                      </p>
                    </div>
                    <Badge variant="primary" className="gap-1 tabular-nums">
                      <Star className="size-3 fill-current" aria-hidden />
                      {item.rating}/5
                    </Badge>
                  </div>
                  {item.comment ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.comment}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Sem comentário.
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
