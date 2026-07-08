interface RubyToken {
  text: string;
  reading: string;
}

interface RubyTextProps {
  tokens: RubyToken[];
  showRuby?: boolean;
}

export function RubyText({ tokens, showRuby = false }: RubyTextProps) {
  if (!showRuby) {
    return <>{tokens.map((t, i) => <span key={i}>{t.text}</span>)}</>;
  }

  return (
    <>
      {tokens.map((t, i) => (
        <ruby key={i} className="ruby-token">
          {t.text}
          <rp>(</rp><rt>{t.reading}</rt><rp>)</rp>
        </ruby>
      ))}
    </>
  );
}
