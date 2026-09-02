import {
  BILLING_GATEWAY_EVENT_KINDS,
  type BillingGatewayEvent,
} from "@/lib/billing/billing-gateway-event";
import {
  getBillingOffer,
  validatePaidAmount,
} from "@/lib/billing/billing-catalog";
import {
  cancelMercadoPagoSubscription,
  createMercadoPagoCheckout,
  isMercadoPagoConfigured,
} from "@/lib/billing/mercadopago-client";
import {
  BILLING_PROVIDERS,
  buildBillingExternalRef,
  type BillingOffer,
  type BillingOfferKey,
  type BillingSummary,
  type CheckoutSessionResult,
  type SubscriptionRecord,
  type SubscriptionStatus,
} from "@/lib/domain/billing";
import type { UserPlan } from "@/lib/domain/types";
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

interface ResolvedOffer {
  offerKey: BillingOfferKey;
  offer: BillingOffer;
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

function logBillingOperationalFailure(
  reason: string,
  details: Record<string, unknown>,
): void {
  console.error("[billing.operational]", { reason, ...details });
}

function resolveOffer(
  offerKey: BillingOfferKey | null,
): ResolvedOffer | null {
  if (!offerKey) return null;
  return { offerKey, offer: getBillingOffer(offerKey) };
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
    provider: BILLING_PROVIDERS.mercadopago,
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

async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (shouldUseMemoryBackend()) {
    return [...memorySubscriptions.values()].some(
      (sub) => sub.user_id === userId && sub.status === "active",
    );
  }

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>;
          };
        };
      };
    };
  };

  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data?.id);
}

function paidPlanFromOffer(
  offer: BillingOffer | undefined,
): "surfista" | "pro" | null {
  if (offer?.plan === "surfista" || offer?.plan === "pro") return offer.plan;
  return null;
}

async function processPackPaid(input: {
  event: BillingGatewayEvent;
  userId: string;
  resolvedOffer: ResolvedOffer | null;
}): Promise<void> {
  const { event, userId, resolvedOffer } = input;
  if (!resolvedOffer || resolvedOffer.offer.kind !== "pack") {
    logBillingOperationalFailure("checkout_oferta_invalida", {
      eventId: event.eventId,
      offerKey: resolvedOffer?.offerKey ?? null,
    });
    return;
  }

  if (!validatePaidAmount(resolvedOffer.offer, event.amountCents)) {
    logBillingOperationalFailure("checkout_valor_inconsistente", {
      eventId: event.eventId,
      amountCents: event.amountCents,
      expected: resolvedOffer.offer.priceCents,
    });
    return;
  }

  const result = shouldUseMemoryBackend()
    ? await applyPackPurchaseMemory({
        userId,
        credits: resolvedOffer.offer.credits,
        eventId: event.eventId,
      })
    : await invokeBillingRpc("apply_pack_purchase", {
        p_user_id: userId,
        p_credits: resolvedOffer.offer.credits,
        p_event_id: event.eventId,
      });

  if (!result.duplicate && event.checkoutExternalId) {
    await markCheckoutSessionCompleted({
      externalRef: event.checkoutExternalId,
      gatewayCheckoutId: event.checkoutExternalId,
    });
  }
}

async function processSubscriptionActivation(input: {
  event: BillingGatewayEvent;
  userId: string;
  resolvedOffer: ResolvedOffer | null;
}): Promise<void> {
  const { event, userId, resolvedOffer } = input;
  if (!resolvedOffer || resolvedOffer.offer.kind !== "subscription") {
    logBillingOperationalFailure("assinatura_oferta_invalida", {
      eventId: event.eventId,
      offerKey: resolvedOffer?.offerKey ?? null,
    });
    return;
  }

  if (!validatePaidAmount(resolvedOffer.offer, event.amountCents)) {
    logBillingOperationalFailure("assinatura_valor_inconsistente", {
      eventId: event.eventId,
      amountCents: event.amountCents,
      expected: resolvedOffer.offer.priceCents,
    });
    return;
  }

  if (!event.subscriptionExternalId || !event.periodStart || !event.periodEnd) {
    logBillingOperationalFailure("assinatura_dados_incompletos", {
      eventId: event.eventId,
    });
    return;
  }

  const plan = paidPlanFromOffer(resolvedOffer.offer);
  if (!plan) return;

  const result = shouldUseMemoryBackend()
    ? await applySubscriptionActivationMemory({
        userId,
        plan,
        externalId: event.subscriptionExternalId,
        periodStart: event.periodStart,
        periodEnd: event.periodEnd,
        eventId: event.eventId,
      })
    : await invokeBillingRpc("apply_subscription_activation", {
        p_user_id: userId,
        p_plan: plan,
        p_external_id: event.subscriptionExternalId,
        p_period_start: event.periodStart,
        p_period_end: event.periodEnd,
        p_event_id: event.eventId,
      });

  if (!result.duplicate) {
    await markCheckoutSessionCompleted({
      externalRef: event.checkoutExternalId ?? "",
      gatewaySubscriptionId: event.subscriptionExternalId,
    });
  }
}

async function processSubscriptionRenewal(input: {
  event: BillingGatewayEvent;
  userId: string;
}): Promise<void> {
  const { event, userId } = input;
  if (!event.subscriptionExternalId || !event.periodStart || !event.periodEnd) {
    logBillingOperationalFailure("renovacao_dados_incompletos", {
      eventId: event.eventId,
    });
    return;
  }

  await (shouldUseMemoryBackend()
    ? applySubscriptionRenewalMemory({
        userId,
        externalId: event.subscriptionExternalId,
        periodStart: event.periodStart,
        periodEnd: event.periodEnd,
        eventId: event.eventId,
      })
    : invokeBillingRpc("apply_subscription_renewal", {
        p_user_id: userId,
        p_external_id: event.subscriptionExternalId,
        p_period_start: event.periodStart,
        p_period_end: event.periodEnd,
        p_event_id: event.eventId,
      }));
}

async function processSubscriptionCancellation(input: {
  event: BillingGatewayEvent;
  userId: string;
}): Promise<void> {
  const { event, userId } = input;
  if (!event.subscriptionExternalId) {
    logBillingOperationalFailure("cancelamento_sem_assinatura", {
      eventId: event.eventId,
    });
    return;
  }

  await (shouldUseMemoryBackend()
    ? applySubscriptionCancellationMemory({
        userId,
        externalId: event.subscriptionExternalId,
        cancelledAt: event.cancelledAt ?? new Date().toISOString(),
        eventId: event.eventId,
      })
    : invokeBillingRpc("apply_subscription_cancellation", {
        p_user_id: userId,
        p_external_id: event.subscriptionExternalId,
        p_cancelled_at: event.cancelledAt ?? new Date().toISOString(),
        p_event_id: event.eventId,
      }));
}

export async function processBillingGatewayEvent(
  event: BillingGatewayEvent,
): Promise<void> {
  const checkoutSession = await resolveCheckoutSession({
    checkoutExternalId: event.checkoutExternalId,
    checkoutGatewayId: event.checkoutExternalId,
  });

  const userId = await resolveUserIdForWebhook({
    userId: event.userId ?? checkoutSession?.userId ?? null,
    subscriptionExternalId: event.subscriptionExternalId,
    checkoutExternalId: event.checkoutExternalId,
  });

  const resolvedOffer = resolveOffer(
    event.offerKey ?? checkoutSession?.offerKey ?? null,
  );

  if (!userId) {
    logBillingOperationalFailure("webhook_sem_usuario", {
      eventId: event.eventId,
      kind: event.kind,
    });
    return;
  }

  if (event.kind === BILLING_GATEWAY_EVENT_KINDS.packPaid) {
    await processPackPaid({ event, userId, resolvedOffer });
    return;
  }

  if (event.kind === BILLING_GATEWAY_EVENT_KINDS.subscriptionActivated) {
    await processSubscriptionActivation({ event, userId, resolvedOffer });
    return;
  }

  if (event.kind === BILLING_GATEWAY_EVENT_KINDS.subscriptionRenewed) {
    const alreadyActive = await hasActiveSubscription(userId);
    if (!alreadyActive) {
      await processSubscriptionActivation({ event, userId, resolvedOffer });
      return;
    }
    await processSubscriptionRenewal({ event, userId });
    return;
  }

  if (event.kind === BILLING_GATEWAY_EVENT_KINDS.subscriptionCancelled) {
    await processSubscriptionCancellation({ event, userId });
  }
}

export async function handleMercadoPagoWebhookEvent(
  event: BillingGatewayEvent,
): Promise<void> {
  console.info("[mercadopago.webhook] evento recebido", {
    eventId: event.eventId,
    kind: event.kind,
  });

  await processBillingGatewayEvent(event);
}

export async function createCheckoutSession(
  userId: string,
  offerKey: BillingOfferKey,
  payerEmail: string,
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

  if (!isMercadoPagoConfigured()) {
    throw new Error(
      "Pagamentos indisponíveis no momento. Tente novamente mais tarde ou contate o suporte.",
    );
  }

  const email = payerEmail.trim();
  if (!email) {
    throw new Error(
      "E-mail da conta é obrigatório para o checkout. Confirme o e-mail e tente de novo.",
    );
  }

  const externalRef = buildBillingExternalRef(userId, offerKey);
  const checkout = await createMercadoPagoCheckout({
    offerKey,
    userId,
    payerEmail: email,
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

  if (!isMercadoPagoConfigured()) {
    throw new Error(
      "Cancelamento indisponível no momento. Tente novamente ou contate o suporte.",
    );
  }

  await cancelMercadoPagoSubscription(subscription.external_id);
}

function normalizeProvider(value: unknown): SubscriptionRecord["provider"] {
  if (value === BILLING_PROVIDERS.mercadopago) {
    return BILLING_PROVIDERS.mercadopago;
  }
  return BILLING_PROVIDERS.abacatepay;
}

function normalizeSubscription(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    provider: normalizeProvider(row.provider),
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

function createEmptyBillingSummary(plan: UserPlan = "free"): BillingSummary {
  return {
    plan,
    subscription: null,
    hasActivePaidAccess: false,
    nextRenewalAt: null,
    canCancelSubscription: false,
  };
}

async function loadBillingSummaryFromSupabase(
  userId: string,
): Promise<BillingSummary> {
  try {
    await invokeBillingRpc("maybe_downgrade_expired_subscription", {
      p_user_id: userId,
    });
  } catch (error) {
    reportServerError(error, {
      area: "billing",
      operation: "maybe_downgrade_expired_subscription",
    });
  }

  const supabase = createAdminClient();

  const [{ data: profileRow, error: profileError }, subscriptionsResult] =
    await Promise.all([
      supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  const profile = profileRow as { plan: string } | null;

  if (profileError) {
    reportServerError(profileError, {
      area: "billing",
      operation: "load_billing_profile",
    });
  }

  if (subscriptionsResult.error) {
    reportServerError(subscriptionsResult.error, {
      area: "billing",
      operation: "load_subscriptions",
    });
    const planFromProfile = profile?.plan as UserPlan | undefined;
    return createEmptyBillingSummary(planFromProfile ?? "free");
  }

  const subscriptionRow = subscriptionsResult.data?.[0] ?? null;
  const subscription = subscriptionRow
    ? normalizeSubscription(subscriptionRow as Record<string, unknown>)
    : null;

  const hasActivePaidAccess =
    subscription?.status === "active" ||
    (subscription?.status === "cancelled" &&
      new Date(subscription.current_period_end).getTime() > Date.now());

  return {
    plan: (profile?.plan as UserPlan | undefined) ?? "free",
    subscription,
    hasActivePaidAccess,
    nextRenewalAt:
      subscription?.status === "active" ? subscription.current_period_end : null,
    canCancelSubscription: subscription?.status === "active",
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

  try {
    return await loadBillingSummaryFromSupabase(userId);
  } catch (error) {
    reportServerError(error, {
      area: "billing",
      operation: "getBillingSummary",
    });
    return createEmptyBillingSummary();
  }
}
