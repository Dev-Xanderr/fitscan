import { createContext } from 'react';
import { create } from 'zustand';
import { SCAN_STATUS, GOALS } from '../utils/constants';

const DEFAULT_USER_INFO = {
  name: '',
  age: '28',
  gender: 'Other',
  height: '175',
  heightUnit: 'cm',
  weight: '75',
  weightUnit: 'kg',
  fitnessGoals: [GOALS.BUILD_MUSCLE],
  experienceLevel: 'intermediate',
  injuries: '',
  equipment: ['full-gym'],
};

const useScanStore = create((set) => ({
  // User info — pre-filled defaults so the booth never shows a form.
  // The local routine generator works fine with these + body metrics from pose detection.
  userInfo: { ...DEFAULT_USER_INFO },

  // Booth-selected goal — visitor taps Muscle/Lean before scanning
  boothGoal: GOALS.BUILD_MUSCLE,

  // Scan data
  keypoints: null,
  snapshot: null,
  scanStatus: SCAN_STATUS.IDLE,

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
    // Map UI goal → underlying userInfo.fitnessGoals so the generator picks it up.
    // The generator reads goals.includes('lose-fat' | 'build-muscle' | 'athletic')
    // so values must match those literals exactly — that's why these stay strings
    // and not nested constants.
    const map = {
      [GOALS.BUILD_MUSCLE]: [GOALS.BUILD_MUSCLE],
      [GOALS.LOSE_FAT]: [GOALS.LOSE_FAT],
      athletic: ['athletic'],
    };
    set((s) => ({
      boothGoal,
      userInfo: { ...s.userInfo, fitnessGoals: map[boothGoal] || [GOALS.BUILD_MUSCLE] },
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
      boothGoal: GOALS.BUILD_MUSCLE,
      keypoints: null,
      snapshot: null,
      scanStatus: SCAN_STATUS.IDLE,
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
