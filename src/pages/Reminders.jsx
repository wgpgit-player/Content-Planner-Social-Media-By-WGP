import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { alasanTidakBisa, nyalakanPengingat, matikanPengingat, sedangBerlangganan } from '../lib/push'
import { sedangTerpasang } from '../lib/pwa'

// Pengingat jam tayang.
//
// Ini pengganti auto-posting, bukan auto-posting. Perbedaannya penting dan
// dinyatakan terang-terangan di halaman ini: aplikasi tidak mengunggah
// apa pun ke Instagram atau TikTok — ia mengingatkan pada jam tayang, dan
// penggunanya yang memposting. Menjanjikan lebih dari itu akan membuat
// orang berhenti memeriksa, lalu kehilangan jadwal tanpa tahu penyebabnya.
//
// Halaman ini terbuka untuk semua anggota, bukan admin saja, karena yang
// paling butuh diingatkan justru orang yang mengerjakan kontennya.

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function waktuSingkat(ts) {
  if (!ts) return 'belum pernah'
  const d = new Date(ts)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Reminders() {
  const { user } = useAuth()
  const { tenantId, tenant } = useTenantContext()

  const [aktif, setAktif] = useState(false)
  const [perangkat, setPerangkat] = useState([])
  const [loading, setLoading] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState(null)

  const halangan = alasanTidakBisa()
  const terpasang = sedangTerpasang()

  const muat = useCallback(async () => {
    if (!supabase || !tenantId || !user) { setLoading(false); return }
    setLoading(true)

    const [langgananIni, { data }] = await Promise.all([
      sedangBerlangganan(tenantId, user.id).catch(() => false),
      supabase
        .from('push_subscriptions')
        .select('id,label,created_at,last_success_at,failure_count')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setAktif(langgananIni)
    setPerangkat(data ?? [])
    setLoading(false)
  }, [tenantId, user])

  useEffect(() => { muat() }, [muat])

  async function nyalakan() {
    setSibuk(true)
    setPesan(null)
    const { error } = await nyalakanPengingat(tenantId, user.id)
    setSibuk(false)

    if (error) { setPesan({ tipe: 'error', teks: error }); return }
    setPesan({ tipe: 'sukses', teks: 'Pengingat dinyalakan untuk perangkat ini.' })
    await muat()
  }

  async function matikan() {
    setSibuk(true)
    setPesan(null)
    const { error } = await matikanPengingat(tenantId, user.id)
    setSibuk(false)

    if (error) { setPesan({ tipe: 'error', teks: error }); return }
    setPesan({ tipe: 'info', teks: 'Pengingat dimatikan untuk perangkat ini.' })
    await muat()
  }

  async function lupakanPerangkat(id) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) { setPesan({ tipe: 'error', teks: error.message }); return }
    await muat()
  }

  return (
    <AppShell
      title="Pengingat"
      description="Notifikasi di jam tayang, supaya jadwal tidak lewat begitu saja."
      maxWidth={720}
    >
      {pesan && (
        <p className={`alert alert-${pesan.tipe === 'error' ? 'error' : pesan.tipe === 'sukses' ? 'success' : 'info'}`}
           style={{ marginBottom: 14 }}>
          {pesan.teks}
        </p>
      )}

      {/* Dinyatakan lebih dulu, sebelum tombolnya, supaya tidak ada yang
          menyalakan ini sambil mengira kontennya akan terbit sendiri. */}
      <div className="card" style={{ marginBottom: 14, background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <Icon name="information-circle-outline" size={17} color="var(--text-secondary)" />
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
              Ini pengingat, bukan posting otomatis
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              plannersm.co tidak mengunggah apa pun ke Instagram, TikTok, atau
              platform mana pun. Yang dilakukan fitur ini adalah mengirim
              notifikasi pada jam tayang konten yang ditugaskan ke kamu,
              lengkap dengan judulnya, dan kamu yang memposting. Posting
              otomatis butuh izin resmi dari Meta dan TikTok yang belum kami
              punya.
            </p>
          </div>
        </div>
      </div>

      {halangan ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <Icon name="alert-circle-outline" size={18} color="var(--warning)" />
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                Belum bisa dinyalakan di sini
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {halangan}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: aktif ? 'var(--success-bg)' : 'var(--surface-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon
                name={aktif ? 'notifications' : 'notifications-off-outline'}
                size={19}
                color={aktif ? 'var(--success)' : 'var(--text-muted)'}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                {aktif ? 'Pengingat aktif di perangkat ini' : 'Pengingat belum aktif di perangkat ini'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Berlaku untuk workspace {tenant?.name ?? 'ini'} saja.
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memeriksa...</p>
          ) : aktif ? (
            <button type="button" className="btn" onClick={matikan} disabled={sibuk}>
              {sibuk ? 'Memproses...' : 'Matikan pengingat'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={nyalakan} disabled={sibuk}>
              <Icon name="notifications-outline" size={15} />
              {sibuk ? 'Memproses...' : 'Nyalakan pengingat'}
            </button>
          )}
        </div>
      )}

      {!terpasang && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <Icon name="phone-portrait-outline" size={17} color="var(--accent)" />
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Pasang ke layar utama supaya lebih andal
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Di iPhone, notifikasi hanya bekerja setelah aplikasi ini dipasang
                ke layar utama — di dalam tab Safari biasa Apple tidak
                mengizinkannya. Buka menu Bagikan, lalu pilih “Tambahkan ke Layar
                Utama”. Di Android dan komputer, cari opsi “Instal aplikasi” di
                menu peramban.
              </p>
            </div>
          </div>
        </div>
      )}

      {perangkat.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>Perangkat yang berlangganan</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Hanya kamu yang bisa melihat dan menghapus daftar ini.
          </p>

          {perangkat.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderTop: '0.5px solid var(--border)',
              }}
            >
              <Icon name="hardware-chip-outline" size={16} color="var(--text-muted)" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12.5 }}>{p.label ?? 'Perangkat tanpa nama'}</p>
                <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  Terakhir menerima: {waktuSingkat(p.last_success_at)}
                  {p.failure_count > 0 && ` · ${p.failure_count} kali gagal`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => lupakanPerangkat(p.id)}
                style={{ color: 'var(--text-muted)' }}
                aria-label="Lupakan perangkat ini"
              >
                <Icon name="trash-outline" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Kapan pengingat dikirim</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
          <li>Konten punya tanggal <strong>dan</strong> jam tayang</li>
          <li>Konten ditugaskan ke kamu</li>
          <li>Statusnya belum “Sudah tayang”</li>
        </ul>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.65 }}>
          Konten tanpa jam tayang tidak diingatkan, karena tidak ada waktu yang
          bisa dituju. Atur jamnya di <Link to="/content-calendar" style={{ color: 'var(--accent)' }}>Content calendar</Link> atau
          di halaman brief masing-masing.
        </p>
      </div>
    </AppShell>
  )
}
