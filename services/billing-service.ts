import {
  ABACATEPAY_WEBHOOK_EVENTS,
  type BillingOfferKey,
  type BillingSummary,
  type CheckoutSessionResult,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from "@/lib/domain/billing";
import type { UserPlan } from "@/lib/domain/types";
import {
  cancelAbacatePaySubscription,
  createAbacatePayCheckout,
  isAbacatePayConfigured,
} from "@/lib/billing/abacatepay-client";
import type { AbacatePayWebhookPayload } from "@/lib/billing/abacatepay-webhook";
import {
  isSupportedBillingEvent,
  parseWebhookContext,
} from "@/lib/billing/abacatepay-webhook-parser";
import {
  getBillingOffer,
  resolveOfferByProductId,
  validatePaidAmount,
} from "@/lib/billing/billing-catalog";
import { buildBillingExternalRef } from "@/lib/domain/billing";
import { reportServerError } from "@/lib/observability/report-server-error";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

interface BillingRpcRow {
  duplicate?: boolean;
  success?: boolean;
}

interface BillingSupabaseRpc {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ data: BillingRpcRow | null; error: { message: string } | null }>;
}

interface MemorySubscription extends SubscriptionRecord {
  user_id: string;
}

interface MemoryProfileBilling {
  plan: UserPlan;
  creditsBalance: number;
  creditsPeriodUsed: number;
  billingPeriodStart: string | null;
}

const processedEvents = new Set<string>();
const memorySubscriptions = new Map<string, MemorySubscription>();
const memoryProfiles = new Map<string, MemoryProfileBilling>();
const memoryLedger: Array<{ userId: string; reason: string; delta: number }> =
  [];

function shouldUseMemoryBackend(): boolean {
  if (process.env.BILLING_BACKEND === "memory") return true;
  if (process.env.NODE_ENV === "test") return true;
  return !hasAdminClient();
}

export function resetBillingMemoryStore(): void {
  processedEvents.clear();
  memorySubscriptions.clear();
  memoryProfiles.clear();
  memoryLedger.length = 0;
}

export function seedBillingMemoryProfile(
  userId: string,
  state: Partial<MemoryProfileBilling>,
): void {
  memoryProfiles.set(userId, {
    plan: state.plan ?? "free",
    creditsBalance: state.creditsBalance ?? 0,
    creditsPeriodUsed: state.creditsPeriodUsed ?? 0,
    billingPeriodStart: state.billingPeriodStart ?? null,
  });
}

export function seedBillingMemorySubscription(
  subscription: MemorySubscription,
): void {
  memorySubscriptions.set(subscription.external_id, subscription);
}

export function getBillingMemoryLedger(userId: string): typeof memoryLedger {
  return memoryLedger.filter((entry) => entry.userId === userId);
}

function getMemoryProfile(userId: string): MemoryProfileBilling {
  return (
    memoryProfiles.get(userId) ?? {
      plan: "free",
      creditsBalance: 0,
      creditsPeriodUsed: 0,
      billingPeriodStart: null,
    }
  );
}

async function invokeBillingRpc(
  fn: string,
  args: Record<string, unknown>,
): Promise<BillingRpcRow> {
  const supabase = createAdminClient() as unknown as BillingSupabaseRpc;
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    reportServerError(error, { area: "rate-limit", operation: fn });
    throw new Error("Falha ao processar cobrança. Tente novamente.");
  }

  return data ?? {};
}

function resolveOfferFromContext(input: {
  offerKey: BillingOfferKey | null;
  productId: string | null;
}) {
  if (input.offerKey) {
    return { offerKey: input.offerKey, offer: getBillingOffer(input.offerKey) };
  }
  if (input.productId) {
    return resolveOfferByProductId(input.productId);
  }
  return null;
}

function logBillingOperationalFailure(
  reason: string,
  details: Record<string, unknown>,
): void {
  console.error("[billing.operational]", { reason, ...details });
}

async function markCheckoutSessionCompleted(input: {
  externalRef: string;
  gatewayCheckoutId?: string | null;
  gatewaySubscriptionId?: string | null;
}): Promise<void> {
  if (shouldUseMemoryBackend() || !input.externalRef) return;

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<unknown>;
      };
    };
  };

  await supabase
    .from("billing_checkout_sessions")
    .update({
      status: "completed",
      gateway_checkout_id: input.gatewayCheckoutId ?? null,
      gateway_subscription_id: input.gatewaySubscriptionId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("external_ref", input.externalRef);
}

async function applyPackPurchaseMemory(input: {
  userId: string;
  credits: number;
  eventId: string;
}): Promise<BillingRpcRow> {
  if (processedEvents.has(input.eventId)) {
    return { duplicate: true };
  }
  processedEvents.add(input.eventId);

  const profile = getMemoryProfile(input.userId);
  profile.creditsBalance += input.credits;
  memoryProfiles.set(input.userId, profile);
  memoryLedger.push({
    userId: input.userId,
    reason: "pack_purchase",
    delta: input.credits,
  });

  return { duplicate: false, success: true };
}

async function applySubscriptionActivationMemory(input: {
  userId: string;
  plan: "surfista" | "pro";
  externalId: string;
  periodStart: string;
  periodEnd: string;
  eventId: string;
}): Promise<BillingRpcRow> {
  if (processedEvents.has(input.eventId)) {
    return { duplicate: true };
  }
  processedEvents.add(input.eventId);

  for (const [key, sub] of memorySubscriptions.entries()) {
    if (
      sub.user_id === input.userId &&
      sub.status !== "cancelled" &&
      key !== input.externalId
    ) {
      sub.status = "cancelled";
      sub.cancelled_at = new Date().toISOString();
      memorySubscriptions.set(key, sub);
    }
  }

  memorySubscriptions.set(input.externalId, {
    id: input.externalId,
    user_id: input.userId,
    provider: "abacatepay",
    external_id: input.externalId,
    status: "active",
    plan: input.plan,
    current_period_start: input.periodStart,
    current_period_end: input.periodEnd,
    cancelled_at: null,
    created_at: input.periodStart,
    updated_at: input.periodStart,
  });

  const profile = getMemoryProfile(input.userId);
  profile.plan = input.plan;
  profile.creditsPeriodUsed = 0;
  profile.billingPeriodStart = input.periodStart;
  memoryProfiles.set(input.userId, profile);
  memoryLedger.push({
    userId: input.userId,
    reason: "subscription_activated",
    delta: 0,
  });

  return { duplicate: false, success: true };
}

async function applySubscriptionRenewalMemory(input: {
  userId: string;
  externalId: string;
  periodStart: string;
  periodEnd: string;
  eventId: string;
}): Promise<BillingRpcRow> {
  if (processedEvents.has(input.eventId)) {
    return { duplicate: true };
  }
  processedEvents.add(input.eventId);

  const sub = memorySubscriptions.get(input.externalId);
  if (sub) {
    sub.status = "active";
    sub.current_period_start = input.periodStart;
    sub.current_period_end = input.periodEnd;
    sub.cancelled_at = null;
    memorySubscriptions.set(input.externalId, sub);
  }

  const profile = getMemoryProfile(input.userId);
  profile.creditsPeriodUsed = 0;
  profile.billingPeriodStart = input.periodStart;
  memoryProfiles.set(input.userId, profile);
  memoryLedger.push({
    userId: input.userId,
    reason: "subscription_renewed",
    delta: 0,
  });

  return { duplicate: false, success: true };
}

async function applySubscriptionCancellationMemory(input: {
  userId: string;
  externalId: string;
  cancelledAt: string;
  eventId: string;
}): Promise<BillingRpcRow> {
  if (processedEvents.has(input.eventId)) {
    return { duplicate: true };
  }
  processedEvents.add(input.eventId);

  const sub = memorySubscriptions.get(input.externalId);
  if (sub) {
    sub.status = "cancelled";
    sub.cancelled_at = input.cancelledAt;
    memorySubscriptions.set(input.externalId, sub);
  }

  return { duplicate: false, success: true };
}

function maybeDowngradeMemory(userId: string): void {
  const sub = [...memorySubscriptions.values()]
    .filter((item) => item.user_id === userId && item.status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.current_period_end).getTime() -
        new Date(a.current_period_end).getTime(),
    )[0];

  if (!sub) return;
  if (new Date(sub.current_period_end).getTime() > Date.now()) return;

  const profile = getMemoryProfile(userId);
  if (profile.plan === "surfista" || profile.plan === "pro") {
    profile.plan = "free";
    profile.creditsPeriodUsed = 0;
    profile.billingPeriodStart = new Date().toISOString();
    memoryProfiles.set(userId, profile);
  }
}

async function resolveCheckoutSession(input: {
  checkoutExternalId: string | null;
  checkoutGatewayId: string | null;
}): Promise<{ userId: string; offerKey: BillingOfferKey } | null> {
  if (shouldUseMemoryBackend()) return null;
  if (!input.checkoutExternalId && !input.checkoutGatewayId) return null;

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { user_id: string; offer_key: BillingOfferKey } | null;
          }>;
        };
      };
    };
  };

  if (input.checkoutGatewayId) {
    const { data } = await supabase
      .from("billing_checkout_sessions")
      .select("user_id, offer_key")
      .eq("gateway_checkout_id", input.checkoutGatewayId)
      .maybeSingle();
    if (data?.user_id && data.offer_key) {
      return { userId: String(data.user_id), offerKey: data.offer_key };
    }
  }

  if (input.checkoutExternalId) {
    const { data } = await supabase
      .from("billing_checkout_sessions")
      .select("user_id, offer_key")
      .eq("external_ref", input.checkoutExternalId)
      .maybeSingle();
    if (data?.user_id && data.offer_key) {
      return { userId: String(data.user_id), offerKey: data.offer_key };
    }
  }

  return null;
}

async function resolveUserIdForWebhook(context: {
  userId: string | null;
  subscriptionExternalId: string | null;
  checkoutExternalId: string | null;
}): Promise<string | null> {
  if (context.userId) return context.userId;

  if (context.subscriptionExternalId) {
    if (shouldUseMemoryBackend()) {
      const sub = memorySubscriptions.get(context.subscriptionExternalId);
      if (sub?.user_id) return sub.user_id;
    } else {
      const supabase = createAdminClient() as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{
                data: { user_id: string } | null;
              }>;
            };
          };
        };
      };
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("external_id", context.subscriptionExternalId)
        .maybeSingle();
      if (data?.user_id) return String(data.user_id);
    }
  }

  if (context.checkoutExternalId && !shouldUseMemoryBackend()) {
    const supabase = createAdminClient() as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{
              data: { user_id: string } | null;
            }>;
          };
        };
      };
    };
    const { data } = await supabase
      .from("billing_checkout_sessions")
      .select("user_id")
      .eq("external_ref", context.checkoutExternalId)
      .maybeSingle();
    if (data?.user_id) return String(data.user_id);
  }

  return null;
}

export async function processAbacatePayWebhook(
  payload: AbacatePayWebhookPayload,
): Promise<void> {
  if (!isSupportedBillingEvent(payload.event)) {
    console.info("[abacatepay.webhook] evento ignorado", {
      eventId: payload.id,
      event: payload.event,
    });
    return;
  }

  if (payload.event === ABACATEPAY_WEBHOOK_EVENTS.checkoutRefunded) {
    console.info("[abacatepay.webhook] reembolso registrado (sem estorno automático)", {
      eventId: payload.id,
    });
    return;
  }

  const context = parseWebhookContext(payload);
  const checkoutSession = await resolveCheckoutSession({
    checkoutExternalId: context.checkoutExternalId,
    checkoutGatewayId: context.checkoutGatewayId,
  });

  const userId = await resolveUserIdForWebhook({
    userId: context.userId ?? checkoutSession?.userId ?? null,
    subscriptionExternalId: context.subscriptionExternalId,
    checkoutExternalId: context.checkoutExternalId,
  });

  const resolvedOffer = resolveOfferFromContext({
    offerKey: context.offerKey ?? checkoutSession?.offerKey ?? null,
    productId: context.productId,
  });

  if (!userId) {
    logBillingOperationalFailure("webhook_sem_usuario", {
      eventId: payload.id,
      event: payload.event,
    });
    return;
  }

  if (payload.event === ABACATEPAY_WEBHOOK_EVENTS.checkoutCompleted) {
    if (!resolvedOffer || resolvedOffer.offer.kind !== "pack") {
      logBillingOperationalFailure("checkout_oferta_invalida", {
        eventId: payload.id,
        productId: context.productId,
      });
      return;
    }

    if (!validatePaidAmount(resolvedOffer.offer, context.amountCents)) {
      logBillingOperationalFailure("checkout_valor_inconsistente", {
        eventId: payload.id,
        amountCents: context.amountCents,
        expected: resolvedOffer.offer.priceCents,
      });
      return;
    }

    const result = shouldUseMemoryBackend()
      ? await applyPackPurchaseMemory({
          userId,
          credits: resolvedOffer.offer.credits,
          eventId: payload.id,
        })
      : await invokeBillingRpc("apply_pack_purchase", {
          p_user_id: userId,
          p_credits: resolvedOffer.offer.credits,
          p_event_id: payload.id,
        });

    if (!result.duplicate && context.checkoutExternalId) {
      await markCheckoutSessionCompleted({
        externalRef: context.checkoutExternalId,
        gatewayCheckoutId: context.checkoutExternalId,
      });
    }
    return;
  }

  if (
    payload.event === ABACATEPAY_WEBHOOK_EVENTS.subscriptionCompleted ||
    payload.event === ABACATEPAY_WEBHOOK_EVENTS.subscriptionRenewed
  ) {
    if (!resolvedOffer || resolvedOffer.offer.kind !== "subscription") {
      logBillingOperationalFailure("assinatura_oferta_invalida", {
        eventId: payload.id,
        productId: context.productId,
      });
      return;
    }

    if (!validatePaidAmount(resolvedOffer.offer, context.amountCents)) {
      logBillingOperationalFailure("assinatura_valor_inconsistente", {
        eventId: payload.id,
        amountCents: context.amountCents,
        expected: resolvedOffer.offer.priceCents,
      });
      return;
    }

    if (!context.subscriptionExternalId || !context.periodStart || !context.periodEnd) {
      logBillingOperationalFailure("assinatura_dados_incompletos", {
        eventId: payload.id,
      });
      return;
    }

    const plan = resolvedOffer.offer.plan;
    if (!plan || (plan !== "surfista" && plan !== "pro")) {
      return;
    }

    const rpcArgs = {
      p_user_id: userId,
      p_external_id: context.subscriptionExternalId,
      p_period_start: context.periodStart,
      p_period_end: context.periodEnd,
      p_event_id: payload.id,
    };

    if (payload.event === ABACATEPAY_WEBHOOK_EVENTS.subscriptionCompleted) {
      const result = shouldUseMemoryBackend()
        ? await applySubscriptionActivationMemory({
            userId,
            plan,
            externalId: context.subscriptionExternalId,
            periodStart: context.periodStart,
            periodEnd: context.periodEnd,
            eventId: payload.id,
          })
        : await invokeBillingRpc("apply_subscription_activation", {
            ...rpcArgs,
            p_user_id: userId,
            p_plan: plan,
          });

      if (!result.duplicate) {
        await markCheckoutSessionCompleted({
          externalRef: context.checkoutExternalId ?? "",
          gatewaySubscriptionId: context.subscriptionExternalId,
        });
      }
      return;
    }

    await (shouldUseMemoryBackend()
      ? applySubscriptionRenewalMemory({
          userId,
          externalId: context.subscriptionExternalId,
          periodStart: context.periodStart,
          periodEnd: context.periodEnd,
          eventId: payload.id,
        })
      : invokeBillingRpc("apply_subscription_renewal", rpcArgs));
    return;
  }

  if (payload.event === ABACATEPAY_WEBHOOK_EVENTS.subscriptionCancelled) {
    if (!context.subscriptionExternalId) {
      logBillingOperationalFailure("cancelamento_sem_assinatura", {
        eventId: payload.id,
      });
      return;
    }

    await (shouldUseMemoryBackend()
      ? applySubscriptionCancellationMemory({
          userId,
          externalId: context.subscriptionExternalId,
          cancelledAt: context.cancelledAt ?? new Date().toISOString(),
          eventId: payload.id,
        })
      : invokeBillingRpc("apply_subscription_cancellation", {
          p_user_id: userId,
          p_external_id: context.subscriptionExternalId,
          p_cancelled_at: context.cancelledAt ?? new Date().toISOString(),
          p_event_id: payload.id,
        }));
  }
}

export async function createCheckoutSession(
  userId: string,
  offerKey: BillingOfferKey,
): Promise<CheckoutSessionResult> {
  const offer = getBillingOffer(offerKey);

  if (offer.kind === "subscription") {
    const summary = await getBillingSummary(userId);
    if (summary.subscription?.status === "active") {
      throw new Error(
        "Você já tem uma assinatura ativa. Gerencie em Cobrança ou faça upgrade pelo suporte.",
      );
    }
    if (
      summary.subscription?.status === "cancelled" &&
      summary.hasActivePaidAccess
    ) {
      throw new Error(
        "Sua assinatura ainda está vigente até o fim do período. Aguarde o término para assinar novamente.",
      );
    }
  }

  if (!isAbacatePayConfigured()) {
    throw new Error(
      "Pagamentos indisponíveis no momento. Tente novamente mais tarde ou contate o suporte.",
    );
  }

  const externalRef = buildBillingExternalRef(userId, offerKey);
  const checkout = await createAbacatePayCheckout({
    offerKey,
    userId,
    externalRef,
  });

  if (!shouldUseMemoryBackend()) {
    const supabase = createAdminClient() as unknown as {
      from: (table: string) => {
        upsert: (
          row: Record<string, unknown>,
          opts: { onConflict: string },
        ) => Promise<unknown>;
      };
    };
    await supabase.from("billing_checkout_sessions").upsert(
      {
        user_id: userId,
        offer_key: offerKey,
        external_ref: externalRef,
        gateway_checkout_id: checkout.id,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "external_ref" },
    );
  }

  return { checkoutUrl: checkout.url, sessionId: checkout.id };
}

export async function cancelUserSubscription(userId: string): Promise<void> {
  const summary = await getBillingSummary(userId);
  const subscription = summary.subscription;

  if (!subscription || subscription.status !== "active") {
    throw new Error("Não há assinatura ativa para cancelar.");
  }

  if (!isAbacatePayConfigured()) {
    throw new Error(
      "Cancelamento indisponível no momento. Tente novamente ou contate o suporte.",
    );
  }

  await cancelAbacatePaySubscription(subscription.external_id);
}

function normalizeSubscription(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    provider: "abacatepay",
    external_id: String(row.external_id),
    status: row.status as SubscriptionStatus,
    plan: row.plan as "surfista" | "pro",
    current_period_start: String(row.current_period_start),
    current_period_end: String(row.current_period_end),
    cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  if (shouldUseMemoryBackend()) {
    maybeDowngradeMemory(userId);
    const profile = getMemoryProfile(userId);
    const subscription =
      [...memorySubscriptions.values()]
        .filter((item) => item.user_id === userId)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0] ?? null;

    const hasActivePaidAccess =
      subscription?.status === "active" ||
      (subscription?.status === "cancelled" &&
        new Date(subscription.current_period_end).getTime() > Date.now());

    return {
      plan: profile.plan,
      subscription,
      hasActivePaidAccess,
      nextRenewalAt:
        subscription?.status === "active"
          ? subscription.current_period_end
          : null,
      canCancelSubscription: subscription?.status === "active",
    };
  }

  await invokeBillingRpc("maybe_downgrade_expired_subscription", {
    p_user_id: userId,
  });

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { plan: string } | null }>;
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => {
            limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null }>;
          };
        };
      };
    };
  };

  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const subscriptionRow = subscriptions?.[0] ?? null;
  const subscription = subscriptionRow
    ? normalizeSubscription(subscriptionRow as Record<string, unknown>)
    : null;

  const hasActivePaidAccess =
    subscription?.status === "active" ||
    (subscription?.status === "cancelled" &&
      new Date(subscription.current_period_end).getTime() > Date.now());

  return {
    plan: (profile?.plan as UserPlan) ?? "free",
    subscription,
    hasActivePaidAccess,
    nextRenewalAt:
      subscription?.status === "active" ? subscription.current_period_end : null,
    canCancelSubscription: subscription?.status === "active",
  };
}

export async function handleAbacatePayWebhookEvent(
  payload: AbacatePayWebhookPayload,
): Promise<void> {
  console.info("[abacatepay.webhook] evento recebido", {
    eventId: payload.id,
    event: payload.event,
    devMode: payload.devMode ?? null,
  });

  await processAbacatePayWebhook(payload);
}
