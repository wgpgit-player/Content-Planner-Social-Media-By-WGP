import { useCallback, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import Icon from './Icon'
import Sheet from './Sheet'
import { supabase } from '../lib/supabaseClient'
import { useConfirm } from '../lib/useConfirm'
import { periksa, buatQrisDinamis } from '../lib/qris'

// Tab Pesanan di konsol operator: tempat pembayaran QRIS dicocokkan.
//
// KENAPA PERSETUJUANNYA MANUAL
//
// Tanpa payment gateway, tidak ada webhook yang memberi tahu aplikasi ini
// bahwa uang sudah masuk. Jadi manusia yang memutuskan, dan tugas halaman
// ini adalah membuat keputusan itu cepat dan sulit salah: nominal lengkap
// dengan kode uniknya ditaruh paling menonjol, buktinya bisa dibuka satu
// klik, dan tombol setuju ada tepat di sebelahnya.
//
// Yang TIDAK dilakukan di sini: menebak. Aplikasi tidak pernah menyatakan
// sebuah pembayaran "kemungkinan cocok" — operator yang melihat mutasi
// rekeningnya sendiri, lalu memutuskan.

const STATUS = [
  { key: 'diperiksa', label: 'Perlu diperiksa' },
  { key: 'menunggu', label: 'Menunggu bayar' },
  { key: 'lunas', label: 'Lunas' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: '', label: 'Semua' },
]

const LABEL_STATUS = {
  menunggu: 'Menunggu bayar',
  diperiksa: 'Perlu diperiksa',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
  batal: 'Dibatalkan',
  kadaluarsa: 'Kedaluwarsa',
}

function rupiah(n) {
  return 'Rp' + Number(n ?? 0).toLocaleString('id-ID')
}

function waktu(v) {
  if (!v) return '-'
  return new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/* ============================================================
   Pengaturan QRIS
   ============================================================ */

// Payload QRIS disimpan di database, bukan di kode, supaya rekening bisa
// diganti tanpa build ulang. Sebelum disimpan ia diperiksa dulu lewat
// checksum bawaannya — QRIS yang tersalin setengah akan langsung ketahuan
// di sini, bukan nanti saat pembeli gagal memindai.
function PanelQris({ pengaturan, onSimpan }) {
  const [buka, setBuka] = useState(false)
  const [payload, setPayload] = useState(pengaturan?.qris_payload ?? '')
  const [nama, setNama] = useState(pengaturan?.nama_merchant ?? '')
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const [contoh, setContoh] = useState(null)

  useEffect(() => {
    setPayload(pengaturan?.qris_payload ?? '')
    setNama(pengaturan?.nama_merchant ?? '')
  }, [pengaturan])

  const hasilPeriksa = useMemo(() => (payload.trim() ? periksa(payload) : null), [payload])

  // Contoh QR Rp 10.000 supaya operator bisa memindai sendiri dan yakin
  // payload yang baru ditempel benar-benar berfungsi, sebelum pembeli yang
  // menemukan masalahnya.
  useEffect(() => {
    let batal = false
    setContoh(null)
    if (!hasilPeriksa?.valid) return
    const hasil = buatQrisDinamis(payload.trim(), 10000)
    if (hasil.error) return
    QRCode.toDataURL(hasil.payload, { margin: 1, width: 320 })
      .then((u) => { if (!batal) setContoh(u) })
      .catch(() => {})
    return () => { batal = true }
  }, [payload, hasilPeriksa])

  async function simpan() {
    setSibuk(true)
    setGalat(null)
    const { error } = await supabase
      .from('pengaturan_platform')
      .update({
        qris_payload: payload.trim(),
        nama_merchant: nama.trim() || hasilPeriksa?.namaMerchant || null,
        diperbarui_at: new Date().toISOString(),
      })
      .eq('id', true)
    setSibuk(false)
    if (error) { setGalat(error.message); return }
    setBuka(false)
    onSimpan?.()
  }

  const siap = hasilPeriksa?.valid === true

  return (
    <>
      <div className="operator-qris-ringkas">
        <Icon name="qr-code-outline" size={18} />
        <div>
          <strong>{pengaturan?.nama_merchant || 'QRIS belum diatur'}</strong>
          <span>
            {pengaturan?.qris_payload
              ? 'QRIS statis tersimpan. Nominal tiap pesanan ditanam otomatis ke dalamnya.'
              : 'Belum ada QRIS. Pembeli tidak akan bisa membayar sampai ini diisi.'}
          </span>
        </div>
        <button type="button" className="btn" onClick={() => setBuka(true)}>
          {pengaturan?.qris_payload ? 'Ubah' : 'Atur sekarang'}
        </button>
      </div>

      <Sheet
        open={buka}
        onClose={() => setBuka(false)}
        title="QRIS platform"
        description="Tempel isi QRIS statis milikmu. Kode nominal dibuat dari sini."
        lebar={560}
        footer={
          <button type="button" className="btn btn-primary btn-block" disabled={!siap || sibuk} onClick={simpan}>
            {sibuk ? 'Menyimpan...' : 'Simpan'}
          </button>
        }
      >
        {galat && <p role="alert" className="alert alert-error">{galat}</p>}

        <label className="field-label" htmlFor="qris-payload">Isi QRIS statis</label>
        <textarea
          id="qris-payload"
          className="input"
          rows={5}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="00020101021126..."
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, wordBreak: 'break-all', marginBottom: 10 }}
        />

        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          Ini bukan gambar QR-nya, melainkan teks yang ada <em>di dalam</em> QR itu.
          Cara mendapatkannya: pindai QRIS statis milikmu dengan aplikasi pembaca
          QR biasa, lalu salin teks yang muncul.
        </p>

        {hasilPeriksa && (
          <p className={`alert alert-${siap ? 'info' : 'error'}`}>
            <Icon name={siap ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={14} />{' '}
            {siap
              ? `Terbaca sah — ${hasilPeriksa.namaMerchant || 'tanpa nama'}, ${hasilPeriksa.kota || 'tanpa kota'}.`
                + (hasilPeriksa.sudahAdaNominal ? ' Catatan: QR ini sudah punya nominal; nominalnya akan diganti tiap pesanan.' : '')
              : hasilPeriksa.alasan}
          </p>
        )}

        <label className="field-label" htmlFor="qris-nama">Nama merchant yang ditampilkan ke pembeli</label>
        <input
          id="qris-nama"
          className="input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder={hasilPeriksa?.namaMerchant || 'Nama usaha'}
        />

        {contoh && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <img src={contoh} alt="Contoh QR Rp 10.000" width={150} height={150} style={{ borderRadius: 12 }} />
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>
              Contoh hasil untuk Rp 10.000. <strong>Pindai dulu dengan aplikasi
              pembayaranmu</strong> dan pastikan nominalnya muncul benar sebelum
              disimpan.
            </p>
          </div>
        )}
      </Sheet>
    </>
  )
}

/* ============================================================
   Daftar pesanan
   ============================================================ */

export default function TabPesanan() {
  const tanya = useConfirm()
  const [status, setStatus] = useState('diperiksa')
  const [daftar, setDaftar] = useState([])
  const [pengaturan, setPengaturan] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [sibuk, setSibuk] = useState(null)
  const [bukti, setBukti] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase) return
    setMemuat(true)
    setGalat(null)

    const [p, s] = await Promise.all([
      supabase.rpc('daftar_pesanan_operator', { p_status: status || null }),
      supabase.from('pengaturan_platform').select('qris_payload, nama_merchant').maybeSingle(),
    ])

    if (p.error) setGalat(p.error.message)
    else setDaftar(p.data ?? [])
    if (!s.error) setPengaturan(s.data ?? null)
    setMemuat(false)
  }, [status])

  useEffect(() => { muat() }, [muat])

  // Bucket bukti-bayar privat, jadi berkasnya dibuka lewat tautan
  // bertanda tangan yang kedaluwarsa sendiri — bukan URL publik yang bisa
  // diteruskan ke siapa saja.
  async function lihatBukti(o) {
    const { data, error } = await supabase.storage
      .from('bukti-bayar')
      .createSignedUrl(o.bukti_path, 300)
    if (error) { setGalat(error.message); return }
    setBukti({ url: data.signedUrl, pesanan: o })
  }

  async function putuskan(o, setuju) {
    const yakin = await tanya.ask({
      title: setuju ? `Setujui pembayaran ${rupiah(o.total)}?` : 'Tolak pembayaran ini?',
      description: setuju
        ? `Paket ${o.paket_nama} langsung aktif untuk ${o.nama_workspace}, `
          + `${o.periode === 'tahunan' ? '12 bulan' : '1 bulan'} dihitung dari sisa masa berlaku. `
          + 'Pastikan nominal di mutasi rekening persis sama, termasuk 3 angka terakhirnya.'
        : 'Pembeli akan melihat pesanannya ditolak dan bisa membuat pesanan baru. '
          + 'Sebaiknya isi alasannya supaya mereka tahu apa yang perlu diperbaiki.',
      labelConfirm: setuju ? 'Ya, setujui' : 'Tolak',
      labelCancel: 'Batal',
      danger: !setuju,
    })
    if (!yakin) return

    const catatan = setuju ? null : (window.prompt('Alasan penolakan (dilihat pembeli):') || null)

    setSibuk(o.id)
    const { error } = await supabase.rpc(setuju ? 'setujui_pesanan' : 'tolak_pesanan', {
      p_pesanan_id: o.id,
      p_catatan: catatan,
    })
    setSibuk(null)
    if (error) { setGalat(error.message); return }
    setBukti(null)
    await muat()
  }

  const perluDiperiksa = daftar.filter((o) => o.status === 'diperiksa').length

  return (
    <>
      <PanelQris pengaturan={pengaturan} onSimpan={muat} />

      <div className="segmen" role="group" aria-label="Saring status" style={{ marginBottom: 14 }}>
        {STATUS.map((s) => (
          <button key={s.key} type="button" aria-pressed={status === s.key} onClick={() => setStatus(s.key)}>
            {s.label}
            {s.key === 'diperiksa' && perluDiperiksa > 0 && status === 'diperiksa' ? ` (${perluDiperiksa})` : ''}
          </button>
        ))}
      </div>

      {galat && <p role="alert" className="alert alert-error">{galat}</p>}
      {memuat && <p className="page-subtitle">Memuat pesanan...</p>}

      {!memuat && daftar.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Tidak ada pesanan pada saringan ini.
          </p>
        </div>
      )}

      <div className="operator-pesanan-daftar">
        {daftar.map((o) => (
          <article key={o.id} className="operator-pesanan">
            <div className="operator-pesanan-utama">
              <span className={`bayar-status bayar-status-${o.status}`}>
                {LABEL_STATUS[o.status] ?? o.status}
              </span>
              <strong>{o.nama_workspace}</strong>
              <small>{o.email_pemesan || 'tanpa email'}</small>
            </div>

            <div className="operator-pesanan-nominal">
              {/* Kode unik ditulis terpisah karena itulah yang dicocokkan
                  dengan mutasi rekening — bukan harga paketnya. */}
              <b>{rupiah(o.total)}</b>
              <i>kode {String(o.kode_unik).padStart(3, '0')}</i>
              <span>{o.paket_nama ?? o.paket_key} · {o.periode === 'tahunan' ? '12 bulan' : '1 bulan'}</span>
            </div>

            <div className="operator-pesanan-waktu">
              <span>Dipesan {waktu(o.created_at)}</span>
              {o.diputuskan_at && <span>Diputus {waktu(o.diputuskan_at)}</span>}
              {o.catatan_pembeli && <em>“{o.catatan_pembeli}”</em>}
              {o.catatan_operator && <em>Catatan: {o.catatan_operator}</em>}
            </div>

            <div className="operator-pesanan-aksi">
              {o.bukti_path ? (
                <button type="button" className="btn" onClick={() => lihatBukti(o)}>
                  <Icon name="image-outline" size={15} /> Lihat bukti
                </button>
              ) : (
                <span className="operator-pesanan-nobukti">Belum ada bukti</span>
              )}

              {['menunggu', 'diperiksa'].includes(o.status) && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={sibuk === o.id}
                    onClick={() => putuskan(o, true)}
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-solid"
                    disabled={sibuk === o.id}
                    onClick={() => putuskan(o, false)}
                  >
                    Tolak
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <Sheet
        open={!!bukti}
        onClose={() => setBukti(null)}
        title="Bukti transfer"
        description={bukti ? `${bukti.pesanan.nama_workspace} · ${rupiah(bukti.pesanan.total)}` : ''}
        lebar={520}
        footer={bukti && ['menunggu', 'diperiksa'].includes(bukti.pesanan.status) ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-danger-solid" style={{ flex: 1 }} onClick={() => putuskan(bukti.pesanan, false)}>
              Tolak
            </button>
            <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={() => putuskan(bukti.pesanan, true)}>
              Setujui {rupiah(bukti.pesanan.total)}
            </button>
          </div>
        ) : null}
      >
        {bukti && (
          <>
            <p className="alert alert-info" style={{ marginBottom: 12 }}>
              <Icon name="key-outline" size={14} /> Cocokkan nominalnya persis:{' '}
              <strong>{rupiah(bukti.pesanan.total)}</strong> — tiga angka terakhirnya{' '}
              <strong>{String(bukti.pesanan.kode_unik).padStart(3, '0')}</strong>.
            </p>
            {bukti.url.match(/\.pdf($|\?)/i) ? (
              <a className="btn btn-block" href={bukti.url} target="_blank" rel="noopener noreferrer">
                Buka berkas PDF
              </a>
            ) : (
              <img
                src={bukti.url}
                alt="Bukti transfer"
                style={{ width: '100%', borderRadius: 14, display: 'block' }}
              />
            )}
          </>
        )}
      </Sheet>

      {tanya.dialog}
    </>
  )
}
