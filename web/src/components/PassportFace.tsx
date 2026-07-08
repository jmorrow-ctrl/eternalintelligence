interface FaceProps {
  hairColor: string;
  skinColor: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bald';
  gender: 'male' | 'female';
}

export function PassportFace({ hairColor, skinColor, hairStyle, gender }: FaceProps) {
  const eyeY = 28;
  const mouthY = 38;

  return (
    <svg viewBox="0 0 60 60" className="passport-face">
      {/* Neck */}
      {gender === 'male' ? (
        <rect x="24" y="44" width="12" height="10" rx="2" fill={skinColor} />
      ) : (
        <rect x="25" y="44" width="10" height="10" rx="3" fill={skinColor} />
      )}

      {/* Face */}
      <ellipse cx="30" cy="30" rx="16" ry="18" fill={skinColor} />

      {/* Hair */}
      {hairStyle === 'short' && (
        <>
          <ellipse cx="30" cy="18" rx="17" ry="10" fill={hairColor} />
          <rect x="14" y="16" width="32" height="6" rx="3" fill={hairColor} />
        </>
      )}
      {hairStyle === 'long' && (
        <>
          <ellipse cx="30" cy="18" rx="17" ry="11" fill={hairColor} />
          <rect x="13" y="18" width="34" height="12" rx="4" fill={hairColor} />
          <rect x="18" y="28" width="6" height="14" rx="3" fill={hairColor} />
          <rect x="36" y="28" width="6" height="14" rx="3" fill={hairColor} />
        </>
      )}
      {hairStyle === 'curly' && (
        <>
          <ellipse cx="30" cy="17" rx="18" ry="11" fill={hairColor} />
          <circle cx="18" cy="14" r="6" fill={hairColor} />
          <circle cx="30" cy="10" r="7" fill={hairColor} />
          <circle cx="42" cy="14" r="6" fill={hairColor} />
        </>
      )}
      {hairStyle === 'bald' && (
        <ellipse cx="30" cy="17" rx="17" ry="8" fill={skinColor} opacity="0.85" />
      )}

      {/* Eyebrows */}
      <rect x="20" y="22" width="6" height="2" rx="1" fill="#333" opacity="0.6" />
      <rect x="34" y="22" width="6" height="2" rx="1" fill="#333" opacity="0.6" />

      {/* Eyes */}
      <circle cx="23" cy={eyeY} r="2.5" fill="#fff" />
      <circle cx="37" cy={eyeY} r="2.5" fill="#fff" />
      <circle cx="23" cy={eyeY} r="1.5" fill="#333" />
      <circle cx="37" cy={eyeY} r="1.5" fill="#333" />

      {/* Nose */}
      <ellipse cx="30" cy={eyeY + 6} rx="1.5" ry="2.5" fill={skinColor} stroke="#ccc" strokeWidth="0.3" />

      {/* Mouth */}
      {gender === 'male' ? (
        <path d={`M24 ${mouthY} Q30 ${mouthY + 3} 36 ${mouthY}`} fill="none" stroke="#a05050" strokeWidth="1.2" strokeLinecap="round" />
      ) : (
        <path d={`M24 ${mouthY} Q30 ${mouthY + 2.5} 36 ${mouthY}`} fill="none" stroke="#b06060" strokeWidth="1" strokeLinecap="round" />
      )}

      {/* Ears */}
      <ellipse cx="14" cy="30" rx="2.5" ry="4" fill={skinColor} />
      <ellipse cx="46" cy="30" rx="2.5" ry="4" fill={skinColor} />
    </svg>
  );
}
