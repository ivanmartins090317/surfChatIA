"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { retryAnalysisAction } from "@/actions/analysis-actions";
import { generateBoardSpecAction } from "@/actions/board-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isNoCreditsMessage } from "@/lib/domain/credits";

interface ReanalysisConfirmButtonProps {
  mode: "performance" | "board_spec";
  targetId: string;
  label?: string;
}

export function ReanalysisConfirmButton({
  mode,
  targetId,
  label = "Reanalisar",
}: ReanalysisConfirmButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result =
        mode === "performance"
          ? await retryAnalysisAction(targetId, { confirmed: true })
          : await generateBoardSpecAction(targetId, {
              confirmedReanalysis: true,
            });

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível reanalisar.");
        if (isNoCreditsMessage(result.error)) {
          router.push("/planos");
        }
        setOpen(false);
        return;
      }

      toast.success("Reanálise iniciada com sucesso.");
      setOpen(false);
      if (mode === "performance" && result.data) {
        router.push(`/analyses/${result.data.id}`);
        router.refresh();
        return;
      }
      router.push(`/boards/${targetId}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reanálise</DialogTitle>
            <DialogDescription>
              As tentativas automáticas já foram usadas (ou esta é uma
              reanálise voluntária). Se a análise for bem-sucedida, será
              consumido 1 crédito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Processando…
                </>
              ) : (
                "Confirmar e reanalisar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
