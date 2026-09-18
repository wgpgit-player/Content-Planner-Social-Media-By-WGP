import { useState } from 'react'
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import PesanAuth from '../components/PesanAuth'
import { pesanGalatAuth, emailTerlihatBenar } from '../lib/authErrors'

export default function Login() {
  const { user, signIn, isMock } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pesan, setPesan] = useState(null)
  const [loading, setLoading] = useState(false)

  // Kalau user sampai di sini lewat link undangan, simpan tujuannya supaya
  // setelah berhasil masuk dia langsung dibawa kembali ke halaman undangan.
  const next = params.get('next')

  if (user) return <Navigate to={next || '/dashboard'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setPesan(null)

    // Disaring lebih dulu supaya salah ketik yang jelas tidak perlu
    // menunggu jawaban server.
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

  return (
    <AuthLayout
      title="Masuk"
      subtitle={isMock ? 'Mode preview. Belum tersambung ke server, sesi hanya disimpan di browser ini.' : 'Lanjutkan ke ruang kerja tim kamu.'}
      footer={
        <>
          Belum punya akun?{' '}
          <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            Daftar gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          autoComplete="email"
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          autoComplete="current-password"
          required
          style={{ marginBottom: 18 }}
        />

        <PesanAuth pesan={pesan} />

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </AuthLayout>
  )
}
