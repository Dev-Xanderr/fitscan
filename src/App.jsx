import { Routes, Route, Navigate } from 'react-router-dom';
import { ScanProvider } from './context/ScanContext';
import BoothLanding from './components/Booth/BoothLanding';
import BoothRoutine from './components/Booth/BoothRoutine';
import RoutineViewer from './components/Booth/RoutineViewer';
import CameraView from './components/Camera/CameraView';
import { ROUTES } from './utils/constants';

export default function App() {
  // If URL has ?r=... it's a phone QR scan — render viewer directly.
  // This works on GitHub Pages since the root path always loads fine.
  if (new URLSearchParams(window.location.search).has('r')) {
    return (
      <ScanProvider>
        <RoutineViewer />
      </ScanProvider>
    );
  }

  return (
    <ScanProvider>
      <Routes>
        <Route path={ROUTES.LANDING} element={<BoothLanding />} />
        <Route path={ROUTES.SCAN} element={<CameraView />} />
        <Route path={ROUTES.ROUTINE} element={<BoothRoutine />} />
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </ScanProvider>
  );
}
