/** Ilustração: bobina com linhas de campo magnético e corrente fluindo. */
export function FieldArt() {
  const loops = [40, 70, 100, 130];
  return (
    <svg viewBox="0 0 400 320" className="h-full w-full" role="img" aria-label="Bobina gerando campo magnético">
      <g fill="none" stroke="var(--electric)" strokeWidth="1.5">
        {loops.map((r, i) => (
          <g key={r} className="animate-field" style={{ animationDelay: `${i * 0.4}s` }}>
            <ellipse cx="200" cy="160" rx={r + 80} ry={r} />
          </g>
        ))}
      </g>
      <g>
        <rect x="120" y="135" width="160" height="50" rx="6" fill="var(--ink)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={i}
            x={128 + i * 17}
            y="128"
            width="9"
            height="64"
            rx="3"
            fill="var(--electric)"
            opacity={0.95}
          />
        ))}
      </g>
      <path
        d="M20 160 H120 M280 160 H380"
        stroke="var(--ink-foreground)"
        strokeWidth="2.5"
        className="animate-flow"
      />
      <text x="24" y="150" fill="var(--ink-foreground)" fontFamily="IBM Plex Mono" fontSize="11">
        i →
      </text>
      <text x="330" y="40" fill="var(--electric)" fontFamily="IBM Plex Mono" fontSize="12">
        B
      </text>
      <text x="22" y="300" fill="var(--ink-foreground)" opacity="0.6" fontFamily="IBM Plex Mono" fontSize="10">
        CORRENTE → CAMPO → MOVIMENTO → PRODUÇÃO → CUSTO
      </text>
    </svg>
  );
}
