import { useState } from 'react'
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AuthLayout from '../components/AuthLayout'
import PesanAuth from '../components/PesanAuth'
import { pesanGalatAuth, emailTerlihatBenar } from '../lib/authErrors'
import Icon from '../components/Icon'

// Pendaftaran mandiri. Ini yang mengubah aplikasi dari "dipasang untuk satu
// organisasi" jadi produk yang bisa dipakai siapa saja: user bikin akun
// sendiri, lalu langsung diarahkan ke wizard onboarding untuk membuat
// workspace pertamanya.

export default function Signup() {
  const { user, signUp, isMock } = useAuth()
  const { tenants, loading: tenantLoading } = useTenantContext()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pesan, setPesan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(false)

  // Pengguna yang sudah login dan sudah punya ruang kerja tidak boleh dikirim
  // ke wizard. Sebelumnya halaman ini selalu melempar ke /onboarding, sehingga
  // membuka /signup dalam keadaan sudah login menampilkan formulir pembuatan
  // ruang kerja yang sama sekali tidak diminta.
  if (user && !sentConfirmation) {
    if (tenantLoading) return null
    return <Navigate to={next || (tenants.length > 0 ? '/' : '/onboarding')} replace />
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
              width: 42, height: 42, borderRadius: 12, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="mail-outline" size={21} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Kami sudah mengirim link konfirmasi ke <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Buka link itu, lalu masuk untuk membuat workspace pertama kamu.
          </p>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: 'none' }}>
            Ke halaman masuk
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Buat akun"
      subtitle={isMock ? 'Mode preview. Belum tersambung ke server, sesi hanya disimpan di browser ini.' : 'Gratis, dan ruang kerja pertama kamu jadi dalam satu menit.'}
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          autoComplete="email"
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="signup-confirm">Ulangi password</label>
        <input
          id="signup-confirm"
          className="input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ketik ulang password"
          autoComplete="new-password"
          required
          style={{ marginBottom: 18 }}
        />

        <PesanAuth pesan={pesan} />

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Membuat akun...' : 'Buat akun'}
        </button>
      </form>
    </AuthLayout>
  )
}
