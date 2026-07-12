export type PassportTheme = 'canadian' | 'spanish' | 'german' | 'swedish';

const MAPLE_LEAF_PATH =
  'M50 6 L54 20 L67 13 L62 27 L80 24 L67 36 L78 45 L63 44 L65 58 L52 49 L52 60 L48 60 L48 49 L35 58 L37 44 L22 45 L33 36 L20 24 L38 27 L33 13 L46 20 Z';

function MapleLeaf({ fill = '#C8102E' }: { fill?: string }) {
  return <path d={MAPLE_LEAF_PATH} fill={fill} />;
}

function EagleSilhouette({ fill = '#1a1a1a' }: { fill?: string }) {
  return (
    <path
      d="M50 12 C46 20 40 22 30 22 C36 26 40 28 42 32 C30 34 20 40 12 50 C24 46 32 45 40 46 C36 52 34 58 34 66 C40 60 45 56 50 56 C55 56 60 60 66 66 C66 58 64 52 60 46 C68 45 76 46 88 50 C80 40 70 34 58 32 C60 28 64 26 70 22 C60 22 54 20 50 12 Z"
      fill={fill}
    />
  );
}

function SpanishCrest() {
  return (
    <g>
      <path d="M35 20 L65 20 L65 55 C65 68 50 78 50 78 C50 78 35 68 35 55 Z" fill="#AA151B" stroke="#F1BF00" strokeWidth="2" />
      <rect x="42" y="20" width="16" height="35" fill="#F1BF00" />
      <path d="M38 10 C38 4 44 2 50 2 C56 2 62 4 62 10 L62 18 L38 18 Z" fill="#F1BF00" stroke="#8a6a1a" strokeWidth="1" />
    </g>
  );
}

function ThreeCrowns({ fill = '#FECC02' }: { fill?: string }) {
  const crown = (cx: number, cy: number, scale = 1) => (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <path d="M-10 6 L-10 -4 L-5 2 L0 -8 L5 2 L10 -4 L10 6 Z" fill={fill} stroke="#8a6a00" strokeWidth="0.6" />
      <rect x="-10" y="6" width="20" height="3" fill={fill} stroke="#8a6a00" strokeWidth="0.6" />
    </g>
  );
  return (
    <g>
      {crown(35, 30, 1.4)}
      {crown(65, 30, 1.4)}
      {crown(50, 62, 1.4)}
    </g>
  );
}

export function PassportEmblem({ theme, size = 30 }: { theme: PassportTheme; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="passport-emblem-svg">
      {theme === 'canadian' && <MapleLeaf />}
      {theme === 'german' && <EagleSilhouette />}
      {theme === 'spanish' && <SpanishCrest />}
      {theme === 'swedish' && <ThreeCrowns />}
    </svg>
  );
}

export function PassportFlag({ theme, width = 30, height = 20 }: { theme: PassportTheme; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 40" className="passport-flag-svg">
      {theme === 'canadian' && (
        <>
          <rect width="60" height="40" fill="#fff" />
          <rect width="15" height="40" fill="#C8102E" />
          <rect x="45" width="15" height="40" fill="#C8102E" />
          <g transform="translate(30 20) scale(0.22)">
            <MapleLeaf />
          </g>
        </>
      )}
      {theme === 'german' && (
        <>
          <rect width="60" height="13.3" fill="#000000" />
          <rect y="13.3" width="60" height="13.3" fill="#DD0000" />
          <rect y="26.6" width="60" height="13.4" fill="#FFCE00" />
        </>
      )}
      {theme === 'spanish' && (
        <>
          <rect width="60" height="10" fill="#AA151B" />
          <rect y="10" width="60" height="20" fill="#F1BF00" />
          <rect y="30" width="60" height="10" fill="#AA151B" />
        </>
      )}
      {theme === 'swedish' && (
        <>
          <rect width="60" height="40" fill="#006AA7" />
          <rect x="20" width="8" height="40" fill="#FECC02" />
          <rect y="16" width="60" height="8" fill="#FECC02" />
        </>
      )}
    </svg>
  );
}

export function PassportWatermark({ theme }: { theme: PassportTheme }) {
  const patternId = `pp-watermark-${theme}`;
  return (
    <svg className="passport-watermark-svg" preserveAspectRatio="none">
      <defs>
        <pattern id={patternId} width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <g opacity="0.06">
            <PassportEmblemInline theme={theme} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

function PassportEmblemInline({ theme }: { theme: PassportTheme }) {
  return (
    <g transform="translate(5 5) scale(0.35)">
      {theme === 'canadian' && <MapleLeaf fill="#14202b" />}
      {theme === 'german' && <EagleSilhouette fill="#1a1a1a" />}
      {theme === 'spanish' && <SpanishCrest />}
      {theme === 'swedish' && <ThreeCrowns fill="#0d2b3d" />}
    </g>
  );
}
