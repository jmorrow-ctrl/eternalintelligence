import { LANGUAGES, type LanguageConfig } from '../languages/config';

interface LanguagePickerProps {
  onSelect: (lang: LanguageConfig) => void;
  onBack: () => void;
}

export function LanguagePicker({ onSelect, onBack }: LanguagePickerProps) {
  return (
    <div className="language-picker">
      <button className="back-btn" onClick={onBack} style={{ alignSelf: 'flex-start' }}>[ BACK ]</button>
      <h2 className="lang-picker-heading">SELECT TARGET LANGUAGE</h2>
      <p className="lang-picker-sub">Choose the language for your operation:</p>
      <div className="lang-list">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className="lang-row"
            onClick={() => onSelect(lang)}
          >
            <span className="lang-flag">{lang.flag}</span>
            <span className="lang-name">{lang.name}</span>
            <span className="lang-code">[{lang.code.toUpperCase()}]</span>
            <span className="lang-native">{lang.nativeName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
