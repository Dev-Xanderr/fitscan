import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LZString from 'lz-string';
import useScanStore from '../../context/ScanContext';
import BoothRoutine from './BoothRoutine';

export default function RoutineViewer() {
  const location = useLocation();
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use React Router's location.hash — more reliable than window.location.hash
    // Also fall back to window.location.hash in case router strips it
    const raw = location.hash || window.location.hash || '';
    const hash = raw.replace(/^#/, '');

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
      boothGoal: seed.g || 'build-muscle',
      routineLoading: false,
      routineError: null,
    });

    setReady(true);
  }, [location.hash]);

  if (error) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center px-6 text-center"
        style={{ background: '#121212' }}
      >
        <div>
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-[#FAFAFA]/60 text-sm max-w-xs mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {error}
          </p>
          <p className="text-[#FAFAFA]/20 text-[10px]" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            hash len: {(location.hash || window.location.hash || '').length}
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="text-[#FAFAFA]/40 text-xs tracking-[0.3em] uppercase" style={{ fontFamily: "'Azeret Mono', monospace" }}>
          Loading…
        </div>
      </div>
    );
  }

  return <BoothRoutine phoneMode />;
}
