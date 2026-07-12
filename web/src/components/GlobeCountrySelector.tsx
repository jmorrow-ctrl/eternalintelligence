import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, MultiPolygon } from 'geojson';
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  geoDistance,
} from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { LANGUAGES, type LanguageConfig } from '../languages/config';
import landTopology from '../assets/land-110m.json';

interface GlobeCountrySelectorProps {
  onSelect: (lang: LanguageConfig) => void;
  onBack: () => void;
}

interface CountryEntry {
  code: string;
  countryCode: string;
  name: string;
  flag: string;
  language: string;
  lat: number;
  lon: number;
  /**
   * The [lon, lat] point that should sit at the center of the globe when this
   * city is selected. Because the projection uses .rotate([-lon, -lat]), the
   * stored value is literally the city coordinates — the negation happens in the
   * projection, not here.
   */
  center: [number, number];
}

const COUNTRIES: CountryEntry[] = [
  { code: 'ru', countryCode: 'Moscow', name: 'Russia', flag: '🇷🇺', language: 'Russian', lat: 55.7558, lon: 37.6173, center: [37.6173, 55.7558] },
  { code: 'es', countryCode: 'Buenos Aires', name: 'Argentina', flag: '🇦🇷', language: 'Spanish', lat: -34.6037, lon: -58.3816, center: [-58.3816, -34.6037] },
  { code: 'fr', countryCode: 'Paris', name: 'France', flag: '🇫🇷', language: 'French', lat: 48.8566, lon: 2.3522, center: [2.3522, 48.8566] },
  { code: 'de', countryCode: 'Berlin', name: 'Germany', flag: '🇩🇪', language: 'German', lat: 52.5200, lon: 13.4050, center: [13.4050, 52.5200] },
  { code: 'is', countryCode: 'Reykjavik', name: 'Iceland', flag: '🇮🇸', language: 'Icelandic', lat: 64.1466, lon: -21.9426, center: [-21.9426, 64.1466] },
  { code: 'ja', countryCode: 'Tokyo', name: 'Japan', flag: '🇯🇵', language: 'Japanese', lat: 35.6762, lon: 139.6503, center: [139.6503, 35.6762] },
  { code: 'zh', countryCode: 'Beijing', name: 'China', flag: '🇨🇳', language: 'Mandarin Chinese', lat: 39.9042, lon: 116.4074, center: [116.4074, 39.9042] },
];

interface PinData {
  country: CountryEntry;
  x: number;
  y: number;
  visible: boolean;
  selected: boolean;
}

const VIEW_SIZE = 600;
const RADIUS = VIEW_SIZE / 2 - 2;
const AUTO_ROTATE_DELAY_MS = 1500;
const DEG_PER_SEC = 6;
// Centered so Buenos Aires, Reykjavik, Paris, Berlin, and Moscow are all
// visible at once, tilted toward the northern hemisphere (positive latitude).
const DEFAULT_ROTATION: [number, number] = [-20, 22];

export function GlobeCountrySelector({ onSelect, onBack }: GlobeCountrySelectorProps) {
  const [rotation, setRotation] = useState<[number, number]>(DEFAULT_ROTATION);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [landFeature, setLandFeature] = useState<Feature<MultiPolygon> | null>(null);
  const [landPath, setLandPath] = useState<string>('');
  const [outlinePath, setOutlinePath] = useState<string>('');
  const [graticulePath, setGraticulePath] = useState<string>('');
  const dragStart = useRef({ x: 0, y: 0 });
  const rotationStart = useRef<[number, number]>(DEFAULT_ROTATION);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRotateActiveRef = useRef(true);
  const resumeTimeoutRef = useRef<number | null>(null);
  const targetRotationRef = useRef<[number, number] | null>(null);
  const isAnimatingRef = useRef(false);

  const selected = COUNTRIES.find((c) => c.code === selectedCode);
  const selectedLanguage = LANGUAGES.find((l) => l.code === selectedCode);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .rotate([-rotation[0], -rotation[1], 0])
        .scale(RADIUS)
        .translate([VIEW_SIZE / 2, VIEW_SIZE / 2])
        .clipAngle(90),
    [rotation]
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  useEffect(() => {
    const topology = landTopology as unknown as Topology;
    const fc = feature(
      topology,
      topology.objects.land
    ) as unknown as Feature<MultiPolygon>;
    setLandFeature(fc);
  }, []);

  useEffect(() => {
    if (!landFeature) return;
    const outline = { type: 'Sphere' } as unknown as Feature;
    const land = pathGenerator(landFeature) ?? '';
    const outlineD = pathGenerator(outline) ?? '';
    const graticule = pathGenerator(geoGraticule()()) ?? '';
    // Guard against empty paths when the projection clips the entire sphere.
    setLandPath(land && land !== 'M0,0Z' ? land : '');
    setOutlinePath(outlineD && outlineD !== 'M0,0Z' ? outlineD : '');
    setGraticulePath(graticule && graticule !== 'M0,0Z' ? graticule : '');
  }, [landFeature, pathGenerator]);

  const pins = useMemo<PinData[]>(() => {
    const center: [number, number] = [rotation[0], rotation[1]];

    return COUNTRIES.map((country) => {
      const coords: [number, number] = [country.lon, country.lat];
      const angularDist = geoDistance(coords, center);
      const point = projection(coords);
      const visible = angularDist < Math.PI / 2 - 0.03;
      const x = point ? point[0] : 0;
      const y = point ? point[1] : 0;

      return {
        country,
        x,
        y,
        visible,
        selected: selectedCode === country.code,
      };
    });
  }, [projection, rotation, selectedCode]);

  // Single continuous animation loop: auto-rotates when idle, otherwise handles
  // animated reorientation to a selected city.
  useEffect(() => {
    let last = performance.now();
    let raf = 0;

    const normalizeLon = (lon: number) => {
      let v = lon % 360;
      if (v > 180) v -= 360;
      if (v <= -180) v += 360;
      return v;
    };

    const safeRotation = (lon: number, lat: number): [number, number] => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return DEFAULT_ROTATION;
      }
      return [normalizeLon(lon), Math.max(-80, Math.min(80, lat))];
    };

    const animate = (now: number) => {
      const dt = now - last;
      last = now;

      if (targetRotationRef.current) {
        setRotation(([currentLon, currentLat]) => {
          if (!Number.isFinite(currentLon) || !Number.isFinite(currentLat)) {
            targetRotationRef.current = null;
            isAnimatingRef.current = false;
            return DEFAULT_ROTATION;
          }
          const target = targetRotationRef.current;
          if (!target) return safeRotation(currentLon, currentLat);
          const [targetLon, targetLat] = target;
          const speed = (DEG_PER_SEC * 8 * dt) / 1000;

          // Longitude: take shortest path across the seam.
          let deltaLon = targetLon - currentLon;
          deltaLon = ((deltaLon + 540) % 360) - 180;
          const stepLon = Math.max(-speed, Math.min(speed, deltaLon));
          const nextLon = currentLon + stepLon;
          const arrivedLon = Math.abs(deltaLon) < 0.3;

          // Latitude: simple clamped step.
          const deltaLat = targetLat - currentLat;
          const stepLat = Math.max(-speed, Math.min(speed, deltaLat));
          const nextLat = currentLat + stepLat;
          const arrivedLat = Math.abs(deltaLat) < 0.3;

          if (arrivedLon && arrivedLat) {
            targetRotationRef.current = null;
            isAnimatingRef.current = false;
            return safeRotation(targetLon, targetLat);
          }
          return safeRotation(nextLon, nextLat);
        });
      } else if (autoRotateActiveRef.current && !isDragging && selectedCode === null) {
        setRotation(([lon, lat]) => safeRotation(lon + (DEG_PER_SEC * dt) / 1000, lat));
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isDragging, selectedCode]);

  const resumeAutoRotate = useCallback(() => {
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      if (!isDragging && selectedCode === null) autoRotateActiveRef.current = true;
    }, AUTO_ROTATE_DELAY_MS);
  }, [isDragging, selectedCode]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    rotationStart.current = [...rotation];
    autoRotateActiveRef.current = false;
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const sensitivity = 0.35;
    const nextLon = rotationStart.current[0] - dx * sensitivity;
    const nextLat = Math.max(-80, Math.min(80, rotationStart.current[1] + dy * sensitivity));
    setRotation([nextLon, nextLat]);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);
    resumeAutoRotate();
  };

  const orientToCity = useCallback((targetCenter: [number, number]) => {
    // Stop idle rotation immediately and keep it stopped because a city is selected.
    autoRotateActiveRef.current = false;
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    // Start animated reorientation instead of jumping.
    targetRotationRef.current = targetCenter;
    isAnimatingRef.current = true;
  }, []);

  const handlePinClick = (code: string) => {
    if (selectedCode === code) {
      // Already selected: keep it centered and idle.
      return;
    }
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return;
    setSelectedCode(code);
    orientToCity(country.center);
  };

  const handleBack = () => {
    setSelectedCode(null);
    onBack();
  };

  return (
    <div className="globe-selector">
      <button className="back-btn" onClick={handleBack}>[ BACK ]</button>

      <div className="globe-header">
        <h2 className="globe-heading">SELECT OPERATION THEATER</h2>
        <p className="globe-sub">Drag the globe and select a highlighted city for your mission.</p>
      </div>

      <div className="globe-layout">
      <div
        className="globe-stage"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="globe">
          <svg
            className="globe-svg"
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="globe-disc-gradient" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                <stop offset="0%" stopColor="#0d1f2d" />
                <stop offset="55%" stopColor="#05070a" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>
            </defs>
            <circle className="globe-disc" cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r={RADIUS} />
            <circle className="globe-fallback-disc" cx={VIEW_SIZE / 2} cy={VIEW_SIZE / 2} r={RADIUS - 1} />
            <path className="globe-ocean" d={outlinePath} />
            <path className="globe-outline" d={outlinePath} />
            <path className="globe-graticule" d={graticulePath} />
            <path className="globe-land-fill" d={landPath} />
            <path className="globe-land" d={landPath} />
            <path className="globe-atmosphere" d={outlinePath} />

            {pins.map((pin) => {
              const hovered = hoveredCode === pin.country.code;
              return (
                <g
                  key={pin.country.code}
                  className={pin.visible ? 'city-group visible-city' : 'city-group hidden-city'}
                  onMouseEnter={() => setHoveredCode(pin.country.code)}
                  onMouseLeave={() => setHoveredCode(null)}
                >
                  <circle
                    className={`city-hit ${pin.selected ? 'selected' : ''}`}
                    cx={pin.x}
                    cy={pin.y}
                    r={28}
                    onClick={() => handlePinClick(pin.country.code)}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <circle
                    className={`city-ring ${pin.selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
                    cx={pin.x}
                    cy={pin.y}
                    r={hovered || pin.selected ? 14 : 8}
                  />
                  <circle
                    className={`city-dot ${pin.selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
                    cx={pin.x}
                    cy={pin.y}
                    r={hovered || pin.selected ? 5 : 3}
                  />
                  <text
                    className={`city-label ${hovered ? 'hovered' : ''} ${pin.selected ? 'selected' : ''}`}
                    x={pin.x}
                    y={pin.y}
                    dy={-18}
                    textAnchor="middle"
                  >
                    {pin.country.countryCode}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

        <div className="globe-chip-list">
          {COUNTRIES.map((country) => {
            const hovered = hoveredCode === country.code;
            const isSelected = selectedCode === country.code;
            return (
              <button
                key={country.code}
                className={`globe-chip ${isSelected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
                onClick={() => handlePinClick(country.code)}
                onMouseEnter={() => setHoveredCode(country.code)}
                onMouseLeave={() => setHoveredCode(null)}
              >
                <span className="globe-chip-flag">{country.flag}</span>
                <span className="globe-chip-name">{country.countryCode}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="globe-selection">
        {selected ? (
          <>
            <div className="selected-country">
              <span className="selected-flag">{selected.flag}</span>
              <div className="selected-info">
                <div className="selected-name">{selected.countryCode}, {selected.name}</div>
                <div className="selected-language">{selected.language}</div>
              </div>
            </div>
            <button
              className="confirm-btn"
              onClick={() => selectedLanguage && onSelect(selectedLanguage)}
            >
              [ CONFIRM {selected.countryCode} ]
            </button>
          </>
        ) : (
          <div className="selected-placeholder">Select a highlighted city to proceed.</div>
        )}
      </div>
    </div>
  );
}
