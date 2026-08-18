import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import KanbanBoard from './pages/KanbanBoard.jsx'
import ContentBank from './pages/ContentBank.jsx'
import ContentCalendar from './pages/ContentCalendar.jsx'
import CtaLibrary from './pages/CtaLibrary.jsx'
import CaptionFormulaLibrary from './pages/CaptionFormulaLibrary.jsx'
import HookLibrary from './pages/HookLibrary.jsx'
import ContentPillar from './pages/ContentPillar.jsx'
import PerformanceTracker from './pages/PerformanceTracker.jsx'
import Kpi from './pages/Kpi.jsx'

// Semua route di bawah /login dibungkus ProtectedRoute — begitu user belum
// login, otomatis dilempar ke /login (lihat ProtectedRoute.jsx). Route baru
// yang ditambah nanti ikuti pola yang sama: bungkus <ProtectedRoute>.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/content-bank" element={<ProtectedRoute><ContentBank /></ProtectedRoute>} />
          <Route path="/content-calendar" element={<ProtectedRoute><ContentCalendar /></ProtectedRoute>} />
          <Route path="/content-pillar" element={<ProtectedRoute><ContentPillar /></ProtectedRoute>} />
          <Route path="/cta-library" element={<ProtectedRoute><CtaLibrary /></ProtectedRoute>} />
          <Route path="/caption-formula" element={<ProtectedRoute><CaptionFormulaLibrary /></ProtectedRoute>} />
          <Route path="/hook-library" element={<ProtectedRoute><HookLibrary /></ProtectedRoute>} />
          <Route path="/performance-tracker" element={<ProtectedRoute><PerformanceTracker /></ProtectedRoute>} />
          <Route path="/kpi" element={<ProtectedRoute><Kpi /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
