import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector, detectPose, isFullBodyVisible } from '../../services/poseService';
import { calculateBodyMetrics, classifyBodyType, classifyFrameSize, getProportionalNotes, calculateBMI } from '../../utils/bodyMetrics';
import SkeletonOverlay from './SkeletonOverlay';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';

export default function PhotoUpload() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { userInfo, setScanData, setScanStatus, setAnalysis } = useScanStore();

  const [image, setImage] = useState(null);
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });
  const [displayDims, setDisplayDims] = useState({ width: 0, height: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const [keypoints, setKeypoints] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    setError(null);
    setKeypoints(null);
    setShowFallback(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const containerWidth = Math.min(window.innerWidth - 32, 640);
        const scale = containerWidth / img.width;
        const containerHeight = img.height * scale;

        setImageDims({ width: img.width, height: img.height });
        setDisplayDims({ width: containerWidth, height: containerHeight });
        setImage(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Create an HTMLImageElement for pose detection
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => {
        if (img.complete) resolve();
        else img.onload = resolve;
      });

      // Load detector and run pose detection on the image
      const detector = await loadPoseDetector();
      const pose = await detectPose(detector, img);

      if (!pose || !pose.keypoints) {
        setError('Could not detect a body in this photo. Try a full-body photo with good lighting.');
        setShowFallback(true);
        setAnalyzing(false);
        return;
      }

      const kps = pose.keypoints;
      setKeypoints(kps);

      if (!isFullBodyVisible(kps)) {
        setError('Full body not visible. Make sure your entire body from shoulders to ankles is in the photo.');
        setShowFallback(true);
        setAnalyzing(false);
        return;
      }

      // Calculate metrics
      let heightCm = parseFloat(userInfo.height) || 170;
      if (userInfo.heightUnit === 'in') heightCm = heightCm * 2.54;

      let weightKg = parseFloat(userInfo.weight) || 70;
      if (userInfo.weightUnit === 'lbs') weightKg = weightKg * 0.453592;

      const metrics = calculateBodyMetrics(kps, heightCm);
      const bmi = calculateBMI(weightKg, heightCm);
      const bodyType = classifyBodyType(metrics, bmi);
      const frameSize = classifyFrameSize(metrics.shoulderWidth, heightCm);
      const notes = getProportionalNotes(metrics);

      setScanData(kps, image);
      setAnalysis(metrics, bodyType, frameSize, notes);
      setScanStatus('complete');

      setTimeout(() => navigate('/results'), 1200);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}`);
      setShowFallback(true);
      setAnalyzing(false);
    }
  };

  const handleManualSelect = (type) => {
    const mockMetrics = {
      shoulderWidth: type === 'ectomorph' ? 38 : type === 'mesomorph' ? 44 : 42,
      hipWidth: type === 'ectomorph' ? 30 : type === 'mesomorph' ? 33 : 38,
      torsoLength: type === 'ectomorph' ? 52 : type === 'mesomorph' ? 50 : 48,
      legLength: type === 'ectomorph' ? 84 : type === 'mesomorph' ? 80 : 76,
      armLength: type === 'ectomorph' ? 64 : type === 'mesomorph' ? 60 : 56,
      shoulderToHipRatio: type === 'ectomorph' ? 1.27 : type === 'mesomorph' ? 1.33 : 1.11,
      torsoToLegRatio: type === 'ectomorph' ? 0.62 : type === 'mesomorph' ? 0.63 : 0.63,
      limbToTorsoRatio: type === 'ectomorph' ? 1.23 : type === 'mesomorph' ? 1.2 : 1.17,
    };
    const { getProportionalNotes: getNotes } = require('../../utils/bodyMetrics');
    const notes = getProportionalNotes(mockMetrics);
    const frameSize = type === 'ectomorph' ? 'Small' : type === 'mesomorph' ? 'Medium' : 'Large';

    setScanData(null, image);
    setAnalysis(mockMetrics, type, frameSize, notes);
    setScanStatus('complete');
    navigate('/results');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <motion.div className="mb-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl sm:text-5xl mb-2">Upload <span className="text-[#b93a32]">Photo</span></h1>
          <p className="text-white/50 text-sm max-w-md">
            Upload a full-body photo for AI body analysis. Stand straight facing the camera.
          </p>
        </motion.div>

        {!image ? (
          /* Upload area */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`w-full max-w-lg aspect-[3/4] rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
              dragOver
                ? 'border-[#b93a32] bg-[#b93a32]/10'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/8'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#b93a32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </motion.div>

            <div className="text-center">
              <p className="text-white/70 font-medium">Drop your photo here</p>
              <p className="text-white/30 text-sm mt-1">or click to browse</p>
            </div>

            <div className="flex gap-2 mt-2">
              {['JPG', 'PNG', 'WEBP'].map((fmt) => (
                <span key={fmt} className="text-xs text-white/20 px-2 py-1 rounded-full bg-white/5">{fmt}</span>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Image preview + analysis */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden border border-white/10"
            style={{ width: displayDims.width, height: displayDims.height }}
          >
            <img
              src={image}
              alt="Uploaded photo"
              className="absolute top-0 left-0 w-full h-full object-cover"
            />

            {/* Skeleton overlay on analyzed photo */}
            {keypoints && (
              <div className="absolute inset-0">
                <SkeletonOverlay
                  keypoints={keypoints}
                  width={displayDims.width}
                  height={displayDims.height}
                  videoWidth={imageDims.width}
                  videoHeight={imageDims.height}
                />
              </div>
            )}

            {/* Analyzing overlay */}
            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"
                >
                  <div className="text-center">
                    <LoadingSpinner size={48} />
                    <p className="text-white/70 text-sm mt-4">Analyzing body proportions...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success overlay */}
            <AnimatePresence>
              {keypoints && !analyzing && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4 z-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="bg-[#b93a32] rounded-full p-3"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mt-4 text-center max-w-md"
          >
            {error}
          </motion.p>
        )}

        {/* Action buttons */}
        <motion.div
          className="mt-6 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {image && !analyzing && (
            <div className="flex gap-3">
              <Button onClick={handleAnalyze}>
                Analyze Photo
              </Button>
              <Button variant="secondary" onClick={() => { setImage(null); setKeypoints(null); setError(null); setShowFallback(false); }}>
                Change Photo
              </Button>
            </div>
          )}

          {!image && (
            <p className="text-white/30 text-sm">
              Full-body photo works best — head to toe, front-facing, well-lit.
            </p>
          )}
        </motion.div>

        {/* Manual fallback */}
        <AnimatePresence>
          {showFallback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 w-full max-w-3xl"
            >
              <p className="text-center text-white/50 text-sm mb-4">Or select your body type manually:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { type: 'ectomorph', label: 'Ectomorph', desc: 'Lean, narrow frame, fast metabolism', icon: '🏃' },
                  { type: 'mesomorph', label: 'Mesomorph', desc: 'Athletic, muscular, medium frame', icon: '💪' },
                  { type: 'endomorph', label: 'Endomorph', desc: 'Broader, solid frame, strong base', icon: '🏋️' },
                ].map((bt) => (
                  <motion.button
                    key={bt.type}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleManualSelect(bt.type)}
                    className="glass rounded-2xl p-6 text-center cursor-pointer hover:border-[#b93a32]/30 transition-colors"
                  >
                    <span className="text-4xl block mb-3">{bt.icon}</span>
                    <h3 className="text-xl mb-1">{bt.label}</h3>
                    <p className="text-white/40 text-xs">{bt.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always show manual option link */}
        {!showFallback && (
          <Button variant="ghost" onClick={() => setShowFallback(true)} className="mt-4 text-sm">
            Skip photo? Select body type manually
          </Button>
        )}
      </div>
    </PageTransition>
  );
}
