import { useEffect, useState } from 'react';
import LZString from 'lz-string';
import useScanStore from '../../context/ScanContext';
import BoothRoutine from './BoothRoutine';
import { GOALS } from '../../utils/constants';

export default function RoutineViewer() {
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.search).get('r') || '';

    if (!hash) {
      setError('No routine data in this link.');
      return;
    }

    let json;
    try {
      json = LZString.decompressFromEncodedURIComponent(hash);
    } catch (e) {
      setError('Could not decompress routine data.');
      return;
    }

    if (!json) {
      setError(`Couldn't read routine link. Hash length: ${hash.length}`);
      return;
    }

    let seed;
    try {
      seed = JSON.parse(json);
    } catch (e) {
      setError('Routine data was corrupted.');
      return;
    }

    if (seed.v !== 2) {
      setError(`QR code is outdated (v${seed.v ?? 1}). Please scan a fresh code from the booth.`);
      return;
    }

    const schedule = (seed.d || []).map((day) => ({
      day: day.n,
      focus: day.f,
      exercises: (day.e || []).map((ex) => ({
        name: ex.n,
        muscleGroup: ex.mg || '',
        sets: ex.s,
        reps: ex.r,
        rest: ex.rs,
        tempo: ex.t || '',
      })),
      warmup: (day.wu || []).map((w) => ({ exercise: w })),
      cooldown: (day.cd || []).map((c) => ({ exercise: c })),
    }));

    useScanStore.setState({
      routine: {
        weeklySchedule: schedule,
        estimatedSessionDuration: seed.dur || '~45 min',
        nutritionTips: seed.np || [],
        weeklyProgressionPlan: null,
      },
      bodyType: seed.bt || 'mesomorph',
      frameSize: seed.fs || 'Medium',
      boothGoal: seed.g || GOALS.BUILD_MUSCLE,
      routineLoading: false,
      routineError: null,
    });

    setReady(true);
    // The ?r= payload is read once per mount; this viewer is only ever opened
    // via a fresh navigation from a QR scan, so re-running on hash changes
    // would only happen via accidental same-page anchor links.
  }, []);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center bg-bg">
        <div>
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-text/60 text-sm max-w-xs mb-4 font-body">
            {error}
          </p>
          <p className="text-text/20 text-[10px] font-ui">
            data len: {(new URLSearchParams(window.location.search).get('r') || '').length}
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-text/40 text-xs tracking-[0.3em] uppercase font-ui">
          Loading…
        </div>
      </div>
    );
  }

  return <BoothRoutine phoneMode />;
}
