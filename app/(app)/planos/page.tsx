import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { PlanosCheckoutToast } from "@/components/billing/planos-checkout-toast";
import {
  getOfferCheckoutDisabledHint,
  isOfferCheckoutReady,
  listBillingOffers,
} from "@/lib/billing/billing-catalog";
import {
  isMercadoPagoConfigured,
  isMercadoPagoTestMode,
} from "@/lib/billing/mercadopago-config";
import { BILLING_OFFER_KINDS } from "@/lib/domain/billing";
import { toCreditsSnapshot } from "@/lib/domain/credits";
import { requireAuthUser } from "@/lib/supabase/server";
import { getBillingSummary } from "@/services/billing-service";
import { getCreditsSnapshot } from "@/services/usage-service";
import { USER_PLANS } from "@/lib/domain/types";

export const metadata = { title: "Planos" };

const EMPTY_CREDITS = toCreditsSnapshot({
  plan: "free",
  freeQuotaGranted: false,
  creditsPeriodUsed: 0,
  creditsBalance: 0,
});

export default async function PlanosPage() {
  const user = await requireAuthUser();
  const [credits, billing] = await Promise.all([
    getCreditsSnapshot(user.id).catch(() => EMPTY_CREDITS),
    getBillingSummary(user.id),
  ]);

  const offers = listBillingOffers();
  const subscriptions = offers.filter(
    (offer) => offer.kind === BILLING_OFFER_KINDS.subscription,
  );
  const packs = offers.filter((offer) => offer.kind === BILLING_OFFER_KINDS.pack);
  const paymentsEnabled = isMercadoPagoConfigured();

  return (
    <div className="space-y-10">
      <Suspense fallback={null}>
        <PlanosCheckoutToast />
      </Suspense>

      <div className="space-y-3">
        <Badge variant="primary">Planos e créditos</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Escolha como quer evoluir
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Plano atual:{" "}
          <span className="font-medium text-foreground">
            {USER_PLANS[credits.plan]}
          </span>
          {" · "}
          {credits.remaining}{" "}
          {credits.remaining === 1 ? "crédito restante" : "créditos restantes"}
        </p>
        {paymentsEnabled && isMercadoPagoTestMode() ? (
          <p className="text-sm text-muted-foreground">
            Sandbox Mercado Pago — use o comprador e os cartões de teste do
            painel. Assinaturas cobram no cartão; packs podem usar PIX, cartão
            ou boleto.
          </p>
        ) : null}
        {!paymentsEnabled ? (
          <p className="text-sm text-amber-200/90">
            Checkout em preparação — adicione{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              MP_ACCESS_TOKEN
            </code>{" "}
            no servidor para habilitar pagamentos.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Grátis</CardTitle>
            <p className="text-3xl font-bold tabular-nums">R$ 0</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground">2 créditos (total para novos cadastros)</p>
            <p>Para conhecer o produto</p>
            {credits.plan === "free" ? (
              <Badge variant="default">Seu plano atual</Badge>
            ) : null}
          </CardContent>
        </Card>

        {subscriptions.map((offer, index) => {
          const isCurrentPlan = credits.plan === offer.plan;
          const hasActiveSub =
            billing.subscription?.plan === offer.plan &&
            billing.hasActivePaidAccess;

          return (
            <Card
              key={offer.key}
              className={
                index === 0 ? "border-primary/40 bg-primary/5" : undefined
              }
            >
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {offer.label}
                </CardTitle>
                <p className="text-3xl font-bold tabular-nums">
                  {offer.priceLabel}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p className="text-foreground">
                  {offer.credits} créditos/mês
                </p>
                {isCurrentPlan || hasActiveSub ? (
                  <Badge variant="default">Seu plano atual</Badge>
                ) : (
                  <CheckoutButton
                    offerKey={offer.key}
                    label={`Assinar ${offer.label}`}
                    disabled={!paymentsEnabled || !isOfferCheckoutReady()}
                    disabledHint={getOfferCheckoutDisabledHint()}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium">Pacotes avulsos</h2>
        <p className="text-sm text-muted-foreground">
          Não alteram seu plano — somam créditos ao saldo avulsos. Na página do
          Mercado Pago você pode pagar com PIX, cartão ou boleto.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {packs.map((pack) => (
            <Card key={pack.key}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{pack.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {pack.credits} créditos · {pack.priceLabel}
                  </p>
                </div>
                <CheckoutButton
                  offerKey={pack.key}
                  label="Comprar"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={!paymentsEnabled || !isOfferCheckoutReady()}
                  disabledHint={getOfferCheckoutDisabledHint()}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/billing">Ver cobrança</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  );
}
