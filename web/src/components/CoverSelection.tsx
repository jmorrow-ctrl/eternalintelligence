import { useState } from 'react';
import { PassportFace } from './PassportFace';
import { PassportEmblem, PassportFlag, PassportWatermark, type PassportTheme } from './PassportEmblems';

export interface CoverOption {
  id: string;
  name: string;
  nationality: string;
  countryCode: string;
  theme: PassportTheme;
  coverRole: string;
  dateOfBirth: string;
  sex: 'M' | 'F';
  passportNo: string;
  expiryDate: string;
  hairColor: string;
  skinColor: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bald';
  gender: 'male' | 'female';
  photo: string;
}

const COVER_OPTIONS: CoverOption[] = [
  {
    id: 'tourist',
    name: 'James Mitchell',
    nationality: 'Canadian',
    countryCode: 'CAN',
    theme: 'canadian',
    coverRole: 'Tourist',
    dateOfBirth: '14 MAR 1994',
    sex: 'M',
    passportNo: 'CA3391847',
    expiryDate: '01 JUN 2031',
    hairColor: '#8B5E3C',
    skinColor: '#F0C8A0',
    hairStyle: 'short',
    gender: 'male',
    photo: '/covers/tourist.jpg',
  },
  {
    id: 'student',
    name: 'Elena Vasquez',
    nationality: 'Spanish',
    countryCode: 'ESP',
    theme: 'spanish',
    coverRole: 'Exchange Student',
    dateOfBirth: '22 SEP 1999',
    sex: 'F',
    passportNo: 'ESB7724910',
    expiryDate: '14 JAN 2032',
    hairColor: '#3A2010',
    skinColor: '#E8C8A0',
    hairStyle: 'long',
    gender: 'female',
    photo: '/covers/student.jpg',
  },
  {
    id: 'business',
    name: 'Alexei Weber',
    nationality: 'German',
    countryCode: 'DEU',
    theme: 'german',
    coverRole: 'Business Consultant',
    dateOfBirth: '08 NOV 1985',
    sex: 'M',
    passportNo: 'D0X58821736',
    expiryDate: '29 APR 2029',
    hairColor: '#D4A060',
    skinColor: '#F5D0B0',
    hairStyle: 'bald',
    gender: 'male',
    photo: '/covers/business.jpg',
  },
  {
    id: 'journalist',
    name: 'Sofia Lindstrom',
    nationality: 'Swedish',
    countryCode: 'SWE',
    theme: 'swedish',
    coverRole: 'Freelance Journalist',
    dateOfBirth: '03 JUL 1991',
    sex: 'F',
    passportNo: '89304571',
    expiryDate: '10 AUG 2030',
    hairColor: '#C07030',
    skinColor: '#F0D0B8',
    hairStyle: 'curly',
    gender: 'female',
    photo: '/covers/journalist.jpg',
  },
];

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function toYYMMDD(dateStr: string): string {
  const [day, mon, year] = dateStr.split(' ');
  return `${year.slice(2)}${MONTHS[mon]}${day.padStart(2, '0')}`;
}

function mrzCharValue(c: string): number {
  if (c === '<') return 0;
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  return c.charCodeAt(0) - 55; // A=10 ... Z=35
}

function mrzCheckDigit(field: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) sum += mrzCharValue(field[i]) * weights[i % 3];
  return sum % 10;
}

function mrzPad(str: string, len: number): string {
  return (str + '<'.repeat(len)).slice(0, len);
}

function buildMrzLines(option: CoverOption): [string, string] {
  const [given, ...rest] = option.name.toUpperCase().split(' ');
  const surname = rest.join('<') || given;
  const line1 = mrzPad(`P<${option.countryCode}${surname}<<${given}`, 44);

  const passportField = mrzPad(option.passportNo.toUpperCase(), 9);
  const dob = toYYMMDD(option.dateOfBirth);
  const expiry = toYYMMDD(option.expiryDate);
  const personalNo = '<'.repeat(14);

  const line2 = mrzPad(
    `${passportField}${mrzCheckDigit(passportField)}${option.countryCode}${dob}${mrzCheckDigit(dob)}${option.sex}${expiry}${mrzCheckDigit(expiry)}${personalNo}${mrzCheckDigit(personalNo)}`,
    44,
  );

  return [line1, line2];
}

function CoverCard({ option, onSelect }: { option: CoverOption; onSelect: (opt: CoverOption) => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [givenNames, ...surnameParts] = option.name.toUpperCase().split(' ');
  const surname = surnameParts.join(' ');
  const [mrzLine1, mrzLine2] = buildMrzLines(option);

  return (
    <button className={`passport-card passport-theme-${option.theme}`} onClick={() => onSelect(option)}>
      <PassportWatermark theme={option.theme} />
      <div className="passport-topbar" />
      <div className="passport-header">
        <div className="passport-header-label">
          <span>PASSPORT</span>
          <span className="passport-header-sub">COVER IDENTITY DOCUMENT</span>
        </div>
        <div className="passport-header-country">
          <div className="passport-header-icons">
            <PassportFlag theme={option.theme} />
            <PassportEmblem theme={option.theme} />
          </div>
          <span className="passport-country-name">{option.nationality.toUpperCase()}</span>
          <span className="passport-country-code">TYPE P &nbsp; CODE {option.countryCode}</span>
        </div>
      </div>
      <div className="passport-body">
        <div className="passport-photo">
          {photoFailed ? (
            <PassportFace
              hairColor={option.hairColor}
              skinColor={option.skinColor}
              hairStyle={option.hairStyle}
              gender={option.gender}
            />
          ) : (
            <img
              src={option.photo}
              alt={option.name}
              className="passport-photo-img"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </div>
        <div className="passport-fields">
          <div className="passport-field passport-field-full">
            <span className="passport-field-label">Surname / Nom</span>
            <span className="passport-field-value">{surname}</span>
          </div>
          <div className="passport-field passport-field-full">
            <span className="passport-field-label">Given names / Prénoms</span>
            <span className="passport-field-value">{givenNames}</span>
          </div>
          <div className="passport-field-grid">
            <div className="passport-field">
              <span className="passport-field-label">Nationality</span>
              <span className="passport-field-value">{option.nationality}</span>
            </div>
            <div className="passport-field">
              <span className="passport-field-label">Sex</span>
              <span className="passport-field-value">{option.sex}</span>
            </div>
            <div className="passport-field">
              <span className="passport-field-label">Date of birth</span>
              <span className="passport-field-value">{option.dateOfBirth}</span>
            </div>
            <div className="passport-field">
              <span className="passport-field-label">Date of expiry</span>
              <span className="passport-field-value">{option.expiryDate}</span>
            </div>
          </div>
          <div className="passport-field passport-field-full">
            <span className="passport-field-label">Passport No.</span>
            <span className="passport-field-value">{option.passportNo}</span>
          </div>
          <div className="passport-field passport-field-full">
            <span className="passport-field-label">Cover role</span>
            <span className="passport-field-value">{option.coverRole}</span>
          </div>
        </div>
      </div>
      <div className="passport-mrz">
        <div>{mrzLine1}</div>
        <div>{mrzLine2}</div>
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
      <div className="cover-list">
        {COVER_OPTIONS.map((opt) => (
          <CoverCard key={opt.id} option={opt} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
