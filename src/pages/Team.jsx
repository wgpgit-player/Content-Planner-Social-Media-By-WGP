import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Halaman anggota tim: lihat siapa saja di workspace ini, atur perannya, dan
// undang orang baru.
//
// Undangan dibuat sebagai baris di tabel tenant_invites dengan token acak.
// Aplikasi ini belum mengirim email sendiri (butuh Edge Function + penyedia
// email), jadi untuk sekarang link undangannya disalin manual oleh admin dan
// dikirim lewat kanal apa pun. Penerima cukup membuka link itu.
//
// Dua peran yang ada:
//   admin — bisa mengubah branding workspace dan mengelola anggota
//   staff — bisa mengerjakan konten, tidak bisa mengubah pengaturan workspace

const ROLE_LABEL = { admin: 'Admin', staff: 'Staff' }

// Token dibuat di browser dengan crypto.getRandomValues (bukan Math.random,
// yang tidak aman untuk keperluan seperti ini).
function generateToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function RoleBadge({ role }) {
  const isAdminRole = role === 'admin'
  return (
    <span
      className="chip"
      style={{
        background: isAdminRole ? 'var(--accent-bg)' : 'var(--surface-1)',
        color: isAdminRole ? 'var(--accent)' : 'var(--text-secondary)',
        borderColor: 'transparent',
      }}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

export default function Team() {
  const { user } = useAuth()
  const { tenant, tenantId, isAdmin, reloadTenants } = useTenantContext()

  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const load = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)

    // Email anggota ada di auth.users yang tidak bisa dibaca client, jadi
    // daftarnya diambil lewat RPC list_tenant_members() yang SECURITY DEFINER
    // dan memverifikasi bahwa pemanggilnya memang anggota workspace ini.
    const [{ data: memberRows, error: memberErr }, inviteRes] = await Promise.all([
      supabase.rpc('list_tenant_members', { p_tenant_id: tenantId }),
      isAdmin
        ? supabase.from('tenant_invites').select('id,email,role,token,status,expires_at,created_at')
            .eq('tenant_id', tenantId).eq('status', 'pending').order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    if (memberErr) setMessage({ type: 'error', text: memberErr.message })
    setMembers(memberRows ?? [])
    setInvites(inviteRes.data ?? [])
    setLoading(false)
  }, [tenantId, isAdmin])

  useEffect(() => { load() }, [load])

  async function handleInvite(e) {
    e.preventDefault()
    setMessage(null)

    const email = inviteEmail.trim().toLowerCase()
    if (!email.includes('@')) {
      setMessage({ type: 'error', text: 'Masukkan alamat email yang valid.' })
      return
    }
    if (members.some((m) => m.email?.toLowerCase() === email)) {
      setMessage({ type: 'error', text: 'Orang ini sudah jadi anggota workspace.' })
      return
    }

    setCreating(true)
    const { error } = await supabase.from('tenant_invites').insert({
      tenant_id: tenantId,
      email,
      role: inviteRole,
      token: generateToken(),
      invited_by: user?.id ?? null,
    })
    setCreating(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setInviteEmail('')
    setMessage({ type: 'success', text: 'Undangan dibuat. Salin linknya dan kirim ke orangnya.' })
    load()
  }

  async function handleChangeRole(member, nextRole) {
    setMessage(null)
    const { error } = await supabase
      .from('tenant_members')
      .update({ role: nextRole })
      .eq('id', member.member_id)

    if (error) {
      // Termasuk pesan dari trigger yang mencegah admin terakhir diturunkan.
      setMessage({ type: 'error', text: error.message })
      return
    }
    load()
    reloadTenants()
  }

  async function handleRemove(member) {
    setMessage(null)
    const { error } = await supabase.from('tenant_members').delete().eq('id', member.member_id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    load()
    reloadTenants()
  }

  async function handleRevoke(invite) {
    const { error } = await supabase.from('tenant_invites').update({ status: 'revoked' }).eq('id', invite.id)
    if (error) setMessage({ type: 'error', text: error.message })
    else load()
  }

  async function copyInviteLink(invite) {
    const url = `${window.location.origin}/invite/${invite.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setMessage({ type: 'error', text: `Gagal menyalin otomatis. Link: ${url}` })
    }
  }

  if (loading) {
    return <AppShell title="Tim"><p className="page-subtitle">Memuat...</p></AppShell>
  }

  return (
    <AppShell
      title="Tim"
      description={`Anggota yang punya akses ke workspace ${tenant?.name ?? ''}.`}
      maxWidth={720}
    >
      {message && (
        <p className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {message.text}
        </p>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Anggota <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({members.length})</span>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m, i) => {
            const isSelf = m.user_id === user?.id
            return (
              <div
                key={m.member_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
                  borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {(m.full_name || m.email || '?').charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.full_name || m.email}
                    {isSelf && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (kamu)</span>}
                  </p>
                  {m.full_name && <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{m.email}</p>}
                </div>

                {isAdmin ? (
                  <>
                    <select
                      className="select"
                      value={m.role}
                      onChange={(e) => handleChangeRole(m, e.target.value)}
                      style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }}
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                    {!isSelf && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        title="Keluarkan dari workspace"
                        onClick={() => handleRemove(m)}
                      >
                        <Icon name="close-outline" size={15} />
                      </button>
                    )}
                  </>
                ) : (
                  <RoleBadge role={m.role} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Undang anggota</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Buat link undangan, lalu kirim sendiri ke orangnya. Link berlaku 7 hari.
            </p>

            <form onSubmit={handleInvite} style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 210 }}>
                <label className="field-label" htmlFor="invite-email">Email</label>
                <input
                  id="invite-email"
                  className="input"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rekan@perusahaan.com"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="invite-role">Peran</label>
                <select
                  id="invite-role"
                  className="select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Membuat...' : 'Buat undangan'}
              </button>
            </form>
          </div>

          {invites.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                Undangan menunggu <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({invites.length})</span>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {invites.map((inv, i) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0',
                      borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
                    }}
                  >
                    <Icon name="mail-outline" size={16} color="var(--text-muted)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.email}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {ROLE_LABEL[inv.role]} · berlaku sampai {new Date(inv.expires_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => copyInviteLink(inv)}>
                      <Icon name={copiedId === inv.id ? 'checkmark-outline' : 'copy-outline'} size={14} />
                      {copiedId === inv.id ? 'Tersalin' : 'Salin link'}
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost" title="Batalkan undangan" onClick={() => handleRevoke(inv)}>
                      <Icon name="close-outline" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
