import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { billingProviderLabel } from "@/lib/domain/billing";
import { formatCreditsLabel } from "@/lib/domain/credits";
import { USER_PLANS } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { getBillingSummary } from "@/services/billing-service";
import { getCreditsSnapshot } from "@/services/usage-service";

export const metadata = { title: "Cobrança" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function subscriptionStatusLabel(status: string | undefined): string {
  switch (status) {
    case "active":
      return "Ativa";
    case "cancelled":
      return "Cancelada";
    case "pending":
      return "Pendente";
    case "past_due":
      return "Pagamento pendente";
    default:
      return "Sem assinatura";
  }
}

export default async function BillingPage() {
  const user = await requireAuthUser();
  const [billing, credits] = await Promise.all([
    getBillingSummary(user.id),
    getCreditsSnapshot(user.id),
  ]);

  const subscription = billing.subscription;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Badge variant="primary">Cobrança</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Sua assinatura e créditos
        </h1>
        <p className="text-muted-foreground">
          Status e renovação vêm do gateway — atualizados após confirmação do
          pagamento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plano atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold">{USER_PLANS[credits.plan]}</p>
            <p className="text-sm text-muted-foreground">
              {formatCreditsLabel(credits.remaining)} disponíveis · cota do
              plano: {credits.planQuota}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Status:{" "}
              <span className="font-medium text-foreground">
                {subscriptionStatusLabel(subscription?.status)}
              </span>
            </p>
            {subscription ? (
              <>
                <p className="text-muted-foreground">
                  Plano da assinatura: {USER_PLANS[subscription.plan]}
                </p>
                <p className="text-muted-foreground">
                  Pagamento via {billingProviderLabel(subscription.provider)}
                </p>
                {billing.nextRenewalAt ? (
                  <p className="text-muted-foreground">
                    Próxima renovação: {formatDate(billing.nextRenewalAt)}
                  </p>
                ) : null}
                {subscription.status === "cancelled" &&
                billing.hasActivePaidAccess ? (
                  <p className="text-muted-foreground">
                    Acesso pago até:{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">
                Você ainda não tem assinatura paga.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {billing.canCancelSubscription ? (
          <CancelSubscriptionButton />
        ) : null}
        <Button asChild variant="secondary" className="min-h-[44px]">
          <Link href="/planos">Ver planos e packs</Link>
        </Button>
      </div>
    </div>
  );
}
