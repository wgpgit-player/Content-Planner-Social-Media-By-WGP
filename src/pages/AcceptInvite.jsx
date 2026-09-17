import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AuthLayout from '../components/AuthLayout'
import Icon from '../components/Icon'

// Halaman tujuan link undangan. Sengaja bisa dibuka tanpa login: penerima
// undangan biasanya belum punya akun, jadi dia perlu melihat dulu diundang ke
// workspace apa sebelum memutuskan mendaftar.
//
// Detail undangan dibaca lewat RPC invite_preview() yang SECURITY DEFINER —
// tabel tenant_invites sendiri hanya bisa dibaca admin workspace terkait.
// Token di URL yang berperan sebagai rahasianya.

const ROLE_LABEL = { admin: 'Admin', staff: 'Staff' }

export default function AcceptInvite() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { reloadTenants, switchTenant } = useTenantContext()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!supabase) { setError('Aplikasi belum tersambung ke server.'); setLoading(false); return }

    supabase.rpc('invite_preview', { p_token: token }).then(({ data, error: err }) => {
      if (err) setError(err.message)
      else if (!data || data.length === 0) setError('Undangan tidak ditemukan. Mungkin linknya salah ketik.')
      else if (!data[0].is_valid) setError('Undangan ini sudah kedaluwarsa atau dibatalkan.')
      else setInvite(data[0])
      setLoading(false)
    })
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError('')

    const { data, error: err } = await supabase.rpc('accept_invite', { p_token: token })
    setAccepting(false)

    if (err) {
      setError(err.message || 'Gagal menerima undangan.')
      return
    }

    await reloadTenants()
    if (data) switchTenant(data)
    navigate('/')
  }

  if (loading || authLoading) {
    return <AuthLayout title="Membuka undangan..."><p className="page-subtitle">Sebentar ya.</p></AuthLayout>
  }

  if (error && !invite) {
    return (
      <AuthLayout title="Undangan tidak berlaku">
        <p className="alert alert-error" style={{ marginBottom: 16 }}>{error}</p>
        <Link to="/login" className="btn btn-block" style={{ textDecoration: 'none' }}>Ke halaman masuk</Link>
      </AuthLayout>
    )
  }

  const nextPath = `/invite/${token}`

  return (
    <AuthLayout
      title="Kamu diundang"
      subtitle={`Bergabung ke workspace ${invite.tenant_name} sebagai ${ROLE_LABEL[invite.invite_role] ?? invite.invite_role}.`}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 18,
          background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0,
          }}
        >
          {invite.tenant_name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600 }}>{invite.tenant_name}</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Undangan untuk {invite.invite_email}</p>
        </div>
      </div>

      {error && <p className="alert alert-error" style={{ marginBottom: 14 }}>{error}</p>}

      {user ? (
        <>
          {user.email?.toLowerCase() !== invite.invite_email?.toLowerCase() && (
            <p className="alert alert-info" style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
              <Icon name="information-circle-outline" size={15} style={{ marginTop: 1 }} />
              <span>
                Kamu masuk sebagai <strong>{user.email}</strong>, sedangkan undangan ini ditujukan ke{' '}
                <strong>{invite.invite_email}</strong>. Kamu tetap bisa menerimanya dengan akun ini.
              </span>
            </p>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={handleAccept} disabled={accepting}>
            {accepting ? 'Memproses...' : 'Terima undangan'}
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Masuk atau buat akun dulu untuk menerima undangan ini.
          </p>
          <Link
            to={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="btn btn-primary btn-block"
            style={{ textDecoration: 'none' }}
          >
            Buat akun
          </Link>
          <Link
            to={`/login?next=${encodeURIComponent(nextPath)}`}
            className="btn btn-block"
            style={{ textDecoration: 'none' }}
          >
            Sudah punya akun
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
