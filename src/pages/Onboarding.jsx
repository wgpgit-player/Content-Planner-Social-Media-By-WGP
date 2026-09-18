import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { PILLAR_TEMPLATES, PILLAR_COLOR_CHOICES } from '../config/pillarTemplates'
import Icon from '../components/Icon'

// Wizard pembuatan ruang kerja.
//
// KAPAN LAYAR INI MUNCUL
// Hanya ketika akun belum punya ruang kerja sama sekali, atau ketika pengguna
// sengaja membuat ruang kerja tambahan lewat menu di sidebar. Setelah satu
// ruang kerja jadi, login berikutnya langsung ke dashboard dan layar ini tidak
// pernah muncul lagi. Pengaturan yang dipilih di sini tersimpan permanen di
// tabel tenants, bukan ditanyakan ulang.
//
// DUA MASALAH YANG DIPERBAIKI DI SINI
//
// 1. Isian hilang kalau ditinggal. Seseorang yang berhenti di langkah kedua
//    lalu menutup tab akan kembali ke formulir kosong, dan karena ruang
//    kerjanya belum jadi, layar ini menyambutnya lagi setiap login. Sekarang
//    isian disimpan sementara di browser dan dipulihkan saat ia kembali.
//
// 2. Tiga langkah terasa seperti penghalang. Padahal hanya nama yang benar
//    benar wajib; pillar dan warna punya nilai bawaan yang masuk akal dan bisa
//    diubah kapan saja di halaman Pengaturan. Jadi sejak langkah pertama sudah
//    tersedia jalan pintas untuk langsung membuat ruang kerjanya.

const STEPS = ['Brand', 'Pillar', 'Warna']
const NAME_MAX = 60
const WARNA_BAWAAN = '#6B5EE0'

// Kunci penyimpanan dibuat per akun supaya draf satu orang tidak terbawa ke
// akun lain yang memakai komputer yang sama.
function kunciDraf(userId) {
  return `plannersm-onboarding-draft-${userId ?? 'anon'}`
}

function StepDots({ current, onPilih }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => i < current && onPilih(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: 'none',
              background: 'transparent', padding: 0, fontFamily: 'inherit',
              cursor: i < current ? 'pointer' : 'default',
            }}
          >
            <span
              style={{
                width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= current ? 'var(--accent)' : 'var(--surface-1)',
                color: i <= current ? 'var(--accent-text)' : 'var(--text-muted)',
                border: i <= current ? 'none' : '0.5px solid var(--border-strong)',
              }}
            >
              {i < current ? <Icon name="checkmark-outline" size={12} /> : i + 1}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: i <= current ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </span>
          </button>
          {i < STEPS.length - 1 && <div style={{ width: 22, height: '0.5px', background: 'var(--border-strong)' }} />}
        </div>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { tenants, reloadTenants, switchTenant, loading: tenantLoading } = useTenantContext()

  // Diminta secara sadar lewat menu "Ruang kerja baru" di sidebar.
  const sengajaBuatBaru = params.get('new') === '1'
  const tambahan = sengajaBuatBaru || tenants.length > 0

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [templateKey, setTemplateKey] = useState('general')
  const [accent, setAccent] = useState(WARNA_BAWAAN)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [drafDipulihkan, setDrafDipulihkan] = useState(false)

  // Pulihkan draf yang tertinggal.
  useEffect(() => {
    if (!user) return
    try {
      const mentah = localStorage.getItem(kunciDraf(user.id))
      if (!mentah) return
      const d = JSON.parse(mentah)
      if (d.name) setName(d.name)
      if (d.templateKey) setTemplateKey(d.templateKey)
      if (d.accent) setAccent(d.accent)
      if (typeof d.step === 'number') setStep(Math.min(d.step, STEPS.length - 1))
      if (d.name) setDrafDipulihkan(true)
    } catch {
      // Draf rusak tidak boleh menghalangi orang membuat ruang kerja.
    }
  }, [user])

  // Simpan setiap perubahan, supaya menutup tab tidak menghapus pekerjaan.
  useEffect(() => {
    if (!user) return
    try {
      localStorage.setItem(kunciDraf(user.id), JSON.stringify({ name, templateKey, accent, step }))
    } catch {
      // Penyimpanan penuh atau diblokir. Bukan alasan untuk menghentikan alur.
    }
  }, [user, name, templateKey, accent, step])

  const template = PILLAR_TEMPLATES.find((t) => t.key === templateKey) ?? PILLAR_TEMPLATES[0]
  const namaBersih = name.trim()
  const namaValid = namaBersih.length >= 2 && namaBersih.length <= NAME_MAX

  // Lapis pengaman kedua. Kalau seseorang sampai di halaman ini padahal sudah
  // punya ruang kerja dan tidak sedang sengaja membuat yang baru, ia dipulangkan
  // ke dashboard. Tanpa ini, satu kesalahan pengalihan saja sudah cukup untuk
  // melahirkan ruang kerja duplikat, dan itu pernah benar-benar terjadi.
  if (tenantLoading) {
    return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
  }
  if (!sengajaBuatBaru && tenants.length > 0) {
    return <Navigate to="/dashboard" replace />
  }

  async function buatWorkspace() {
    setError('')

    if (!namaValid) {
      setError('Nama ruang kerja minimal 2 karakter.')
      setStep(0)
      return
    }
    if (!supabase) {
      setError('Belum tersambung ke server.')
      return
    }

    setSaving(true)
    const { data, error: rpcErr } = await supabase.rpc('create_tenant_for_current_user', {
      p_name: namaBersih,
      p_brand_color: accent,
      p_pillars: template.pillars,
    })
    setSaving(false)

    if (rpcErr) {
      setError(rpcErr.message || 'Gagal membuat ruang kerja.')
      return
    }

    // Draf tidak diperlukan lagi begitu ruang kerjanya benar-benar ada.
    try { localStorage.removeItem(kunciDraf(user?.id)) } catch { /* abaikan */ }

    await reloadTenants()
    if (data) switchTenant(data)
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 30 }}>
        <StepDots current={step} onPilih={setStep} />

        {drafDipulihkan && step === 0 && (
          <p className="alert alert-info" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <Icon name="refresh-outline" size={15} style={{ marginTop: 1 }} />
            <span>Isian terakhir kamu dipulihkan. Lanjutkan saja dari sini.</span>
          </p>
        )}

        {step === 0 && (
          <>
            <p className="page-title" style={{ marginBottom: 5 }}>
              {tambahan ? 'Ruang kerja baru' : 'Satu langkah sebelum mulai'}
            </p>
            <p className="page-subtitle" style={{ marginBottom: 22 }}>
              Beri nama ruang kerja ini. Biasanya nama brand, perusahaan, atau klien yang kontennya kamu kelola.
            </p>

            <label className="field-label" htmlFor="ws-name">Nama brand atau ruang kerja</label>
            <input
              id="ws-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Studio Kopi Senja"
              autoFocus
              maxLength={NAME_MAX}
              onKeyDown={(e) => { if (e.key === 'Enter' && namaValid) buatWorkspace() }}
            />
            <p className="field-hint">
              Ditanyakan sekali saja. Semua pengaturan di sini bisa diubah kapan saja di halaman Pengaturan.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <p className="page-title" style={{ marginBottom: 5 }}>Pilih titik awal content pillar</p>
            <p className="page-subtitle" style={{ marginBottom: 18 }}>
              Ini hanya kerangka awal. Pillar bisa ditambah, diubah, atau dihapus kapan saja.
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
              Warna ini dipakai di seluruh tampilan ruang kerja kamu.
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
                value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : WARNA_BAWAAN}
                onChange={(e) => setAccent(e.target.value)}
                style={{ width: 44, height: 38, padding: 2, border: '0.5px solid var(--border-strong)', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer' }}
              />
              <input
                className="input"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder={WARNA_BAWAAN}
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
                {(namaBersih || 'W').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{namaBersih || 'Ruang kerja kamu'}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {template.pillars.length > 0 ? `${template.pillars.length} content pillar` : 'Tanpa pillar awal'}
                </p>
              </div>
            </div>
          </>
        )}

        {error && <p className="alert alert-error" style={{ marginTop: 18 }}>{error}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 24, flexWrap: 'wrap' }}>
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              <Icon name="chevron-back-outline" size={14} /> Kembali
            </button>
          )}
          {tambahan && step === 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')} disabled={saving}>
              Batal
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
            {step < STEPS.length - 1 ? (
              <>
                {/* Jalan pintas: nama sudah cukup untuk membuat ruang kerja.
                    Pillar dan warna memakai nilai bawaan yang bisa diubah nanti. */}
                <button
                  type="button"
                  className="btn"
                  onClick={buatWorkspace}
                  disabled={!namaValid || saving}
                  title="Pakai pilihan bawaan, atur detailnya nanti"
                >
                  {saving ? 'Membuat...' : 'Buat sekarang'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!namaValid || saving}
                >
                  Atur detail <Icon name="chevron-forward-outline" size={14} />
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={buatWorkspace} disabled={saving}>
                {saving ? 'Membuat...' : 'Buat ruang kerja'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
