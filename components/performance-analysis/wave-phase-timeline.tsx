import { WavePhaseCard } from "@/components/performance-analysis/wave-phase-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWavePhaseKey } from "@/lib/domain/analysis-display";
import type { WavePhase } from "@/lib/domain/types";

interface WavePhaseTimelineProps {
  fases: WavePhase[];
  framePreviewUrls: string[];
}

export function WavePhaseTimeline({
  fases,
  framePreviewUrls,
}: WavePhaseTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline da onda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fases.map((fase) => (
          <WavePhaseCard
            key={getWavePhaseKey(fase)}
            phase={fase}
            photoUrl={framePreviewUrls[fase.frame_index] ?? null}
          />
        ))}
      </CardContent>
    </Card>
  );
}
