import Link from "next/link";
import {
  type MatchGateKind,
  getMatchGateCta,
  getMatchGateMessage,
} from "@/components/board-spec/match-magic-gate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MatchMagicGatePanelProps {
  kind: MatchGateKind;
  /** Quando false, esconde CTA (ex.: detalhe com botão desabilitado local). */
  showCta?: boolean;
}

export function MatchMagicGatePanel({
  kind,
  showCta = true,
}: MatchMagicGatePanelProps) {
  const cta = getMatchGateCta(kind);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-4 py-10 text-center md:p-6 md:py-12">
        <Alert variant="warning" className="w-full text-left">
          <AlertDescription>{getMatchGateMessage(kind)}</AlertDescription>
        </Alert>
        {showCta ? (
          <Button asChild className="min-h-[44px]">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
