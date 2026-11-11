import { useState } from 'react'
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AuthLayout from '../components/AuthLayout'
import PesanAuth from '../components/PesanAuth'
import { pesanGalatAuth, emailTerlihatBenar } from '../lib/authErrors'
import Icon from '../components/Icon'

export default function Signup() {
  const { user, signUp, isMock } = useAuth()
  const { tenants, loading: tenantLoading } = useTenantContext()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [setujuSyarat, setSetujuSyarat] = useState(true)
  const [pesan, setPesan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(false)

  if (user && !sentConfirmation) {
    if (tenantLoading) return null
    return <Navigate to={next || (tenants.length > 0 ? '/dashboard' : '/onboarding')} replace />
  }

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
    if (password.length < 6) {
      setPesan({ teks: 'Password minimal 6 karakter.', nada: 'error' })
      return
    }
    if (password !== confirm) {
      setPesan({
        teks: 'Konfirmasi password tidak sama.',
        saran: 'Ketik ulang password yang sama persis di kedua kolom.',
        nada: 'error',
      })
      return
    }
    if (!setujuSyarat) {
      setPesan({
        teks: 'Persetujuan Syarat & Ketentuan diperlukan untuk mendaftar.',
        nada: 'error',
      })
      return
    }

    setLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp(email, password)
      if (needsEmailConfirmation) {
        setSentConfirmation(true)
      } else {
        navigate(next || '/onboarding')
      }
    } catch (err) {
      setPesan(pesanGalatAuth(err))
    } finally {
      setLoading(false)
    }
  }

  if (sentConfirmation) {
    return (
      <AuthLayout title="Cek email kamu" subtitle="Satu langkah lagi sebelum bisa masuk.">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#eef2ff',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="mail-outline" size={24} color="#6366f1" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tautan Konfirmasi Terkirim</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Kami sudah mengirim tautan aktivasi ke <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Buka tautan tersebut untuk mengaktifkan akun dan membuat ruang kerja pertama tim Anda.
          </p>
          <Link to="/login" className="auth-btn-submit" style={{ textDecoration: 'none', marginTop: 10 }}>
            Lanjut ke Halaman Masuk ↗
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Buat Akun Tim Baru"
      subtitle={isMock ? 'Mode preview. Belum tersambung ke server, sesi hanya disimpan di browser ini.' : 'Gratis selamanya, dan ruang kerja pertama Anda siap dalam 1 menit.'}
      footer={
        <>
          Sudah punya akun?{' '}
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            style={{ color: '#6366f1', fontWeight: 650, textDecoration: 'none' }}
          >
            Masuk di sini ↗
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="signup-email" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Email Kerja
        </label>
        <div className="auth-input-group">
          <span className="auth-input-icon">
            <Icon name="mail-outline" size={17} />
          </span>
          <input
            id="signup-email"
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            required
          />
        </div>

        <label className="field-label" htmlFor="signup-password" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Kata Sandi (Minimal 6 karakter)
        </label>
        <div className="auth-input-group">
          <span className="auth-input-icon">
            <Icon name="lock-closed-outline" size={17} />
          </span>
          <input
            id="signup-password"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kombinasi huruf & angka"
            autoComplete="new-password"
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

        <label className="field-label" htmlFor="signup-confirm" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Ulangi Kata Sandi
        </label>
        <div className="auth-input-group">
          <span className="auth-input-icon">
            <Icon name="shield-checkmark-outline" size={17} />
          </span>
          <input
            id="signup-confirm"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ketik ulang kata sandi"
            autoComplete="new-password"
            required
            style={{ paddingRight: 42 }}
          />
        </div>

        {/* Checkbox Persetujuan */}
        <div style={{ marginBottom: 16 }}>
          <label className="auth-checkbox-label" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={setujuSyarat}
              onChange={(e) => setSetujuSyarat(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span style={{ fontSize: 12, lineHeight: 1.45 }}>
              Saya menyetujui{' '}
              <Link to="/syarat" target="_blank" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link to="/privasi" target="_blank" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                Kebijakan Privasi
              </Link>.
            </span>
          </label>
        </div>

        <PesanAuth pesan={pesan} />

        <button type="submit" className="auth-btn-submit" disabled={loading}>
          {loading ? (
            <>
              <Icon name="refresh-outline" size={16} /> Menyiapkan Akun...
            </>
          ) : (
            <>
              <Icon name="rocket-outline" size={17} /> Buat Ruang Kerja Gratis
            </>
          )}
        </button>

        <div className="auth-security-notice">
          <Icon name="checkmark-circle-outline" size={14} color="#10b981" />
          <span>Gratis selamanya · Tanpa perlu kartu kredit</span>
        </div>
      </form>
    </AuthLayout>
  )
}
