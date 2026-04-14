import { Routes, Route, Navigate } from 'react-router-dom';
import { ScanProvider } from './context/ScanContext';
import BoothLanding from './components/Booth/BoothLanding';
import BoothRoutine from './components/Booth/BoothRoutine';
import RoutineViewer from './components/Booth/RoutineViewer';
import CameraView from './components/Camera/CameraView';

export default function App() {
  return (
    <ScanProvider>
      <Routes>
        {/* === BOOTH FLOW (runs on the booth laptop in kiosk mode) === */}
        <Route path="/" element={<BoothLanding />} />
        <Route path="/scan" element={<CameraView />} />
        <Route path="/routine" element={<BoothRoutine />} />

        {/* === VIEWER (loaded on the visitor's PHONE via QR code) === */}
        <Route path="/r" element={<RoutineViewer />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ScanProvider>
  );
}
