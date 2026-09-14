import { Badge } from "@/components/ui/badge";
import { getWavePhaseIdentificationLabel } from "@/lib/domain/analysis-display";
import type { WavePhase, WavePhaseQuality } from "@/lib/domain/types";
import { WAVE_PHASE_QUALITY } from "@/lib/domain/types";

const QUALITY_BADGE_VARIANT: Record<
  WavePhaseQuality,
  "success" | "warning" | "destructive"
> = {
  boa: "success",
  regular: "warning",
  falhou: "destructive",
};

interface WavePhaseCardProps {
  phase: WavePhase;
  photoUrl: string | null;
}

export function WavePhaseCard({ phase, photoUrl }: WavePhaseCardProps) {
  return (
    <article className="space-y-4 rounded-2xl border border-white/08 bg-card/80 p-4">
      {photoUrl ? (
        <div className="overflow-hidden rounded-xl border border-white/08 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`Foto da fase ${phase.nome} em ${phase.timestamp}`}
            className="aspect-video min-h-11 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium leading-snug">{phase.nome}</h3>
        <Badge variant={QUALITY_BADGE_VARIANT[phase.qualidade_execucao]}>
          {WAVE_PHASE_QUALITY[phase.qualidade_execucao]}
        </Badge>
        <Badge variant="info">{getWavePhaseIdentificationLabel(phase)}</Badge>
        <span className="text-sm tabular-nums text-muted-foreground">
          {phase.timestamp}
        </span>
      </div>

      <div className="space-y-2 text-sm leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">O que vi: </span>
          <span className="text-muted-foreground">{phase.o_que_vi}</span>
        </p>
        <p>
          <span className="font-semibold text-foreground">Como melhorar: </span>
          <span className="text-muted-foreground">{phase.como_melhorar}</span>
        </p>
      </div>
    </article>
  );
}
