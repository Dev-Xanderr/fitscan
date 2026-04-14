import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';

const steps = [
  { num: '01', title: 'Upload', desc: 'Upload a full-body photo for AI-powered body analysis' },
  { num: '02', title: 'Analyze', desc: 'We map your proportions and classify your body type' },
  { num: '03', title: 'Train', desc: 'Get a personalized routine built for YOUR body' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Hero */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-block mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[#b93a32] text-sm font-semibold tracking-[0.3em] uppercase px-4 py-2 rounded-full border border-[#b93a32]/30 bg-[#b93a32]/5">
              AI-Powered Body Analysis
            </span>
          </motion.div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-bold leading-[0.9] mb-2 tracking-tight">
            SQUAT<span className="text-[#b93a32]">SCAN</span>
          </h1>

          <motion.p
            className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white/90 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Your Body. Your Blueprint.
          </motion.p>

          <motion.p
            className="text-white/50 text-lg max-w-md mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Upload a photo. Our AI analyzes your proportions and builds a workout routine designed for your unique body.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button onClick={() => navigate('/onboarding')} className="text-xl px-12 py-5">
              Get Started
            </Button>
          </motion.div>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20 w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="glass rounded-2xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <span className="text-[#b93a32] text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {step.num}
              </span>
              <h3 className="text-2xl mt-2 mb-1">{step.title}</h3>
              <p className="text-white/40 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
