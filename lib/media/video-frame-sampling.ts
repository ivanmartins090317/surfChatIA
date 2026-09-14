/**
 * Quantidade de fotos da session extraídas por vídeo para análise visual.
 * 8 cortes uniformes (onda em fases). Mínimo mobile permanece em MIN_VIDEO_FRAMES.
 */
export const VIDEO_FRAME_COUNT = 8;

/**
 * Quantidade mínima de frames aceita quando a extração no navegador falha
 * parcialmente (comum em dispositivos móveis com seek de vídeo mais lento).
 * Abaixo disso a evidência visual é considerada insuficiente para análise.
 */
export const MIN_VIDEO_FRAMES = 2;

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
