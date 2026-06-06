export interface BoundaryData {
  ringCount: number;
  rings: number[][][];
}

export interface LandmarkData {
  id: string;
  name: string;
  primary: boolean;
  glb: string;
  lng: number;
  lat: number;
  x: number;
  z: number;
  startYear: number;
}

export interface CivData {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  color: string;
  capital: string;
  summary: string;
}

export interface SandboxData {
  meta: {
    civId: string;
    year: number;
    phase: string;
    phaseLabel: string;
    projection: { lon0: number; lat0: number; unit: number };
    focus: { lngMin: number; lngMax: number; latMin: number; latMax: number };
  };
  civ: CivData;
  boundary: BoundaryData;
  landmarks: LandmarkData[];
}

export const WORLD_SCALE = 1.0;
