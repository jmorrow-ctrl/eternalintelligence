const SCENE_STYLES: Record<string, { name: string; className: string }> = {
  metro: { name: 'Metro / Subway', className: 'scene-metro' },
  university: { name: 'University Campus', className: 'scene-university' },
  market: { name: 'Market', className: 'scene-market' },
  cafe: { name: 'Café', className: 'scene-cafe' },
  restaurant: { name: 'Restaurant', className: 'scene-restaurant' },
  station: { name: 'Station', className: 'scene-station' },
  museum: { name: 'Museum', className: 'scene-museum' },
  office: { name: 'Office', className: 'scene-office' },
  bakery: { name: 'Bakery', className: 'scene-bakery' },
  travel: { name: 'Travel Agency', className: 'scene-travel' },
  teahouse: { name: 'Tea House', className: 'scene-teahouse' },
  izakaya: { name: 'Izakaya', className: 'scene-izakaya' },
  conbini: { name: 'Convenience Store', className: 'scene-conbini' },
  default: { name: 'Operation Site', className: 'scene-market' },
};

const SETTING_KEYWORDS: Record<string, string[]> = {
  metro: ['metro', 'subway', 'u-bahn', '地铁', '駅', 'station metro'],
  university: ['university', 'campus', 'universidad', 'universität', '大学', 'университет'],
  market: ['market', 'mercado', 'supermarket', 'рынок', '市场'],
  cafe: ['café', 'cafe', 'coffee', 'kaffi', 'cafetería', 'café du', '茶馆'],
  restaurant: ['restaurant', 'restaurante', 'izakaya', 'dinner', 'ужин', '食堂'],
  station: ['station', 'bahnhof', 'terminal', '火车站', '车站'],
  museum: ['museum', 'museo', 'musée', 'safnið', 'музей', '博物馆'],
  office: ['office', 'oficina', 'bureau', 'government', '办事处'],
  bakery: ['bakery', 'boulangerie', 'bäckerei', '面包'],
  travel: ['travel', 'agency', 'ferðaskrifstofa', '旅行社'],
  teahouse: ['tea house', 'teahouse', '茶馆', '茶'],
  izakaya: ['izakaya', '居酒屋'],
  conbini: ['convenience', 'conbini', 'コンビニ'],
};

function detectSceneKey(setting: string): string {
  const lower = setting.toLowerCase();
  for (const [key, keywords] of Object.entries(SETTING_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return key;
  }
  return 'default';
}

export function SceneBackground({ setting }: { setting: string }) {
  const sceneKey = detectSceneKey(setting);
  const scene = SCENE_STYLES[sceneKey];

  return (
    <div className={`scene-bg ${scene.className}`}>
      <div className="scene-label">{scene.name}</div>
      <div className="scene-atmosphere" />
    </div>
  );
}
