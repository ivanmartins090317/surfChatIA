const WAVE_LINE_COUNT = 18;

function WaveMesh() {
  const waveLines = Array.from({ length: WAVE_LINE_COUNT }, (_, index) => index);

  return (
    <svg
      viewBox="0 0 760 620"
      className="absolute inset-x-0 bottom-0 h-[78%] w-full text-secondary"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="wave-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.48" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#wave-fade)" strokeWidth="1">
        {waveLines.map((line) => (
          <path
            key={line}
            d="M-80 350C70 175 165 530 320 350S570 180 840 380"
            transform={`translate(0 ${line * 14 - 105})`}
            opacity={0.22 + line * 0.012}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Fundo visual compartilhado das telas de entrada (landing, auth): glows
 * radiais nas cores da marca sobre uma malha de ondas em SVG.
 */
export function OceanBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,hsl(var(--secondary)/0.16),transparent_34%),radial-gradient(circle_at_84%_82%,hsl(var(--primary)/0.12),transparent_32%)]" />
      <WaveMesh />
    </div>
  );
}
