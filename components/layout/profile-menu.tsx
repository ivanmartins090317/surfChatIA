"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, MessageSquarePlus, UserRound } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileMenuProps {
  displayName: string;
  email: string;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ displayName, email }: ProfileMenuProps) {
  const initials = getInitials(displayName, email);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:glow-focus"
          aria-label="Abrir menu do perfil"
        >
          <Avatar className="size-10 border border-border">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p className="truncate font-medium">{displayName}</p>
            <p className="truncate text-sm font-normal text-muted-foreground">
              {email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setFeedbackOpen(true);
            }}
          >
            <MessageSquarePlus className="size-4" aria-hidden />
            Avaliar & sugerir
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserRound className="size-4" aria-hidden />
              Editar perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={signOutAction}>
            <DropdownMenuItem asChild variant="destructive">
              <button type="submit" className="w-full">
                <LogOut className="size-4" aria-hidden />
                Sair
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        hideTrigger
      />
    </>
  );
}
