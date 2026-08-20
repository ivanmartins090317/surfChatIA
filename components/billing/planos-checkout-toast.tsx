"use client";

import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

export function PlanosCheckoutToast() {
  const [checkoutState, setCheckoutState] = useQueryState("checkout");

  useEffect(() => {
    if (checkoutState === "success") {
      toast.success(
        "Pagamento recebido! Seus créditos ou plano serão atualizados em instantes.",
      );
      void setCheckoutState(null);
    }

    if (checkoutState === "cancelled") {
      toast.message("Checkout cancelado — nenhuma cobrança foi feita.");
      void setCheckoutState(null);
    }
  }, [checkoutState, setCheckoutState]);

  return null;
}
