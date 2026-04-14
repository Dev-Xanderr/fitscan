import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { BODY_TYPES } from '../../utils/constants';
import StatCard from './StatCard';
import ProportionChart from './ProportionChart';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';

export default function ResultsDashboard() {
  const navigate = useNavigate();
  const { bodyMetrics, bodyType, frameSize, proportionalNotes, snapshot, userInfo, setRoutine, setRoutineLoading, setRoutineError } = useScanStore();

  if (!bodyMetrics || !bodyType) {
    navigate('/');
    return null;
  }

  const typeInfo = BODY_TYPES[bodyType] || BODY_TYPES.mesomorph;

  const handleGenerate = async () => {
    setRoutineLoading(true);
    navigate('/routine');

    const analysisData = {
      bodyType: typeInfo.name,
      frameSize,
      metrics: bodyMetrics,
      proportionalNotes,
    };

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'your-api-key-here' && apiKey.startsWith('sk-');

    try {
      if (hasApiKey) {
        const { generateRoutine } = await import('../../services/claudeApi');
        const routine = await generateRoutine(userInfo, analysisData);
        setRoutine(routine);
      } else {
        const { generateLocalRoutine } = await import('../../services/localRoutineGenerator');
        const routine = await generateLocalRoutine(userInfo, analysisData);
        setRoutine(routine);
      }
    } catch (err) {
      if (hasApiKey) {
        try {
          const { generateLocalRoutine } = await import('../../services/localRoutineGenerator');
          const routine = await generateLocalRoutine(userInfo, analysisData);
          setRoutine(routine);
        } catch (localErr) {
          setRoutineError(localErr.message);
        }
      } else {
        setRoutineError(err.message);
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl sm:text-7xl mb-2">
            Your <span className="text-[#b93a32]">Results</span>
          </h1>
          <p className="text-white/40">AI body analysis complete</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Snapshot + Body Type */}
          <div className="space-y-6">
            {snapshot && (
              <motion.div
                className="rounded-2xl overflow-hidden border border-white/10 relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img src={snapshot} alt="Body scan" className="w-full" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-[#b93a32] text-sm font-semibold tracking-wider uppercase">Photo Analyzed</p>
                </div>
              </motion.div>
            )}

            {/* Body Type Card */}
            <motion.div
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Body Type</p>
              <h2 className="text-4xl text-[#b93a32] mb-2">{typeInfo.name}</h2>
              <p className="text-white/60 text-sm mb-4">{typeInfo.description}</p>
              <div className="flex flex-wrap gap-2">
                {typeInfo.traits.map((t) => (
                  <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-[#b93a32]/10 text-[#b93a32] border border-[#b93a32]/20">
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Frame Size */}
            <motion.div
              className="glass rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Frame Size</p>
              <h2 className="text-3xl">{frameSize}</h2>
            </motion.div>
          </div>

          {/* Right: Stats + Proportions */}
          <div className="space-y-6">
            {/* Key Ratios */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Shoulder-Hip Ratio" value={bodyMetrics.shoulderToHipRatio} max={2} delay={200} />
              <StatCard label="Torso-Leg Ratio" value={bodyMetrics.torsoToLegRatio} max={1.5} delay={400} />
              <StatCard label="Limb-Torso Ratio" value={bodyMetrics.limbToTorsoRatio} max={2} delay={600} />
              <StatCard label="Frame" value={frameSize} delay={800} />
            </div>

            {/* Proportion Chart */}
            <ProportionChart metrics={bodyMetrics} />

            {/* Proportional Notes */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-2xl">Proportional <span className="text-[#b93a32]">Insights</span></h3>
              {proportionalNotes.map((note, i) => (
                <motion.div
                  key={i}
                  className="glass rounded-xl p-4 flex gap-3 items-start"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <span className="text-[#b93a32] mt-0.5">▸</span>
                  <p className="text-white/70 text-sm">{note}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12 pb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button onClick={handleGenerate} className="text-xl px-12 py-5">
            Generate My Routine
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => { useScanStore.getState().reset(); navigate('/'); }}>
              Start Over
            </Button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
