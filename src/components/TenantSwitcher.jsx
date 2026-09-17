import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenantContext } from '../context/TenantContext'
import Icon from './Icon'

// Pemilih workspace di kepala sidebar. Menampilkan logo + nama brand tenant
// yang sedang aktif — inilah bagian paling terlihat dari sifat white-label
// aplikasi ini: yang muncul adalah merek penggunanya, bukan merek kita.
//
// Kalau user cuma anggota satu workspace, tombolnya tidak bisa diklik dan
// tanda panahnya disembunyikan supaya tidak menimbulkan kesan ada menu
// tersembunyi yang sebetulnya kosong.

function TenantAvatar({ tenant, size = 26 }) {
  if (tenant?.logo_url) {
    return (
      <img
        src={tenant.logo_url}
        alt=""
        style={{ width: size, height: size, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 7, flexShrink: 0,
        background: 'var(--accent)', color: 'var(--accent-text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 600,
      }}
    >
      {(tenant?.name ?? '?').trim().charAt(0).toUpperCase()}
    </div>
  )
}

export default function TenantSwitcher() {
  const { tenant, tenants, switchTenant } = useTenantContext()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Tutup dropdown saat klik di luar area komponen.
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const multi = tenants.length > 1

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => multi && setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, width: '100%',
          background: 'transparent', border: 'none', padding: '2px 4px',
          cursor: multi ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <TenantAvatar tenant={tenant} />
        <span
          style={{
            fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {tenant?.name ?? 'Content Planner'}
        </span>
        {multi && (
          <Icon name="chevron-expand-outline" size={13} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 40,
            background: 'var(--surface-2)', border: '0.5px solid var(--border-strong)',
            borderRadius: 11, boxShadow: 'var(--shadow-md)', padding: 5,
          }}
        >
          <p className="sidebar-group-label" style={{ margin: '4px 0 4px' }}>WORKSPACE</p>
          {tenants.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { switchTenant(t.id); setOpen(false); navigate('/') }}
              className="sidebar-item"
              style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
            >
              <TenantAvatar tenant={t} size={20} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
              {t.id === tenant?.id && (
                <Icon name="checkmark-outline" size={14} color="var(--accent)" style={{ marginLeft: 'auto' }} />
              )}
            </button>
          ))}

          <div className="divider" style={{ margin: '5px 0' }} />
          <button
            type="button"
            onClick={() => { setOpen(false); navigate('/onboarding?new=1') }}
            className="sidebar-item"
            style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'inherit' }}
          >
            <Icon name="add-outline" size={16} />
            <span>Workspace baru</span>
          </button>
        </div>
      )}
    </div>
  )
}

export { TenantAvatar }
