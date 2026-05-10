/**
 * Schrodinger — the mascot. Refined from the draft:
 * - Cleaner geometry (face built from primitives, not bezier overload)
 * - Quantum collar replaces the cluttered atom; box-glyph charm
 * - Pupils animate between two superposed positions on hover (observation)
 * - Works at 24px nav size to 240px hero size
 */
import * as React from 'react';

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  observed?: boolean;        // forces "observed" pupil position
  variant?: 'mark' | 'full'; // mark = head only; full = with collar
}

export function Mascot({ size = 56, observed, variant = 'full', className, ...rest }: MascotProps) {
  const id = React.useId();
  const [isObs, setIsObs] = React.useState(false);
  const obs = observed ?? isObs;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onMouseEnter={() => setIsObs(true)}
      onMouseLeave={() => setIsObs(false)}
      role="img"
      aria-label="Schrodinger"
      {...rest}
    >
      <defs>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="oklch(0.72 0.12 200)" />
          <stop offset="55%"  stopColor="oklch(0.62 0.13 240)" />
          <stop offset="100%" stopColor="oklch(0.50 0.14 285)" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="oklch(0.55 0.13 270)" />
          <stop offset="100%" stopColor="oklch(0.40 0.13 280)" />
        </linearGradient>
        <radialGradient id={`${id}-eye`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%"   stopColor="oklch(0.99 0.02 90)" />
          <stop offset="100%" stopColor="oklch(0.92 0.03 90)" />
        </radialGradient>
      </defs>

      {/* Head silhouette — rounded triangle with ears */}
      <path
        d="M60 14 L 88 26 L 100 56 Q 100 92 60 102 Q 20 92 20 56 L 32 26 Z"
        fill={`url(#${id}-fur)`}
        stroke="oklch(0.30 0.05 270)"
        strokeWidth="1.2"
      />

      {/* Inner ears */}
      <path d="M30 30 L 38 50 L 46 32 Z" fill={`url(#${id}-inner)`} />
      <path d="M90 30 L 82 50 L 74 32 Z" fill={`url(#${id}-inner)`} />

      {/* Cheek light — gentle highlight */}
      <ellipse cx="42" cy="62" rx="14" ry="10" fill="oklch(0.88 0.06 200 / 0.35)" />

      {/* Eyes — large, oval; pupils superpose between two positions */}
      <ellipse cx="44" cy="60" rx="9.5" ry="11" fill={`url(#${id}-eye)`} />
      <ellipse cx="76" cy="60" rx="9.5" ry="11" fill={`url(#${id}-eye)`} />
      <g style={{ transition: 'transform 280ms cubic-bezier(.2,.7,.2,1)' }} transform={obs ? 'translate(0 0)' : 'translate(-1.5 1)'}>
        <circle cx="44" cy="61" r="3.4" fill="oklch(0.18 0.04 280)" />
        <circle cx="76" cy="61" r="3.4" fill="oklch(0.18 0.04 280)" />
        {/* Catchlight */}
        <circle cx="42.6" cy="59.4" r="1.05" fill="oklch(0.99 0 0 / 0.95)" />
        <circle cx="74.6" cy="59.4" r="1.05" fill="oklch(0.99 0 0 / 0.95)" />
      </g>

      {/* Superposition ghost-pupils — visible only when not observed */}
      <g style={{ opacity: obs ? 0 : 0.32, transition: 'opacity 280ms' }}>
        <circle cx="46.5" cy="60" r="3.4" fill="oklch(0.55 0.14 280)" />
        <circle cx="78.5" cy="60" r="3.4" fill="oklch(0.55 0.14 280)" />
      </g>

      {/* Nose — small triangle */}
      <path d="M58 73 L 62 73 L 60 76 Z" fill="oklch(0.40 0.10 20)" />

      {/* Mouth — quiet smile */}
      <path d="M55 79 Q 60 82 65 79" stroke="oklch(0.20 0.02 280)" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* Whiskers */}
      <g stroke="oklch(0.30 0.02 280 / 0.55)" strokeWidth="1" strokeLinecap="round">
        <line x1="30" y1="76" x2="50" y2="78" />
        <line x1="30" y1="82" x2="50" y2="82" />
        <line x1="90" y1="76" x2="70" y2="78" />
        <line x1="90" y1="82" x2="70" y2="82" />
      </g>

      {variant === 'full' && (
        <>
          {/* Collar — thin strap */}
          <path d="M28 96 Q 60 108 92 96" stroke="oklch(0.30 0.05 270)" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Box-glyph charm — open box */}
          <g transform="translate(54 99)">
            <rect x="0" y="2" width="12" height="9" rx="1.2" fill="oklch(0.96 0.03 80)" stroke="oklch(0.30 0.05 270)" strokeWidth="1.2" />
            <path d="M-1 2 L 6 -3 L 13 2" stroke="oklch(0.30 0.05 270)" strokeWidth="1.2" fill="oklch(0.85 0.10 80)" strokeLinejoin="round" />
          </g>
        </>
      )}
    </svg>
  );
}

/** Just the typographic box-glyph used inline next to checkpoint headings. */
export function BoxGlyph({ open = false, color = 'currentColor', size = 14 }:
  { open?: boolean; color?: string; size?: number; }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block', verticalAlign: -2,
        width: size, height: size, position: 'relative',
        border: `1.25px solid ${color}`, borderRadius: 2,
      }}
    >
      <span style={{
        position: 'absolute',
        left: open ? -1 : -1, right: open ? -1 : -1,
        top: open ? -6 : -2,
        height: 4, background: color, borderRadius: '1px 1px 0 0',
        transform: open ? 'rotate(-22deg)' : 'none',
        transformOrigin: 'left bottom',
      }} />
    </span>
  );
}
