import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { FITNESS_GOALS, EXPERIENCE_LEVELS, EQUIPMENT_OPTIONS } from '../../utils/constants';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';

function ToggleChip({ label, active, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
        active
          ? 'bg-[#b93a32] text-white border-[#b93a32]'
          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
      }`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </button>
  );
}

export default function UserInfoForm() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useScanStore();
  const [form, setForm] = useState(userInfo);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleArray = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }));
  };

  const isValid =
    form.name && form.age && form.gender && form.height && form.weight &&
    form.fitnessGoals.length > 0 && form.experienceLevel && form.equipment.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    setUserInfo(form);
    navigate('/upload');
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#b93a32]/50 transition-colors';

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h1 className="text-5xl sm:text-6xl mb-2">
            Tell Us About <span className="text-[#b93a32]">You</span>
          </h1>
          <p className="text-white/40 mb-10">We use this to personalize your workout routine.</p>
        </motion.div>

        <div className="space-y-8">
          {/* Name & Age */}
          <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div>
              <label className="text-sm text-white/50 mb-1.5 block">Name</label>
              <input className={inputClass} placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-white/50 mb-1.5 block">Age</label>
              <input className={inputClass} type="number" placeholder="25" value={form.age} onChange={(e) => update('age', e.target.value)} />
            </div>
          </motion.div>

          {/* Gender */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-sm text-white/50 mb-2 block">Gender</label>
            <div className="flex gap-3 flex-wrap">
              {['Male', 'Female', 'Other'].map((g) => (
                <ToggleChip key={g} label={g} active={form.gender === g} onClick={() => update('gender', g)} />
              ))}
            </div>
          </motion.div>

          {/* Height */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="text-sm text-white/50 mb-2 block">Height</label>
            <div className="flex gap-3 items-center">
              <input className={`${inputClass} flex-1`} type="number" placeholder={form.heightUnit === 'cm' ? '175' : '69'} value={form.height} onChange={(e) => update('height', e.target.value)} />
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button type="button" onClick={() => update('heightUnit', 'cm')} className={`px-4 py-3 text-sm cursor-pointer ${form.heightUnit === 'cm' ? 'bg-[#b93a32] text-white' : 'bg-white/5 text-white/50'}`}>cm</button>
                <button type="button" onClick={() => update('heightUnit', 'in')} className={`px-4 py-3 text-sm cursor-pointer ${form.heightUnit === 'in' ? 'bg-[#b93a32] text-white' : 'bg-white/5 text-white/50'}`}>ft/in</button>
              </div>
            </div>
          </motion.div>

          {/* Weight */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="text-sm text-white/50 mb-2 block">Weight</label>
            <div className="flex gap-3 items-center">
              <input className={`${inputClass} flex-1`} type="number" placeholder={form.weightUnit === 'kg' ? '75' : '165'} value={form.weight} onChange={(e) => update('weight', e.target.value)} />
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button type="button" onClick={() => update('weightUnit', 'kg')} className={`px-4 py-3 text-sm cursor-pointer ${form.weightUnit === 'kg' ? 'bg-[#b93a32] text-white' : 'bg-white/5 text-white/50'}`}>kg</button>
                <button type="button" onClick={() => update('weightUnit', 'lbs')} className={`px-4 py-3 text-sm cursor-pointer ${form.weightUnit === 'lbs' ? 'bg-[#b93a32] text-white' : 'bg-white/5 text-white/50'}`}>lbs</button>
              </div>
            </div>
          </motion.div>

          {/* Fitness Goals */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <label className="text-sm text-white/50 mb-2 block">Fitness Goals (select all that apply)</label>
            <div className="flex gap-3 flex-wrap">
              {FITNESS_GOALS.map((g) => (
                <ToggleChip key={g.id} label={g.label} icon={g.icon} active={form.fitnessGoals.includes(g.id)} onClick={() => toggleArray('fitnessGoals', g.id)} />
              ))}
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="text-sm text-white/50 mb-2 block">Experience Level</label>
            <div className="flex gap-3 flex-wrap">
              {EXPERIENCE_LEVELS.map((l) => (
                <ToggleChip key={l.id} label={l.label} active={form.experienceLevel === l.id} onClick={() => update('experienceLevel', l.id)} />
              ))}
            </div>
          </motion.div>

          {/* Equipment */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <label className="text-sm text-white/50 mb-2 block">Equipment Available (select all)</label>
            <div className="flex gap-3 flex-wrap">
              {EQUIPMENT_OPTIONS.map((e) => (
                <ToggleChip key={e.id} label={e.label} active={form.equipment.includes(e.id)} onClick={() => toggleArray('equipment', e.id)} />
              ))}
            </div>
          </motion.div>

          {/* Injuries */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <label className="text-sm text-white/50 mb-1.5 block">Injuries or Limitations (optional)</label>
            <textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="E.g., bad left knee, lower back issues..." value={form.injuries} onChange={(e) => update('injuries', e.target.value)} />
          </motion.div>

          {/* Submit */}
          <motion.div className="pt-4 pb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            <Button onClick={handleSubmit} disabled={!isValid} className="w-full text-xl">
              Continue to Upload
            </Button>
            {!isValid && <p className="text-white/30 text-sm mt-3 text-center">Fill in all required fields to continue</p>}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
