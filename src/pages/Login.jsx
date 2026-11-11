import { useState } from 'react'
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import PesanAuth from '../components/PesanAuth'
import Icon from '../components/Icon'
import { pesanGalatAuth, emailTerlihatBenar } from '../lib/authErrors'

export default function Login() {
  const { user, signIn, isMock } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [pesan, setPesan] = useState(null)
  const [loading, setLoading] = useState(false)

  // Kalau user sampai di sini lewat link undangan atau checkout, simpan tujuannya
  const next = params.get('next')

  if (user) return <Navigate to={next || '/dashboard'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setPesan(null)

    if (!emailTerlihatBenar(email)) {
      setPesan({
        teks: 'Format email belum benar.',
        saran: 'Contoh yang benar: nama@perusahaan.com',
        nada: 'error',
      })
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      navigate(next || '/dashboard')
    } catch (err) {
      setPesan(pesanGalatAuth(err))
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin() {
    setEmail('admin@ctarsa.or.id')
    setPassword('ctarsa123456')
    setPesan({
      teks: 'Kredensial pengujian telah diisikan!',
      saran: 'Klik tombol "Masuk ke Ruang Kerja" di bawah untuk mulai menjelajah.',
      nada: 'info',
    })
  }

  return (
    <AuthLayout
      title="Masuk ke Ruang Kerja"
      subtitle={isMock ? 'Mode preview. Belum tersambung ke server, sesi hanya disimpan di browser ini.' : 'Lanjutkan ke akun Anda untuk mengelola konten dan jadwal tim.'}
      footer={
        <>
          Belum punya akun?{' '}
          <Link
            to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
            style={{ color: '#6366f1', fontWeight: 650, textDecoration: 'none' }}
          >
            Daftar gratis sekarang ↗
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <label className="field-label" htmlFor="login-email" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Email Kerja
        </label>
        <div className="auth-input-group">
          <span className="auth-input-icon">
            <Icon name="mail-outline" size={17} />
          </span>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            required
          />
        </div>

        {/* Password Input */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <label className="field-label" htmlFor="login-password" style={{ fontSize: 12.5, fontWeight: 600, margin: 0 }}>
            Kata Sandi
          </label>
        </div>
        <div className="auth-input-group">
          <span className="auth-input-icon">
            <Icon name="lock-closed-outline" size={17} />
          </span>
          <input
            id="login-password"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            autoComplete="current-password"
            required
            style={{ paddingRight: 42 }}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            tabIndex="-1"
          >
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} />
          </button>
        </div>

        {/* Options Row */}
        <div className="auth-extra-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Ingat saya</span>
          </label>
          <a
            href="https://wa.me/6285111037992?text=Halo%20Admin%20plannersm.co%2C%20saya%20butuh%20bantuan%20reset%20kata%20sandi"
            target="_blank"
            rel="noopener noreferrer"
            className="auth-forgot-link"
          >
            Lupa kata sandi?
          </a>
        </div>

        <PesanAuth pesan={pesan} />

        <button type="submit" className="auth-btn-submit" disabled={loading}>
          {loading ? (
            <>
              <Icon name="refresh-outline" size={16} /> Memproses Masuk...
            </>
          ) : (
            <>
              <Icon name="log-in-outline" size={17} /> Masuk ke Ruang Kerja
            </>
          )}
        </button>

        {/* Tombol Demo Cepat */}
        <button
          type="button"
          className="auth-demo-btn"
          onClick={handleDemoLogin}
          title="Isi otomatis dengan akun uji coba"
        >
          <Icon name="sparkles" size={14} color="#6366f1" />
          <span>Isi Cepat Akun Demo (Uji Coba)</span>
        </button>

        <div className="auth-security-notice">
          <Icon name="shield-checkmark-outline" size={14} color="#10b981" />
          <span>Enkripsi TLS 256-bit · Ruang kerja terisolasi aman</span>
        </div>
      </form>
    </AuthLayout>
  )
}
