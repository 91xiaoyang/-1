import { create } from 'zustand';
import { Phase, GestureType } from './types';

interface AppState {
  phase: Phase;
  gesture: GestureType;
  cameraActive: boolean;
  
  // x, y are normalized 0-1 position on screen
  // z is normalized 0-1 scale (approximate depth)
  handPosition: { x: number; y: number; z: number }; 
  
  // Hand rotation in radians { x: pitch, y: yaw, z: roll }
  handRotation: { x: number; y: number; z: number };

  // 0.0 (Closed Fist) to 1.0 (Open Palm)
  handOpenness: number;

  setPhase: (phase: Phase) => void;
  setGesture: (gesture: GestureType) => void;
  setCameraActive: (active: boolean) => void;
  setHandPosition: (pos: { x: number; y: number; z: number }) => void;
  setHandRotation: (rot: { x: number; y: number; z: number }) => void;
  setHandOpenness: (openness: number) => void;
}

export const useStore = create<AppState>((set) => ({
  phase: 'tree',
  gesture: 'None',
  cameraActive: false,
  handPosition: { x: 0.5, y: 0.5, z: 0.2 },
  handRotation: { x: 0, y: 0, z: 0 },
  handOpenness: 0, // Default to closed (tree form)

  setPhase: (phase) => set({ phase }),
  setGesture: (gesture) => set({ gesture }),
  setCameraActive: (active) => set({ cameraActive: active }),
  setHandPosition: (pos) => set({ handPosition: pos }),
  setHandRotation: (rot) => set({ handRotation: rot }),
  setHandOpenness: (openness) => set({ handOpenness: openness }),
}));