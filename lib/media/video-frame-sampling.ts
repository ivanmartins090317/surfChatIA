/**
 * Quantidade de frames extraídos por vídeo para análise visual da IA.
 * Aumentado de 3 para 6 (Fase A do plano de especialização — ver
 * docs/implementation/2026-07-17-plano-especializacao-ia-performance.md)
 * para reduzir a chance de a manobra principal cair fora dos frames amostrados.
 */
export const VIDEO_FRAME_COUNT = 6;

/**
 * Distribui os timestamps de forma uniforme ao longo da duração do vídeo,
 * evitando os extremos exatos (0% e 100%), onde é mais comum haver frames
 * de transição, corte ou tela preta.
 */
export function computeFrameTimestamps(
  durationSeconds: number,
  frameCount: number = VIDEO_FRAME_COUNT,
): number[] {
  const step = 1 / (frameCount + 1);
  return Array.from({ length: frameCount }, (_, index) => {
    const ratio = step * (index + 1);
    return Math.max(0, Math.min(durationSeconds - 0.1, durationSeconds * ratio));
  });
}
