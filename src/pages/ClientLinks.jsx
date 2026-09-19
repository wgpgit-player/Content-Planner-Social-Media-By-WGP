import { useCallback, useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useConfirm } from '../lib/useConfirm'
import { isoDate } from '../lib/dates'

// Tautan baca-saja untuk klien.
//
// Masalah yang diselesaikan: klien perlu melihat dan menyetujui rencana
// sebulan, tapi tidak mau membuat akun, dan memang tidak seharusnya jadi
// anggota workspace. Tautan bertoken menyelesaikan keduanya.
//
// Yang penting dipahami dari halaman ini: token adalah satu-satunya
// kredensial. Siapa pun yang memegang tautannya bisa membuka isinya. Karena
// itu setiap tautan dibatasi ke satu rentang tanggal, punya masa berlaku,
// dan bisa dicabut kapan saja — dan ketiga batasan itu diperiksa di
// database, bukan di sini. Halaman ini hanya menjelaskannya kepada
// pengguna, karena konsekuensinya perlu dia sadari sebelum menekan bagikan.

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function awalBulan(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function akhirBulan(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }

function formatTanggal(iso) {
  if (!iso) return '-'
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

function formatWaktu(ts) {
  if (!ts) return null
  const d = new Date(ts)
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

function Tautan({ tautan, onCabut, onSalin, tersalin }) {
  const kedaluwarsa = new Date(tautan.expires_at) <= new Date()
  const dicabut = Boolean(tautan.revoked_at)
  const mati = kedaluwarsa || dicabut

  return (
    <div
      style={{
        padding: '13px 0',
        borderTop: '0.5px solid var(--border)',
        opacity: mati ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13.5, fontWeight: 600 }}>{tautan.label}</p>
            {tautan.can_decide ? (
              <span className="chip" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'transparent' }}>
                Boleh menyetujui
              </span>
            ) : (
              <span className="chip">Lihat saja</span>
            )}
            {dicabut && (
              <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'transparent' }}>
                Dicabut
              </span>
            )}
            {!dicabut && kedaluwarsa && (
              <span className="chip" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent' }}>
                Kedaluwarsa
              </span>
            )}
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>
            {formatTanggal(tautan.period_start)} sampai {formatTanggal(tautan.period_end)}
          </p>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {mati ? 'Sudah tidak bisa dibuka' : `Berlaku sampai ${formatWaktu(tautan.expires_at)}`}
            {' · '}
            {tautan.view_count > 0
              ? `dibuka ${tautan.view_count} kali, terakhir ${formatWaktu(tautan.last_viewed_at)}`
              : 'belum pernah dibuka'}
            {tautan.hide_drafts && ' · ide dan draf disembunyikan'}
          </p>

          {tautan.note && (
            <p style={{
              fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6,
              padding: '7px 9px', background: 'var(--surface-1)', borderRadius: 8,
              lineHeight: 1.55,
            }}>
              “{tautan.note}”
            </p>
          )}
        </div>
      </div>

      {!mati && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => onSalin(tautan)}>
            <Icon name={tersalin ? 'checkmark-outline' : 'copy-outline'} size={14} />
            {tersalin ? 'Tersalin' : 'Salin tautan'}
          </button>

          {/* Melihatnya sendiri sebelum dikirim. Tanpa ini, satu-satunya cara
              memastikan apa yang terlihat klien adalah membuka jendela
              samaran — dan orang biasanya tidak repot, lalu kaget. */}
          <a
            href={`/r/${tautan.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <Icon name="eye-outline" size={14} /> Lihat sebagai klien
          </a>

          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onCabut(tautan)}
            style={{ color: 'var(--danger)' }}>
            Cabut
          </button>
        </div>
      )}
    </div>
  )
}

export default function ClientLinks() {
  const { tenantId, isAdmin } = useTenantContext()
  const tanya = useConfirm()

  const [daftar, setDaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [tersalin, setTersalin] = useState(null)
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  const sekarang = new Date()
  const [label, setLabel] = useState('')
  const [mulai, setMulai] = useState(isoDate(awalBulan(sekarang)))
  const [selesai, setSelesai] = useState(isoDate(akhirBulan(sekarang)))
  const [bolehPutuskan, setBolehPutuskan] = useState(true)
  const [sembunyikanDraf, setSembunyikanDraf] = useState(true)
  const [sapaan, setSapaan] = useState('')
  const [hariBerlaku, setHariBerlaku] = useState(30)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('client_links')
      .select('id,token,label,period_start,period_end,can_decide,hide_drafts,note,expires_at,revoked_at,last_viewed_at,view_count,created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) setGalat(error.message)
    setDaftar(data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  function alamatTautan(tautan) {
    return `${window.location.origin}/r/${tautan.token}`
  }

  async function salin(tautan) {
    const url = alamatTautan(tautan)
    try {
      await navigator.clipboard.writeText(url)
      setTersalin(tautan.id)
      setTimeout(() => setTersalin((t) => (t === tautan.id ? null : t)), 1800)
    } catch {
      // Clipboard bisa ditolak peramban, misalnya di halaman non-HTTPS.
      // Diam-diam gagal berarti pengguna menekan tombol dan tidak terjadi
      // apa pun, jadi alamatnya ditampilkan supaya bisa disalin manual.
      setPesan({ tipe: 'info', teks: `Salin manual: ${url}` })
    }
  }

  async function buat(e) {
    e.preventDefault()
    if (!label.trim()) return

    setSibuk(true)
    setGalat(null)

    const { data, error } = await supabase.rpc('buat_tautan_klien', {
      p_tenant_id: tenantId,
      p_label: label.trim(),
      p_period_start: mulai,
      p_period_end: selesai,
      p_can_decide: bolehPutuskan,
      p_hari_berlaku: Number(hariBerlaku) || 30,
    })

    setSibuk(false)

    if (error) {
      setGalat(error.message)
      return
    }

    setFormTerbuka(false)

    const baru = Array.isArray(data) ? data[0] : data

    // Catatan dan pilihan sembunyikan-draf disimpan lewat update terpisah.
    // RPC buat_tautan_klien() sengaja tidak ditambah dua parameter lagi:
    // ia sudah punya enam, dan menambah terus akan membuat pemanggilnya
    // sulit dibaca. Keduanya kolom biasa yang dilindungi RLS admin.
    //
    // Kolom form dikosongkan SETELAH blok ini, bukan sebelumnya. Nilai lama
    // memang masih terbaca dari closure walau state sudah disetel ulang,
    // tapi urutan yang bergantung pada seluk-beluk itu akan menjebak orang
    // berikutnya yang menyunting fungsi ini.
    if (baru?.id && (sapaan.trim() || sembunyikanDraf)) {
      await supabase
        .from('client_links')
        .update({ note: sapaan.trim() || null, hide_drafts: sembunyikanDraf })
        .eq('id', baru.id)
        .eq('tenant_id', tenantId)
    }

    setLabel('')
    setSapaan('')

    if (baru?.token) {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/r/${baru.token}`)
        setPesan({ tipe: 'sukses', teks: 'Tautan dibuat dan sudah disalin ke papan klip.' })
      } catch {
        setPesan({ tipe: 'sukses', teks: 'Tautan dibuat. Tekan “Salin tautan” untuk mengambilnya.' })
      }
    }

    await muat()
  }

  async function cabut(tautan) {
    const yakin = await tanya.ask({
      title: `Cabut tautan "${tautan.label}"?`,
      description: 'Siapa pun yang memegang tautan ini langsung tidak bisa membukanya lagi.',
      labelConfirm: 'Cabut',
    })
    if (!yakin) return

    const { error } = await supabase
      .from('client_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tautan.id)
      .eq('tenant_id', tenantId)

    if (error) { setGalat(error.message); return }
    await muat()
  }

  if (!isAdmin) {
    return (
      <AppShell title="Tautan klien" maxWidth={700}>
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Hanya admin yang bisa membuat dan mencabut tautan klien. Ini juga
            ditegakkan di database, bukan cuma disembunyikan di halaman ini.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Tautan klien"
      description="Bagikan rencana sebulan ke klien tanpa mereka perlu membuat akun."
      maxWidth={720}
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormTerbuka(true)}>
          <Icon name="add-outline" size={15} /> Tautan baru
        </button>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}
      {pesan && (
        <p className={`alert alert-${pesan.tipe === 'sukses' ? 'success' : 'info'}`} style={{ marginBottom: 14 }}>
          {pesan.teks}
        </p>
      )}

      <div className="card" style={{ marginBottom: 14, background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <Icon name="information-circle-outline" size={17} color="var(--text-secondary)" />
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>Yang perlu kamu tahu sebelum membagikan</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Tautan ini tidak dilindungi kata sandi. Siapa pun yang memegangnya
              bisa membuka isinya, jadi kirimkan hanya ke orang yang memang
              berhak melihatnya. Satu tautan hanya membuka rentang tanggal yang
              kamu pilih, dan catatan produksi internal tidak ikut terlihat.
              Kalau tautannya salah kirim, cabut saja — efeknya langsung.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: loading || daftar.length ? 4 : 0 }}>
          Tautan yang pernah dibuat
        </p>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>Memuat...</p>}

        {!loading && daftar.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>
            Belum ada. Buat satu, lalu kirimkan ke klien supaya mereka bisa
            melihat dan menyetujui rencana bulan ini tanpa perlu akun.
          </p>
        )}

        {daftar.map((t) => (
          <Tautan
            key={t.id}
            tautan={t}
            onCabut={cabut}
            onSalin={salin}
            tersalin={tersalin === t.id}
          />
        ))}
      </div>

      {formTerbuka && (
        <Sheet
          open
          onClose={() => setFormTerbuka(false)}
          title="Tautan klien baru"
          description="Satu tautan untuk satu klien dan satu rentang tanggal."
          lebar={420}
        >
          <form onSubmit={buat}>
            <label className="field-label" htmlFor="tk-label">Nama tautan</label>
            <input
              id="tk-label"
              className="input"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Klien Acme — rencana Oktober"
              style={{ marginBottom: 4 }}
            />
            <p className="field-hint" style={{ marginBottom: 12 }}>
              Untuk catatanmu sendiri. Klien tidak melihat nama ini.
            </p>

            <div className="sheet-kolom" style={{ marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="tk-mulai">Dari tanggal</label>
                <input id="tk-mulai" className="input" type="date" value={mulai}
                  onChange={(e) => setMulai(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="tk-selesai">Sampai tanggal</label>
                <input id="tk-selesai" className="input" type="date" value={selesai}
                  onChange={(e) => setSelesai(e.target.value)} />
              </div>
            </div>

            <label className="field-label" htmlFor="tk-hari">Masa berlaku</label>
            <select id="tk-hari" className="select" value={hariBerlaku}
              onChange={(e) => setHariBerlaku(e.target.value)} style={{ marginBottom: 14 }}>
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
              <option value={30}>30 hari</option>
              <option value={90}>90 hari</option>
            </select>

            <button
              type="button"
              className="option-card"
              onClick={() => setBolehPutuskan((v) => !v)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                borderColor: bolehPutuskan ? 'var(--accent)' : 'var(--border-strong)',
                background: bolehPutuskan ? 'var(--accent-bg)' : 'var(--surface-2)',
              }}
            >
              <Icon
                name={bolehPutuskan ? 'checkbox-outline' : 'square-outline'}
                size={18}
                color={bolehPutuskan ? 'var(--accent)' : 'var(--text-muted)'}
              />
              <span>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>
                  Klien boleh menyetujui dan minta revisi
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginTop: 2, lineHeight: 1.55 }}>
                  Kalau dimatikan, klien hanya bisa melihat. Keputusannya tetap
                  tercatat dengan nama yang dia isi sendiri.
                </span>
              </span>
            </button>

            <button
              type="button"
              className="option-card"
              onClick={() => setSembunyikanDraf((v) => !v)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10,
                borderColor: sembunyikanDraf ? 'var(--accent)' : 'var(--border-strong)',
                background: sembunyikanDraf ? 'var(--accent-bg)' : 'var(--surface-2)',
              }}
            >
              <Icon
                name={sembunyikanDraf ? 'checkbox-outline' : 'square-outline'}
                size={18}
                color={sembunyikanDraf ? 'var(--accent)' : 'var(--text-muted)'}
              />
              <span>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>
                  Sembunyikan yang masih ide dan draf
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginTop: 2, lineHeight: 1.55 }}>
                  Klien hanya melihat yang sudah matang. Menampilkan ide
                  setengah jadi membuat rencana terlihat lebih berantakan
                  daripada keadaan sebenarnya.
                </span>
              </span>
            </button>

            <label className="field-label" htmlFor="tk-sapaan" style={{ marginTop: 14 }}>
              Sapaan untuk klien (opsional)
            </label>
            <textarea
              id="tk-sapaan"
              className="textarea"
              rows={3}
              value={sapaan}
              onChange={(e) => setSapaan(e.target.value)}
              placeholder="Contoh: Halo Bu Sri, ini rencana konten Oktober. Mohon dicek dan ditandai kalau ada yang perlu diubah."
              style={{ minHeight: 70 }}
            />
            <p className="field-hint">Tampil di bagian atas halaman yang dibuka klien.</p>

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setFormTerbuka(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk || !label.trim()}>
                {sibuk ? 'Membuat...' : 'Buat tautan'}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {tanya.dialog}
    </AppShell>
  )
}
