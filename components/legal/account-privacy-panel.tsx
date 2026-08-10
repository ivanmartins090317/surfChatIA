"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMyAccountAction,
  exportMyDataAction,
} from "@/actions/account-privacy-actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/services/account-privacy-shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountPrivacyPanel() {
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleExport() {
    startExport(async () => {
      const result = await exportMyDataAction();
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erro ao exportar dados.");
        return;
      }

      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `surf-ai-coach-dados-${result.data.exportedAt.slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Pacote de dados baixado.");
    });
  }

  function handleDelete(formData: FormData) {
    setDeleteError(null);
    startDelete(async () => {
      try {
        const result = await deleteMyAccountAction(formData);
        if (result && !result.success) {
          setDeleteError(result.error ?? "Erro ao excluir conta.");
        }
      } catch {
        // redirect() da Server Action encerra a navegação com sucesso
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Privacidade</h2>
        <p className="text-sm text-muted-foreground">
          Exporte seus dados ou exclua permanentemente sua conta (LGPD).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="sm:flex-1"
          disabled={isExporting}
          onClick={handleExport}
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          Exportar meus dados
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="sm:flex-1"
          onClick={() => {
            setDeleteError(null);
            setConfirmation("");
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-4" aria-hidden />
          Excluir conta
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta permanentemente?</DialogTitle>
            <DialogDescription>
              Isso remove seu acesso, mídias, análises, pranchas e histórico de
              créditos. A ação é irreversível. Digite{" "}
              <strong>{DELETE_ACCOUNT_CONFIRMATION}</strong> para confirmar.
            </DialogDescription>
          </DialogHeader>

          <form action={handleDelete} className="space-y-4">
            {deleteError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmação</Label>
              <Input
                id="confirmation"
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                placeholder={DELETE_ACCOUNT_CONFIRMATION}
                className="h-12"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setDeleteOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  isDeleting ||
                  confirmation.trim().toUpperCase() !==
                    DELETE_ACCOUNT_CONFIRMATION
                }
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Excluindo…
                  </>
                ) : (
                  "Excluir definitivamente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
