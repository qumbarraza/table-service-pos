import { Navigate, Route, Routes } from 'react-router-dom'
import TopBar from './components/TopBar'
import PosPage from './pages/PosPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_32%),linear-gradient(135deg,_#271304_0%,_#5b2d0d_44%,_#f0dec3_100%)] text-stone-950">
      <div className="mx-auto flex h-dvh max-w-[1700px] flex-col px-3 py-3 md:px-4 md:py-3">
        <TopBar />
        <Routes>
          <Route path="/" element={<PosPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
