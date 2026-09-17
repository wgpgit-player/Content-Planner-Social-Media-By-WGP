import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { PILLAR_TEMPLATES, PILLAR_COLOR_CHOICES } from '../config/pillarTemplates'
import Icon from '../components/Icon'

// Wizard pembuatan workspace, 3 langkah:
//   1. Nama brand      → jadi nama workspace + slug (dibuat otomatis di server)
//   2. Template pillar → titik awal content pillar, bukan lagi hardcode
//   3. Warna aksen     → tampilan white-label langsung terasa sejak awal
//
// Semuanya dikirim dalam satu panggilan RPC create_tenant_for_current_user().
// Harus lewat RPC karena tabel tenants sengaja tidak punya policy INSERT:
// saat baris tenant dibuat, user belum jadi anggota tenant manapun, jadi RLS
// pasti menolak kalau insert-nya lewat jalur biasa dari client.
//
// Logo tidak diminta di sini — file upload di langkah pertama akan menambah
// gesekan, dan bucket storage-nya per-tenant (butuh tenant_id yang baru ada
// setelah workspace jadi). Logo diatur belakangan di halaman Pengaturan.

const STEPS = ['Brand', 'Pillar', 'Warna']
const NAME_MAX = 60

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= current ? 'var(--accent)' : 'var(--surface-1)',
                color: i <= current ? 'var(--accent-text)' : 'var(--text-muted)',
                border: i <= current ? 'none' : '0.5px solid var(--border-strong)',
              }}
            >
              {i < current ? <Icon name="checkmark-outline" size={12} /> : i + 1}
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: i <= current ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div style={{ width: 22, height: '0.5px', background: 'var(--border-strong)' }} />}
        </div>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tenants, reloadTenants, switchTenant } = useTenantContext()

  // ?new=1 dipakai TenantSwitcher untuk membuat workspace tambahan. Tanpa itu,
  // halaman ini adalah onboarding pertama kali.
  const isAdditional = params.get('new') === '1' || tenants.length > 0

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [templateKey, setTemplateKey] = useState('general')
  const [accent, setAccent] = useState('#6B5EE0')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const template = PILLAR_TEMPLATES.find((t) => t.key === templateKey) ?? PILLAR_TEMPLATES[0]
  // Batas 60 karakter mengikuti constraint di database. Tanpa batas, satu
  // nama panjang merusak tata letak sidebar untuk semua anggota workspace.
  const trimmedName = name.trim()
  const canContinue = step !== 0 || (trimmedName.length >= 2 && trimmedName.length <= NAME_MAX)

  async function handleFinish() {
    setError('')

    if (!supabase) {
      setError('Belum tersambung ke server. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dulu.')
      return
    }

    setSaving(true)
    const { data, error: rpcErr } = await supabase.rpc('create_tenant_for_current_user', {
      p_name: name.trim(),
      p_brand_color: accent,
      p_pillars: template.pillars,
    })
    setSaving(false)

    if (rpcErr) {
      setError(rpcErr.message || 'Gagal membuat workspace.')
      return
    }

    await reloadTenants()
    if (data) switchTenant(data)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 30 }}>
        <StepDots current={step} />

        {step === 0 && (
          <>
            <p className="page-title" style={{ marginBottom: 5 }}>
              {isAdditional ? 'Workspace baru' : 'Selamat datang'}
            </p>
            <p className="page-subtitle" style={{ marginBottom: 22 }}>
              Kasih nama workspace ini — biasanya nama brand, perusahaan, atau klien yang kontennya kamu kelola.
            </p>

            <label className="field-label" htmlFor="ws-name">Nama brand atau workspace</label>
            <input
              id="ws-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Studio Kopi Senja"
              autoFocus
              maxLength={NAME_MAX}
              onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) setStep(1) }}
            />
            <p className="field-hint">
              Bisa diganti kapan saja di halaman Pengaturan.
              {trimmedName.length > NAME_MAX - 15 && ` Sisa ${NAME_MAX - trimmedName.length} karakter.`}
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <p className="page-title" style={{ marginBottom: 5 }}>Pilih titik awal content pillar</p>
            <p className="page-subtitle" style={{ marginBottom: 18 }}>
              Ini cuma kerangka awal — pillar bisa ditambah, diubah, atau dihapus kapan saja.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
              {PILLAR_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`option-card${templateKey === t.key ? ' selected' : ''}`}
                  onClick={() => setTemplateKey(t.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                    <Icon name={t.icon} size={17} color={templateKey === t.key ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{t.label}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{t.description}</p>
                      {t.pillars.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {t.pillars.map((p) => (
                            <span
                              key={p.name}
                              style={{
                                fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                                background: 'var(--surface-1)', color: 'var(--text-secondary)',
                                border: '0.5px solid var(--border)',
                              }}
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="page-title" style={{ marginBottom: 5 }}>Warna brand</p>
            <p className="page-subtitle" style={{ marginBottom: 20 }}>
              Warna ini dipakai di seluruh tampilan workspace kamu.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, marginBottom: 18 }}>
              {PILLAR_COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Pilih warna ${c}`}
                  className={`color-dot${accent === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAccent(c)}
                />
              ))}
            </div>

            <label className="field-label" htmlFor="ws-color">Atau masukkan kode warna sendiri</label>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              <input
                id="ws-color"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                style={{ width: 44, height: 38, padding: 2, border: '0.5px solid var(--border-strong)', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer' }}
              />
              <input
                className="input"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="#6B5EE0"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              />
            </div>

            <div
              style={{
                marginTop: 20, padding: 15, borderRadius: 12,
                background: 'var(--surface-1)', border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 11,
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 9, background: accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14,
                }}
              >
                {(name.trim() || 'W').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{name.trim() || 'Workspace kamu'}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {template.pillars.length > 0 ? `${template.pillars.length} content pillar` : 'Tanpa pillar awal'}
                </p>
              </div>
            </div>
          </>
        )}

        {error && <p className="alert alert-error" style={{ marginTop: 18 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 9, marginTop: 24 }}>
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              <Icon name="chevron-back-outline" size={14} /> Kembali
            </button>
          )}
          {isAdditional && step === 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
              Batal
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                Lanjut <Icon name="chevron-forward-outline" size={14} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleFinish} disabled={saving}>
                {saving ? 'Membuat...' : 'Buat workspace'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
