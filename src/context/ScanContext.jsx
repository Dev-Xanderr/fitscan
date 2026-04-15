import { createContext } from 'react';
import { create } from 'zustand';

const DEFAULT_USER_INFO = {
  name: '',
  age: '28',
  gender: 'Other',
  height: '175',
  heightUnit: 'cm',
  weight: '75',
  weightUnit: 'kg',
  fitnessGoals: ['build-muscle'],
  experienceLevel: 'intermediate',
  injuries: '',
  equipment: ['full-gym'],
};

const useScanStore = create((set) => ({
  // User info — pre-filled defaults so the booth never shows a form.
  // The local routine generator works fine with these + body metrics from pose detection.
  userInfo: { ...DEFAULT_USER_INFO },

  // Booth-selected goal — visitor taps Muscle/Lean before scanning
  boothGoal: 'build-muscle',

  // Scan data
  keypoints: null,
  snapshot: null,
  scanStatus: 'idle', // idle | searching | detected | holding | complete

  // Analysis
  bodyMetrics: null,
  bodyType: null,
  frameSize: null,
  proportionalNotes: [],
  routineSalt: null, // unique per scan — makes routines differ even for same body type

  // Routine
  routine: null,
  routineLoading: false,
  routineError: null,

  // Actions
  setUserInfo: (info) => set((s) => ({ userInfo: { ...s.userInfo, ...info } })),
  setGender: (gender) => set((s) => ({ userInfo: { ...s.userInfo, gender } })),
  setBoothGoal: (boothGoal) => {
    // Map UI goal → underlying userInfo.fitnessGoals so the generator picks it up
    const map = {
      'build-muscle': ['build-muscle'],
      'lose-fat': ['lose-fat'],
      athletic: ['athletic'],
    };
    set((s) => ({
      boothGoal,
      userInfo: { ...s.userInfo, fitnessGoals: map[boothGoal] || ['build-muscle'] },
    }));
  },
  setScanData: (keypoints, snapshot) => set({ keypoints, snapshot }),
  setScanStatus: (scanStatus) => set({ scanStatus }),
  setAnalysis: (bodyMetrics, bodyType, frameSize, proportionalNotes) =>
    set({ bodyMetrics, bodyType, frameSize, proportionalNotes, routineSalt: Date.now() }),
  setRoutine: (routine) => set({ routine, routineLoading: false, routineError: null }),
  setRoutineLoading: (routineLoading) => set({ routineLoading }),
  setRoutineError: (routineError) => set({ routineError, routineLoading: false }),
  reset: () =>
    set({
      userInfo: { ...DEFAULT_USER_INFO },
      boothGoal: 'build-muscle',
      keypoints: null,
      snapshot: null,
      scanStatus: 'idle',
      bodyMetrics: null,
      bodyType: null,
      frameSize: null,
      proportionalNotes: [],
      routineSalt: null,
      routine: null,
      routineLoading: false,
      routineError: null,
    }),
}));

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  return <ScanContext.Provider value={useScanStore}>{children}</ScanContext.Provider>;
}

export function useScan() {
  return useScanStore;
}

export default useScanStore;
