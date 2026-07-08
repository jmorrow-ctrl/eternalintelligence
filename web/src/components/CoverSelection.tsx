import { PassportFace } from './PassportFace';

export interface CoverOption {
  id: string;
  name: string;
  nationality: string;
  coverRole: string;
  backstory: string;
  hairColor: string;
  skinColor: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bald';
  gender: 'male' | 'female';
}

const COVER_OPTIONS: CoverOption[] = [
  {
    id: 'tourist',
    name: 'James Mitchell',
    nationality: 'Canadian',
    coverRole: 'Tourist',
    backstory: 'First time in Moscow. Here to see the sights — Red Square, Bolshoi Theatre, and the Metro. Speaks basic Russian from a phrasebook.',
    hairColor: '#8B5E3C',
    skinColor: '#F0C8A0',
    hairStyle: 'short',
    gender: 'male',
  },
  {
    id: 'student',
    name: 'Elena Vasquez',
    nationality: 'Spanish',
    coverRole: 'Exchange Student',
    backstory: 'Studying Russian literature at Moscow State University for one semester. Lives in a dorm near campus. Knows some Russian from classes back home.',
    hairColor: '#3A2010',
    skinColor: '#E8C8A0',
    hairStyle: 'long',
    gender: 'female',
  },
  {
    id: 'business',
    name: 'Alexei Weber',
    nationality: 'German',
    coverRole: 'Business Consultant',
    backstory: 'In Moscow for a two-week consulting project. Meeting with local partners. Speaks professional Russian but not fluent in casual conversation.',
    hairColor: '#D4A060',
    skinColor: '#F5D0B0',
    hairStyle: 'bald',
    gender: 'male',
  },
  {
    id: 'journalist',
    name: 'Sofia Lindstrom',
    nationality: 'Swedish',
    coverRole: 'Freelance Journalist',
    backstory: 'Writing a travel piece on Moscow markets and cuisine. Has a camera and notebook. Friendly and curious, asks lots of questions.',
    hairColor: '#C07030',
    skinColor: '#F0D0B8',
    hairStyle: 'curly',
    gender: 'female',
  },
];

function CoverCard({ option, onSelect }: { option: CoverOption; onSelect: (opt: CoverOption) => void }) {
  return (
    <button className="cover-card" onClick={() => onSelect(option)}>
      <div className="cover-passport-stamp">PASSPORT</div>
      <div className="cover-photo">
        <PassportFace
          hairColor={option.hairColor}
          skinColor={option.skinColor}
          hairStyle={option.hairStyle}
          gender={option.gender}
        />
      </div>
      <div className="cover-details">
        <div className="cover-field">
          <span className="cover-field-label">NAME</span>
          <span className="cover-field-value">{option.name}</span>
        </div>
        <div className="cover-field">
          <span className="cover-field-label">NATIONALITY</span>
          <span className="cover-field-value">{option.nationality}</span>
        </div>
        <div className="cover-field">
          <span className="cover-field-label">COVER</span>
          <span className="cover-field-value">{option.coverRole}</span>
        </div>
        <div className="cover-backstory">{option.backstory}</div>
      </div>
    </button>
  );
}

export function CoverSelection({ realName, onSelect }: {
  realName: string;
  onSelect: (option: CoverOption) => void;
}) {
  return (
    <div className="cover-selection">
      <div className="cover-welcome">
        <span className="cover-welcome-label">AGENT</span>
        <span className="cover-welcome-name">{realName.toUpperCase()}</span>
      </div>
      <p className="cover-instruction">Select your cover identity for this operation:</p>
      <div className="cover-grid">
        {COVER_OPTIONS.map((opt) => (
          <CoverCard key={opt.id} option={opt} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
