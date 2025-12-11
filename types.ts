export type Phase = 'tree' | 'blooming' | 'nebula' | 'collapsing';

export type GestureType = 'None' | 'Open_Palm' | 'Closed_Fist' | 'Pointing_Up';

export interface OrnamentData {
  position: [number, number, number];
  color: string;
}

export interface PhotoData {
  url: string;
  orientation: 'landscape' | 'portrait';
}