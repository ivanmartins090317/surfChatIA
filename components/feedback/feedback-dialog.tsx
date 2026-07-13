"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { submitFeedbackAction } from "@/actions/feedback-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 2000;

interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  triggerClassName?: string;
  showLabel?: boolean;
}

export function FeedbackDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerClassName,
  showLabel = true,
}: FeedbackDialogProps) {
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = controlledOpen ?? internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    if (onOpenChange) onOpenChange(nextOpen);
    else setInternalOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function resetForm() {
    setRating(0);
    setComment("");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment.trim());
    formData.set("page_path", pathname);

    startTransition(async () => {
      const result = await submitFeedbackAction(formData);
      if (!result.success) {
        setError(result.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      toast.success("Avaliação enviada. Obrigado pelo feedback!");
      handleOpenChange(false);
      resetForm();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("rounded-full", triggerClassName)}
          >
            <MessageSquarePlus className="size-4" aria-hidden />
            {showLabel ? "Avaliar & sugerir" : null}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sua avaliação</DialogTitle>
          <DialogDescription>
            Como está a plataforma? O que você gostaria de ver por aqui?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Nota geral
            </Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota geral">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                const isActive = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                    className="rounded-md p-1 transition-colors hover:bg-muted focus-visible:glow-focus"
                    onClick={() => setRating(value)}
                  >
                    <Star
                      className={cn(
                        "size-7",
                        isActive
                          ? "fill-primary text-primary"
                          : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="feedback-comment"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Ideias, sugestões ou melhorias
            </Label>
            <Textarea
              id="feedback-comment"
              name="comment"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))
              }
              placeholder="Qual função você gostaria de ver? O que pode melhorar?"
              rows={5}
              className="resize-none"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
