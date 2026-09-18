import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Icon from '../components/Icon'
import Sheet from '../components/Sheet'
import { getPlatform } from '../config/platforms'
import { getApproval } from '../config/approval'
import { parseIsoDate } from '../lib/dates'

// Halaman yang dilihat klien, tanpa akun dan tanpa login.
//
// Semua data datang dari satu RPC, lihat_rencana_klien(), yang memeriksa
// token lalu memilih sendiri kolom mana yang boleh keluar. Halaman ini tidak
// pernah menyentuh tabel content_items secara langsung — itu penting, karena
// pengunjung di sini memakai peran anon yang tidak punya hak baca apa pun
// atas tabel itu. Kalau suatu saat halaman ini mencoba membaca tabel
// langsung, hasilnya kosong, bukan bocor.
//
// Nada halamannya sengaja berbeda dari aplikasi: ini dibaca oleh orang yang
// mungkin belum pernah memakai plannersm.co, jadi tidak ada istilah internal
// seperti "pillar" atau "status Kanban" tanpa penjelasan.

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatTanggalPanjang(iso) {
  if (!iso) return 'Belum dijadwalkan'
  const d = parseIsoDate(iso)
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

function formatRentang(mulai, selesai) {
  const a = parseIsoDate(mulai)
  const b = parseIsoDate(selesai)
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${BULAN[a.getMonth()]} ${a.getFullYear()}`
  }
  return `${a.getDate()} ${BULAN[a.getMonth()].slice(0, 3)} – ${b.getDate()} ${BULAN[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`
}

function KartuKonten({ item, bisaPutuskan, onPutuskan }) {
  const p = getPlatform(item.platform)
  const a = getApproval(item.approval_state)
  const [terbuka, setTerbuka] = useState(false)

  const adaIsi = item.brief || item.caption || item.key_message || item.cta || item.hashtags

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 11 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: p.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name={p.icon} size={19} color={p.color} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{item.title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {formatTanggalPanjang(item.scheduled_date)}
            {item.scheduled_time ? ` · ${item.scheduled_time.slice(0, 5)}` : ''}
          </p>

          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="chip" style={{ background: p.bg, color: p.color, borderColor: 'transparent' }}>
              {p.label}
            </span>
            {item.pillar && (
              <span
                className="chip"
                style={{
                  background: 'var(--surface-1)',
                  color: item.pillar_color || 'var(--text-secondary)',
                  borderColor: 'transparent',
                }}
              >
                {item.pillar}
              </span>
            )}
            <span className="chip" style={{ background: a.bg, color: a.color, borderColor: 'transparent' }}>
              <Icon name={a.icon} size={12} /> {a.label}
            </span>
          </div>
        </div>
      </div>

      {adaIsi && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setTerbuka((v) => !v)}
          style={{ marginTop: 10, paddingLeft: 0 }}
        >
          <Icon name={terbuka ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} />
          {terbuka ? 'Sembunyikan detail' : 'Lihat detail'}
        </button>
      )}

      {terbuka && (
        <div style={{ marginTop: 10, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
          {[
            ['Tentang konten ini', item.brief],
            ['Pesan utama', item.key_message],
            ['Draf caption', item.caption],
            ['Ajakan bertindak', item.cta],
            ['Hashtag', item.hashtags],
          ].filter(([, isi]) => isi).map(([judul, isi]) => (
            <div key={judul} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>
                {judul.toUpperCase()}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{isi}</p>
            </div>
          ))}
        </div>
      )}

      {bisaPutuskan && item.approval_state !== 'approved' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ color: 'var(--success)' }}
            onClick={() => onPutuskan(item, 'approved')}
          >
            <Icon name="checkmark-circle-outline" size={14} /> Setuju
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ color: 'var(--danger)' }}
            onClick={() => onPutuskan(item, 'changes_requested')}
          >
            <Icon name="chatbubble-ellipses-outline" size={14} /> Minta perbaikan
          </button>
        </div>
      )}
    </div>
  )
}

export default function ClientView() {
  const { token } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)

  // Nama diminta sekali lalu diingat selama halaman terbuka, supaya klien
  // tidak mengisi namanya berulang kali untuk sepuluh konten.
  const [nama, setNama] = useState('')
  const [keputusan, setKeputusan] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase) {
      setGalat('Aplikasi belum tersambung ke server.')
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: hasil, error } = await supabase.rpc('lihat_rencana_klien', { p_token: token })
    if (error) {
      setGalat(error.message)
      setData(null)
    } else {
      setData(hasil)
      setGalat(null)
    }
    setLoading(false)
  }, [token])

  useEffect(() => { muat() }, [muat])

  // Warna brand pemilik workspace dipakai di halaman ini, karena inilah
  // wajah agensi di depan kliennya. Dibersihkan saat halaman ditinggalkan
  // supaya tidak terbawa ke halaman lain.
  useEffect(() => {
    const warna = data?.workspace?.brand_color
    if (!warna) return
    const sebelumnya = document.documentElement.style.getPropertyValue('--accent')
    document.documentElement.style.setProperty('--accent', warna)
    return () => {
      if (sebelumnya) document.documentElement.style.setProperty('--accent', sebelumnya)
      else document.documentElement.style.removeProperty('--accent')
    }
  }, [data])

  async function kirimKeputusan(e) {
    e?.preventDefault()
    if (!keputusan || !nama.trim()) return

    setSibuk(true)
    const { error } = await supabase.rpc('putuskan_lewat_tautan', {
      p_token: token,
      p_content_item_id: keputusan.item.id,
      p_keputusan: keputusan.jenis,
      p_nama: nama.trim(),
      p_catatan: catatan.trim() || null,
    })
    setSibuk(false)

    if (error) {
      setPesan({ tipe: 'error', teks: error.message })
      setKeputusan(null)
      return
    }

    setPesan({
      tipe: 'sukses',
      teks: keputusan.jenis === 'approved'
        ? 'Terima kasih. Persetujuanmu sudah tercatat.'
        : 'Terima kasih. Permintaan perbaikanmu sudah dikirim ke tim.',
    })
    setKeputusan(null)
    setCatatan('')
    await muat()
  }

  if (loading) {
    return (
      <div className="klien-halaman">
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Membuka rencana...</p>
      </div>
    )
  }

  if (galat || !data) {
    return (
      <div className="klien-halaman">
        <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--warning-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name="link-outline" size={22} color="var(--warning)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Tautan ini tidak bisa dibuka</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {galat || 'Tautan tidak dikenali.'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
            Coba minta tautan baru dari orang yang mengirimkannya.
          </p>
        </div>
      </div>
    )
  }

  const konten = data.konten ?? []
  const disetujui = konten.filter((k) => k.approval_state === 'approved').length
  const perluDilihat = konten.filter((k) => k.approval_state !== 'approved').length

  return (
    <div className="klien-halaman">
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          {data.workspace?.logo_url ? (
            <img
              src={data.workspace.logo_url}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 40, height: 40, borderRadius: 11, background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 600, flexShrink: 0,
              }}
            >
              {(data.workspace?.nama ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {data.workspace?.nama}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Rencana konten {formatRentang(data.period_start, data.period_end)}
            </p>
          </div>
        </div>

        {pesan && (
          <p className={`alert alert-${pesan.tipe === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
            {pesan.teks}
          </p>
        )}

        {konten.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>Belum ada konten di rentang ini</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Tim masih menyusun rencananya. Coba buka lagi nanti.
            </p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 14, background: 'var(--surface-1)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                Ada <strong>{konten.length} konten</strong> di rencana ini.
                {disetujui > 0 && ` ${disetujui} sudah kamu setujui.`}
                {data.can_decide && perluDilihat > 0
                  ? ` ${perluDilihat} masih menunggu tanggapanmu.`
                  : ''}
                {!data.can_decide && ' Tautan ini untuk dilihat saja.'}
              </p>
            </div>

            {konten.map((item) => (
              <KartuKonten
                key={item.id}
                item={item}
                bisaPutuskan={data.can_decide}
                onPutuskan={(it, jenis) => {
                  setPesan(null)
                  setKeputusan({ item: it, jenis })
                }}
              />
            ))}
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
          Dibuat dengan plannersm.co
        </p>
      </div>

      {keputusan && (
        <Sheet
          open
          onClose={() => setKeputusan(null)}
          title={keputusan.jenis === 'approved' ? 'Setujui konten ini' : 'Minta perbaikan'}
          description={keputusan.item.title}
          lebar={400}
        >
          <form onSubmit={kirimKeputusan}>
            <label className="field-label" htmlFor="klien-nama">Nama kamu</label>
            <input
              id="klien-nama"
              className="input"
              autoFocus
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Supaya tim tahu siapa yang memutuskan"
              style={{ marginBottom: 12 }}
            />

            <label className="field-label" htmlFor="klien-catatan">
              {keputusan.jenis === 'approved' ? 'Catatan (opsional)' : 'Apa yang perlu diperbaiki?'}
            </label>
            <textarea
              id="klien-catatan"
              className="textarea"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={keputusan.jenis === 'approved'
                ? 'Kalau ada yang ingin disampaikan.'
                : 'Sebutkan yang konkret supaya tim tidak perlu menebak.'}
              style={{ minHeight: 72 }}
            />

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setKeputusan(null)}>Batal</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sibuk || !nama.trim() || (keputusan.jenis === 'changes_requested' && !catatan.trim())}
              >
                {sibuk ? 'Mengirim...' : keputusan.jenis === 'approved' ? 'Setujui' : 'Kirim'}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  )
}
