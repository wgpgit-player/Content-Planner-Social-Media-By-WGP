import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantContext } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { TenantAvatar } from './TenantSwitcher'
import Sheet from './Sheet'
import Icon from './Icon'

/**
 * Mobile Topbar dengan Tombol Pemilih Workspace (Akun Kerja vs Akun Pribadi)
 * Tampil khusus di layar ponsel / PWA mobile.
 */
export default function MobileTenantBar() {
  const { tenant, tenants, switchTenant } = useTenantContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bukaSheet, setBukaSheet] = useState(false)

  const multi = tenants.length > 1

  function handlePilih(id) {
    switchTenant(id)
    setBukaSheet(false)
    navigate('/dashboard')
  }

  return (
    <>
      <div className="app-topbar">
        {/* Tombol Pemilih Workspace Mobile */}
        <button
          type="button"
          onClick={() => setBukaSheet(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: '3px 6px',
            borderRadius: 8,
            cursor: 'pointer',
            minWidth: 0,
            flex: 1,
            textAlign: 'left',
          }}
          title="Ketuk untuk mengganti ruang kerja (workspace)"
        >
          <TenantAvatar tenant={tenant} size={26} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="app-topbar-nama" style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                {tenant?.name ?? 'plannersm.co'}
              </span>
              <Icon name="chevron-down-outline" size={13} color="var(--text-muted)" />
            </div>
          </div>
        </button>

        {/* Tombol Shortcut Ganti Akun / Workspace di Kanan */}
        <button
          type="button"
          onClick={() => setBukaSheet(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 9px',
            borderRadius: 99,
            background: multi ? 'var(--accent-bg, rgba(99, 102, 241, 0.1))' : 'var(--surface-1)',
            border: '1px solid ' + (multi ? 'var(--accent)' : 'var(--border)'),
            color: multi ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 650,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="swap-horizontal-outline" size={13} />
          <span>{multi ? 'Ganti Akun' : 'Workspace'}</span>
        </button>
      </div>

      {/* Sheet Pemilih Workspace (Bottom Sheet Mobile) */}
      {bukaSheet && (
        <Sheet
          open
          onClose={() => setBukaSheet(false)}
          title="Pilih Ruang Kerja (Workspace)"
          description="Beralih antara akun pribadi, akun kantor/kerja, atau workspace tim."
          lebar={420}
        >
          <div style={{ padding: '4px 0 12px' }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: '0 0 10px 0',
              }}
            >
              DAFTAR WORKSPACE KAMU ({tenants.length})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tenants.map((t) => {
                const aktif = t.id === tenant?.id
                const roleLabel = t.role === 'admin' ? 'Admin' : t.role === 'staff' ? 'Staf' : 'Member'

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handlePilih(t.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: aktif ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: aktif ? 'var(--accent-bg, rgba(99, 102, 241, 0.08))' : 'var(--surface-1)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s ease',
                      boxShadow: aktif ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                    }}
                  >
                    <TenantAvatar tenant={t} size={36} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: aktif ? 700 : 600,
                          color: 'var(--text-primary)',
                          margin: '0 0 3px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: t.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: t.role === 'admin' ? 'var(--accent)' : 'var(--success)',
                          }}
                        >
                          {roleLabel}
                        </span>
                        {user?.email && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {user.email.split('@')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {aktif ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--accent)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <Icon name="checkmark-circle" size={18} />
                        <span>Aktif</span>
                      </div>
                    ) : (
                      <Icon name="chevron-forward-outline" size={16} color="var(--text-muted)" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Opsi Buat Workspace Baru (Kerja / Pribadi) */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => {
                  setBukaSheet(false)
                  navigate('/onboarding?new=1')
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px dashed var(--accent)',
                  background: 'var(--accent-bg, rgba(99, 102, 241, 0.05))',
                  color: 'var(--accent)',
                  fontWeight: 650,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Icon name="add-circle-outline" size={17} />
                <span>+ Buat Ruang Kerja Baru (Akun Kerja / Pribadi)</span>
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </>
  )
}
