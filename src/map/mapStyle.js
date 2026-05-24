export const INITIAL_VIEW = { center: [55, 35], zoom: 3.2, pitch: 55, bearing: -22 };
export const MOUNTAIN_VIEW = { center: [86.9, 27.99], zoom: 6.2, pitch: 68, bearing: -35 };

export const WORLD_TERRAIN_EXAGGERATION = 0.18;
export const MOUNTAIN_TERRAIN_EXAGGERATION = 2.6;

export const darkStyle = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '',
    },
    'terrain-dem': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
      attribution: '<a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a>',
    },
    'terrain-dem-shade': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': 'rgba(4, 8, 15, 0.0)' } },
    {
      id: 'base',
      type: 'raster',
      source: 'osm-tiles',
      paint: {
        'raster-opacity': 0.86,
        'raster-contrast': 0.12,
        'raster-saturation': -0.18,
      },
    },
    {
      id: 'terrain-shade',
      type: 'hillshade',
      source: 'terrain-dem-shade',
      paint: {
        'hillshade-exaggeration': 0,
        'hillshade-shadow-color': 'rgba(0, 0, 0, 0.72)',
        'hillshade-highlight-color': 'rgba(155, 185, 220, 0.28)',
        'hillshade-accent-color': 'rgba(95, 120, 155, 0.30)',
      },
    },
  ],
  terrain: { source: 'terrain-dem', exaggeration: WORLD_TERRAIN_EXAGGERATION },
  sky: {
    'sky-color': '#0a1428',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#1a2a44',
    'horizon-fog-blend': 0.6,
    'fog-color': '#04080f',
    'fog-ground-blend': 0.1,
  },
};

export function setTerrainMode(map, mode) {
  if (!map) return;
  const isMountain = mode === 'mountain';
  map.setTerrain({
    source: 'terrain-dem',
    exaggeration: isMountain ? MOUNTAIN_TERRAIN_EXAGGERATION : WORLD_TERRAIN_EXAGGERATION,
  });
  if (map.getLayer('terrain-shade')) {
    map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', isMountain ? 0.75 : 0);
  }
}
