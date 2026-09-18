import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import ProtectedRoute from './components/ProtectedRoute'
import { isMisconfiguredDeployment } from './lib/supabaseClient'
import SetupNeeded from './pages/SetupNeeded.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Onboarding from './pages/Onboarding.jsx'
import AcceptInvite from './pages/AcceptInvite.jsx'
import Dashboard from './pages/Dashboard.jsx'
import KanbanBoard from './pages/KanbanBoard.jsx'
import ContentBank from './pages/ContentBank.jsx'
import ContentCalendar from './pages/ContentCalendar.jsx'
import ContentDetail from './pages/ContentDetail.jsx'
import CtaLibrary from './pages/CtaLibrary.jsx'
import CaptionFormulaLibrary from './pages/CaptionFormulaLibrary.jsx'
import HookLibrary from './pages/HookLibrary.jsx'
import ContentPillar from './pages/ContentPillar.jsx'
import PerformanceTracker from './pages/PerformanceTracker.jsx'
import Kpi from './pages/Kpi.jsx'
import Settings from './pages/Settings.jsx'
import Team from './pages/Team.jsx'
import Approvals from './pages/Approvals.jsx'
import ClientLinks from './pages/ClientLinks.jsx'
import ClientView from './pages/ClientView.jsx'
import HashtagSets from './pages/HashtagSets.jsx'
import GridPreview from './pages/GridPreview.jsx'
import Reminders from './pages/Reminders.jsx'

// Struktur route:
//   Publik           → /login, /signup, /invite/:token
//   Butuh login saja → /onboarding (belum punya workspace, jadi tidak boleh
//                      lewat ProtectedRoute yang justru melempar ke sini)
//   Butuh login + workspace → semua halaman aplikasi, dibungkus ProtectedRoute
//
// TenantProvider dipasang di dalam AuthProvider karena ia butuh tahu siapa
// user yang sedang login, dan membungkus SEMUA route — termasuk /invite —
// supaya halaman undangan bisa langsung memuat ulang daftar workspace begitu
// undangannya diterima.

// Root menampilkan halaman jualan untuk pengunjung baru, dan melompat ke
// dashboard untuk orang yang sudah masuk.
function BerandaPublik() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : <Landing />
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  // Dicegat paling awal: kalau build produksi ini tidak punya kredensial
  // Supabase, tidak ada gunanya menampilkan halaman login yang pasti gagal.
  // Lebih jujur menyatakan masalahnya dan cara memperbaikinya.
  if (isMisconfiguredDeployment) return <SetupNeeded />

  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

            {/* Halaman klien. Publik dengan sengaja: yang membukanya adalah
                klien agensi yang tidak punya akun dan tidak seharusnya jadi
                anggota workspace. Tokenlah kredensialnya, dan seluruh
                pembatasannya — rentang tanggal, masa berlaku, pencabutan —
                diperiksa di database lewat RPC, bukan di sini. */}
            <Route path="/r/:token" element={<ClientView />} />

            {/* Root adalah halaman publik. Pengunjung yang sudah login tidak perlu
                melihat halaman jualan lagi, jadi dialihkan ke dashboard. */}
            <Route path="/" element={<BerandaPublik />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/content-bank" element={<ProtectedRoute><ContentBank /></ProtectedRoute>} />
            <Route path="/content-calendar" element={<ProtectedRoute><ContentCalendar /></ProtectedRoute>} />
            <Route path="/content/:id" element={<ProtectedRoute><ContentDetail /></ProtectedRoute>} />
            <Route path="/content-pillar" element={<ProtectedRoute><ContentPillar /></ProtectedRoute>} />
            <Route path="/grid" element={<ProtectedRoute><GridPreview /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
            <Route path="/hashtag-sets" element={<ProtectedRoute><HashtagSets /></ProtectedRoute>} />
            <Route path="/client-links" element={<ProtectedRoute><ClientLinks /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/cta-library" element={<ProtectedRoute><CtaLibrary /></ProtectedRoute>} />
            <Route path="/caption-formula" element={<ProtectedRoute><CaptionFormulaLibrary /></ProtectedRoute>} />
            <Route path="/hook-library" element={<ProtectedRoute><HookLibrary /></ProtectedRoute>} />
            <Route path="/performance-tracker" element={<ProtectedRoute><PerformanceTracker /></ProtectedRoute>} />
            <Route path="/kpi" element={<ProtectedRoute><Kpi /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
