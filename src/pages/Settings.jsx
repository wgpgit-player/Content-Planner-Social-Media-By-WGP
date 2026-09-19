import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { PILLAR_COLOR_CHOICES } from '../config/pillarTemplates'
import { PLATFORMS } from '../config/platforms'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Sama dengan constraint tenants_name_length_check di database.
const NAME_MAX = 60

// Halaman pengaturan workspace — bagian white-label yang paling terlihat.
// Semua yang diatur di sini disimpan di baris tabel `tenants` milik workspace
// aktif, jadi tiap tenant punya tampilannya sendiri.
//
// Hanya admin yang bisa menyimpan. Bukan cuma disembunyikan di UI: policy
// `tenants_update_admin` di database juga menolak UPDATE dari non-admin, jadi
// tombol yang disembunyikan di sini adalah kenyamanan, bukan satu-satunya
// pengaman.

// Gambar di-upload ke bucket publik `branding` dengan prefiks folder tenant_id.
// Policy RLS di storage.objects mencocokkan folder pertama path dengan daftar
// tenant milik user, jadi tenant lain tidak bisa menimpa file ini.
async function uploadBrandingFile(tenantId, file, basename) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${tenantId}/${basename}.${ext}`

  const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('branding').getPublicUrl(path)
  // Query string waktu dipakai memaksa browser mengambil ulang gambar setelah
  // di-upload ulang dengan nama file yang sama.
  return `${data.publicUrl}?t=${Date.now()}`
}

function Section({ title, description, children }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: description ? 3 : 14 }}>{title}</p>
      {description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>{description}</p>}
      {children}
    </div>
  )
}

// Tab "Akun sosial" — diadaptasi dari tab "Your Brands" di Settings Plann.
//
// INI BELUM MENYAMBUNG KE AKUN SUNGGUHAN. Menekan "Hubungkan" hanya mencatat
// niat tersambung di tabel social_accounts (lihat migrasi
// akun_sosial_placeholder) supaya tim bisa melihat platform mana yang sudah
// direncanakan dipakai. OAuth sungguhan ke tiap platform mensyaratkan aplikasi
// developer terdaftar dan verifikasi bisnis yang hanya bisa dilakukan pemilik
// akunnya sendiri — itu keputusan yang sudah disepakati untuk ditunda
// ("UI dulu saja"), bukan sesuatu yang lupa dikerjakan.
function TabAkunSosial({ tenantId }) {
  const [akun, setAkun] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState(null)

  useEffect(() => {
    if (!supabase || !tenantId) { setLoading(false); return }
    let batal = false
    supabase
      .from('social_accounts')
      .select('platform,status,label,connected_at')
      .eq('tenant_id', tenantId)
      .then(({ data }) => { if (!batal) { setAkun(data ?? []); setLoading(false) } })
    return () => { batal = true }
  }, [tenantId])

  function statusUntuk(key) {
    return akun.find((a) => a.platform === key)?.status ?? 'belum'
  }

  async function toggle(key) {
    if (!supabase || !tenantId) return
    const sedang = statusUntuk(key)
    const statusBaru = sedang === 'terhubung' ? 'belum' : 'terhubung'

    setBusyKey(key)
    const { error } = await supabase.from('social_accounts').upsert(
      {
        tenant_id: tenantId,
        platform: key,
        status: statusBaru,
        connected_at: statusBaru === 'terhubung' ? new Date().toISOString() : null,
      },
      { onConflict: 'tenant_id,platform' }
    )
    setBusyKey(null)
    if (error) return

    setAkun((prev) => {
      const tanpaIni = prev.filter((a) => a.platform !== key)
      return [...tanpaIni, { platform: key, status: statusBaru }]
    })
  }

  if (loading) return <p className="page-subtitle">Memuat...</p>

  return (
    <Section
      title="Akun sosial"
      description="Tandai platform yang dipakai workspace ini. Belum menyambung ke akun sungguhan — ini catatan rencana, bukan login OAuth."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PLATFORMS.map((p) => {
          const status = statusUntuk(p.key)
          const terhubung = status === 'terhubung'
          return (
            <div
              key={p.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px',
                borderBottom: '0.5px solid var(--border)',
              }}
            >
              <span
                style={{
                  width: 34, height: 34, borderRadius: 9, background: p.bg, color: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <Icon name={p.icon} size={17} />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</p>
                <p style={{ fontSize: 11, color: terhubung ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {terhubung ? 'Ditandai terhubung' : 'Belum terhubung'}
                </p>
              </div>
              <button
                type="button"
                className={`btn btn-sm${terhubung ? '' : ' btn-primary'}`}
                onClick={() => toggle(p.key)}
                disabled={busyKey === p.key}
              >
                {busyKey === p.key ? 'Menyimpan...' : terhubung ? 'Putuskan' : 'Hubungkan'}
              </button>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// Tab "Akun saya" — diadaptasi dari "YOUR INFORMATION" dan "SET PASSWORD" di
// Settings Plann. Nama disimpan lewat RPC update_my_name (lihat migrasi
// rpc_update_my_name) karena full_name tersimpan per baris tenant_members,
// bukan satu profil global, dan hanya admin yang boleh UPDATE baris anggota
// lain — RPC ini sengaja membatasi diri hanya menulis baris milik pemanggil
// sendiri, di semua workspace sekaligus, supaya namanya konsisten di mana pun.
function TabAkunSaya() {
  const { user } = useAuth()
  const { tenantId } = useTenantContext()
  const [nama, setNama] = useState('')
  const [busyNama, setBusyNama] = useState(false)
  const [pesanNama, setPesanNama] = useState(null)

  useEffect(() => {
    if (!supabase || !tenantId || !user?.id) return
    let batal = false
    supabase
      .from('tenant_members')
      .select('full_name')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!batal && data?.full_name) setNama(data.full_name) })
    return () => { batal = true }
  }, [tenantId, user?.id])

  const [sandiBaru, setSandiBaru] = useState('')
  const [sandiUlang, setSandiUlang] = useState('')
  const [busySandi, setBusySandi] = useState(false)
  const [pesanSandi, setPesanSandi] = useState(null)

  async function simpanNama() {
    const trimmed = nama.trim()
    if (trimmed.length < 2) { setPesanNama({ type: 'error', text: 'Nama minimal 2 karakter.' }); return }

    setBusyNama(true)
    setPesanNama(null)
    const { error } = await supabase.rpc('update_my_name', { p_full_name: trimmed })
    setBusyNama(false)

    if (error) { setPesanNama({ type: 'error', text: error.message }); return }
    setPesanNama({ type: 'success', text: 'Nama tersimpan. Mungkin perlu muat ulang halaman lain untuk melihatnya berubah.' })
  }

  async function gantiSandi() {
    if (sandiBaru.length < 6) { setPesanSandi({ type: 'error', text: 'Sandi minimal 6 karakter.' }); return }
    if (sandiBaru !== sandiUlang) { setPesanSandi({ type: 'error', text: 'Konfirmasi sandi tidak cocok.' }); return }

    setBusySandi(true)
    setPesanSandi(null)
    const { error } = await supabase.auth.updateUser({ password: sandiBaru })
    setBusySandi(false)

    if (error) { setPesanSandi({ type: 'error', text: error.message }); return }
    setSandiBaru('')
    setSandiUlang('')
    setPesanSandi({ type: 'success', text: 'Sandi berhasil diganti.' })
  }

  return (
    <>
      <Section title="Informasi kamu" description="Nama ini yang tampil sebagai penanggung jawab di brief dan kartu Kanban.">
        <label className="field-label" htmlFor="akun-email">Email</label>
        <input id="akun-email" className="input" value={user?.email ?? ''} disabled style={{ marginBottom: 12, opacity: 0.6 }} />

        <label className="field-label" htmlFor="akun-nama">Nama tampilan</label>
        <input
          id="akun-nama"
          className="input"
          value={nama}
          maxLength={80}
          placeholder="Nama kamu"
          onChange={(e) => setNama(e.target.value)}
        />

        {pesanNama && (
          <p className={`alert alert-${pesanNama.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 10 }}>
            {pesanNama.text}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={simpanNama} disabled={busyNama}>
            {busyNama ? 'Menyimpan...' : 'Simpan nama'}
          </button>
        </div>
      </Section>

      <Section title="Ganti sandi" description="Berlaku untuk masuk ke plannersm.co, bukan sandi email.">
        <label className="field-label" htmlFor="akun-sandi-baru">Sandi baru</label>
        <input
          id="akun-sandi-baru"
          type="password"
          className="input"
          value={sandiBaru}
          onChange={(e) => setSandiBaru(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <label className="field-label" htmlFor="akun-sandi-ulang">Ulangi sandi baru</label>
        <input
          id="akun-sandi-ulang"
          type="password"
          className="input"
          value={sandiUlang}
          onChange={(e) => setSandiUlang(e.target.value)}
        />

        {pesanSandi && (
          <p className={`alert alert-${pesanSandi.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 10 }}>
            {pesanSandi.text}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={gantiSandi} disabled={busySandi}>
            {busySandi ? 'Menyimpan...' : 'Ganti sandi'}
          </button>
        </div>
      </Section>
    </>
  )
}

const TABS = [
  { key: 'workspace', label: 'Ruang kerja', icon: 'business-outline' },
  { key: 'sosial', label: 'Akun sosial', icon: 'share-social-outline' },
  { key: 'saya', label: 'Akun saya', icon: 'person-circle-outline' },
]

export default function Settings() {
  const { tenant, tenantId, isAdmin, patchActiveTenant } = useTenantContext()
  const [searchParams] = useSearchParams()
  // Halaman lain (Composer, kartu ajakan di mockup telepon) menaut ke sini
  // dengan ?tab=sosial supaya langsung membuka tab yang relevan, bukan
  // selalu mendarat di "Ruang kerja". Dibaca sekali saat halaman terbuka.
  const [tab, setTab] = useState(() => {
    const dariUrl = searchParams.get('tab')
    return TABS.some((t) => t.key === dariUrl) ? dariUrl : 'workspace'
  })

  const [name, setName] = useState('')
  const [accent, setAccent] = useState('#6B5EE0')
  const [logoUrl, setLogoUrl] = useState(null)
  const [heroUrl, setHeroUrl] = useState(null)
  const [busy, setBusy] = useState(null) // 'logo' | 'hero' | 'save'
  const [message, setMessage] = useState(null) // { type, text }

  const logoInput = useRef(null)
  const heroInput = useRef(null)

  // Selaraskan form dengan workspace aktif — termasuk saat user berpindah
  // workspace lewat TenantSwitcher tanpa meninggalkan halaman ini.
  useEffect(() => {
    if (!tenant) return
    setName(tenant.name ?? '')
    setAccent(tenant.brand_color || '#6B5EE0')
    setLogoUrl(tenant.logo_url ?? null)
    setHeroUrl(tenant.hero_background_url ?? null)
    setMessage(null)
  }, [tenant?.id, tenant?.name, tenant?.brand_color, tenant?.logo_url, tenant?.hero_background_url])

  // Pratinjau langsung: warna diterapkan ke seluruh UI begitu dipilih, sebelum
  // disimpan, supaya user bisa menilai hasilnya di konteks aslinya.
  //
  // Fungsi pembersih penting di sini. Tanpa itu, warna yang dicoba-coba tapi
  // TIDAK jadi disimpan akan tetap menempel saat user pindah ke halaman lain,
  // seolah-olah perubahannya sudah tersimpan padahal belum.
  useEffect(() => {
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return
    document.documentElement.style.setProperty('--accent', accent)
    return () => {
      document.documentElement.style.setProperty('--accent', tenant?.brand_color || '#6B5EE0')
    }
  }, [accent, tenant?.brand_color])

  async function handleImage(kind, file) {
    if (!file || !tenantId || !supabase) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File harus berupa gambar.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran gambar maksimal 5 MB.' })
      return
    }

    setBusy(kind)
    setMessage(null)
    try {
      const url = await uploadBrandingFile(tenantId, file, kind)
      const column = kind === 'logo' ? 'logo_url' : 'hero_background_url'

      const { error } = await supabase.from('tenants').update({ [column]: url }).eq('id', tenantId)
      if (error) throw error

      if (kind === 'logo') setLogoUrl(url)
      else setHeroUrl(url)
      patchActiveTenant({ [column]: url })
      setMessage({ type: 'success', text: 'Gambar berhasil diperbarui.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal meng-upload gambar.' })
    } finally {
      setBusy(null)
    }
  }

  async function handleRemoveImage(kind) {
    if (!tenantId || !supabase) return
    const column = kind === 'logo' ? 'logo_url' : 'hero_background_url'

    setBusy(kind)
    const { error } = await supabase.from('tenants').update({ [column]: null }).eq('id', tenantId)
    setBusy(null)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    if (kind === 'logo') setLogoUrl(null)
    else setHeroUrl(null)
    patchActiveTenant({ [column]: null })
  }

  async function handleSave() {
    if (!tenantId || !supabase) return

    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setMessage({ type: 'error', text: 'Nama workspace minimal 2 karakter.' })
      return
    }
    if (trimmed.length > NAME_MAX) {
      setMessage({ type: 'error', text: `Nama workspace maksimal ${NAME_MAX} karakter.` })
      return
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
      setMessage({ type: 'error', text: 'Kode warna harus format heksadesimal, contoh #6B5EE0.' })
      return
    }

    setBusy('save')
    const { error } = await supabase
      .from('tenants')
      .update({ name: trimmed, brand_color: accent })
      .eq('id', tenantId)
    setBusy(null)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    patchActiveTenant({ name: trimmed, brand_color: accent })
    setMessage({ type: 'success', text: 'Pengaturan tersimpan.' })
  }

  if (!tenant) {
    return <AppShell title="Pengaturan"><p className="page-subtitle">Memuat workspace...</p></AppShell>
  }

  // Tab bar tampil untuk semua orang — "Akun sosial" dan "Akun saya" bukan
  // milik admin. Hanya ISI tab "Ruang kerja" yang dibatasi ke admin, sama
  // seperti sebelumnya.
  const tabBar = (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '0.5px solid var(--border)' }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTab(t.key)}
          className="row-link"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', border: 'none',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: -1,
          }}
        >
          <Icon name={t.icon} size={14} />
          {t.label}
        </button>
      ))}
    </div>
  )

  if (tab === 'sosial') {
    return (
      <AppShell title="Pengaturan" description="Kelola akun dan identitas workspace ini." maxWidth={680}>
        {tabBar}
        <TabAkunSosial tenantId={tenantId} />
      </AppShell>
    )
  }

  if (tab === 'saya') {
    return (
      <AppShell title="Pengaturan" description="Kelola akun dan identitas workspace ini." maxWidth={680}>
        {tabBar}
        <TabAkunSaya />
      </AppShell>
    )
  }

  if (!isAdmin) {
    return (
      <AppShell title="Pengaturan" description="Kelola akun dan identitas workspace ini." maxWidth={680}>
        {tabBar}
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Kamu terdaftar sebagai staff di workspace ini. Minta admin untuk mengubah nama, logo, atau warna brand.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Pengaturan"
      description="Kelola akun dan identitas workspace ini."
      maxWidth={680}
    >
      {tabBar}

      {message && (
        <p className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {message.text}
        </p>
      )}

      <Section title="Identitas" description="Nama yang tampil di sidebar dan di seluruh aplikasi untuk workspace ini.">
        <label className="field-label" htmlFor="set-name">Nama workspace</label>
        <input id="set-name" className="input" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} />
        <p className="field-hint">Alamat internal (slug) workspace tidak berubah meski nama diganti.</p>
      </Section>

      <Section title="Logo" description="Tampil di kepala sidebar. Bentuk persegi paling rapi, minimal 128x128 piksel.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo workspace" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '0.5px solid var(--border)' }} />
          ) : (
            <div
              style={{
                width: 52, height: 52, borderRadius: 12, background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 600,
              }}
            >
              {(name.trim() || 'W').charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => logoInput.current?.click()} disabled={busy === 'logo'}>
              <Icon name={busy === 'logo' ? 'reload-outline' : 'cloud-upload-outline'} className={busy === 'logo' ? 'spin' : undefined} size={14} />
              {logoUrl ? 'Ganti logo' : 'Unggah logo'}
            </button>
            {logoUrl && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveImage('logo')} disabled={busy === 'logo'}>
                Hapus
              </button>
            )}
          </div>

          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { handleImage('logo', e.target.files?.[0]); e.target.value = '' }}
          />
        </div>
      </Section>

      <Section title="Warna brand" description="Dipakai untuk tombol, menu aktif, dan penanda di seluruh workspace.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, marginBottom: 16 }}>
          {PILLAR_COLOR_CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Pilih warna ${c}`}
              className={`color-dot${accent.toLowerCase() === c.toLowerCase() ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setAccent(c)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <input
            type="color"
            aria-label="Pemilih warna"
            value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#6B5EE0'}
            onChange={(e) => setAccent(e.target.value)}
            style={{ width: 44, height: 38, padding: 2, border: '0.5px solid var(--border-strong)', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer' }}
          />
          <input
            className="input"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            placeholder="#6B5EE0"
            style={{ fontFamily: 'ui-monospace, monospace', maxWidth: 160 }}
          />
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Pratinjau langsung diterapkan.</span>
        </div>
      </Section>

      <Section title="Wallpaper dashboard" description="Gambar latar untuk kartu sapaan di dashboard. Opsional.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 108, height: 58, borderRadius: 11, border: '0.5px solid var(--border)',
              background: heroUrl ? `center/cover no-repeat url(${heroUrl})` : 'var(--surface-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {!heroUrl && <Icon name="image-outline" size={18} color="var(--text-muted)" />}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => heroInput.current?.click()} disabled={busy === 'hero'}>
              <Icon name={busy === 'hero' ? 'reload-outline' : 'cloud-upload-outline'} className={busy === 'hero' ? 'spin' : undefined} size={14} />
              {heroUrl ? 'Ganti wallpaper' : 'Unggah wallpaper'}
            </button>
            {heroUrl && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveImage('hero')} disabled={busy === 'hero'}>
                Hapus
              </button>
            )}
          </div>

          <input
            ref={heroInput}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { handleImage('hero', e.target.files?.[0]); e.target.value = '' }}
          />
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy === 'save'}>
          {busy === 'save' ? 'Menyimpan...' : 'Simpan perubahan'}
        </button>
      </div>
    </AppShell>
  )
}
