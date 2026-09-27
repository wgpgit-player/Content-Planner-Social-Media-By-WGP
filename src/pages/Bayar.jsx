import { readAddons } from '../lib/checkout'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useConfirm } from '../lib/useConfirm'
import { buatQrisDinamis } from '../lib/qris'

// Halaman bayar QRIS.
//
// ALURNYA, DAN KENAPA BEGINI
//
// Tanpa payment gateway, tidak ada yang memberi tahu aplikasi ini bahwa uang
// sudah masuk. Jadi yang dibangun bukan pembayaran otomatis, melainkan alur
// yang membuat pencocokan manual jadi mudah dan sulit keliru:
//
//   1. Pembeli memilih paket  -> database membuat pesanan sekaligus
//      menempelkan KODE UNIK 3 angka di belakang harga.
//   2. QRIS statis milik platform diubah jadi QRIS bernominal persis
//      sebesar total itu (lihat lib/qris.js). Pembeli tinggal pindai,
//      nominalnya sudah terisi, jadi tidak ada salah ketik.
//   3. Pembeli mengunggah bukti transfer.
//   4. Operator mencocokkan angka di mutasi rekening dengan kode unik —
//      satu nominal hanya dipakai satu pesanan aktif — lalu menyetujui.
//
// Kode unik itulah kuncinya. Tanpa dia, dua orang yang sama-sama membeli
// paket Pro di hari yang sama akan mengirim nominal yang identik, dan
// operator tidak punya cara memastikan mutasi mana milik siapa.

function rupiah(n) {
  return 'Rp' + Number(n ?? 0).toLocaleString('id-ID')
}

function sisaWaktu(kadaluarsa) {
  const selisih = new Date(kadaluarsa).getTime() - Date.now()
  if (selisih <= 0) return null
  const jam = Math.floor(selisih / 3600000)
  const menit = Math.floor((selisih % 3600000) / 60000)
  return jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`
}

const LABEL_STATUS = {
  menunggu: 'Menunggu pembayaran',
  diperiksa: 'Bukti sedang diperiksa',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
  batal: 'Dibatalkan',
  kadaluarsa: 'Kedaluwarsa',
}

export default function Bayar() {
  const [params] = useSearchParams()
  const { tenantId, tenant, isAdmin, reloadTenants } = useTenantContext()
  const tanya = useConfirm()

  const [addons, setAddons] = useState([])
  const [quantities, setQuantities] = useState(() => readAddons(params.get('addons')))
  const refreshed = useRef(null)
  const [paket, setPaket] = useState([])
  const [pengaturan, setPengaturan] = useState(null)
  const [pesanan, setPesanan] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  const [pilihPaket, setPilihPaket] = useState(params.get('paket') || 'dasar')
  const [periode, setPeriode] = useState(params.get('periode') === 'tahunan' ? 'tahunan' : 'bulanan')

  const [gambarQr, setGambarQr] = useState(null)
  const [galatQr, setGalatQr] = useState(null)
  const inputBerkas = useRef(null)

  const muat = useCallback(async (silent = false) => {
    if (!supabase || !tenantId) { setMemuat(false); return }
    if (!silent) setMemuat(true)
    setGalat(null)

    try {
    const [p, s, ps, a] = await Promise.all([
      supabase.from('paket_langganan').select('*').eq('tampil', true).order('urutan'),
      supabase.from('pengaturan_platform').select('qris_payload, nama_merchant, instruksi').maybeSingle(),
      supabase.from('pesanan').select('*').eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('addon_langganan').select('*').eq('tampil', true).order('urutan'),
    ])

    const pertama = p.error || s.error || ps.error || a.error
    if (pertama) { setGalat(pertama.message); setMemuat(false); return }

    setAddons(a.data ?? [])
    setPaket(p.data ?? [])
    setPengaturan(s.data ?? null)

    const semua = ps.data ?? []
    // Yang "aktif" cuma yang belum diputuskan DAN belum lewat waktunya.
    // Pesanan kedaluwarsa sengaja tidak ditampilkan sebagai aktif supaya
    // pembeli tidak menunggu QR yang sudah tidak akan dicocokkan lagi.
    const aktif = semua.find(
      (o) => o.status === 'diperiksa' || (o.status === 'menunggu' && new Date(o.kadaluarsa_at) > new Date()),
    )
    setPesanan(aktif ?? null)
    setRiwayat(semua.filter((o) => o.id !== aktif?.id))
    } catch (e) { setGalat(e.message || 'Status pembayaran belum bisa dimuat.') }
    finally { setMemuat(false) }
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    if (!pesanan) return
    const timer = setInterval(() => { if (!document.hidden) muat(true) }, 10000)
    const focus = () => muat(true)
    window.addEventListener('focus', focus)
    return () => { clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [pesanan?.id, muat])
  useEffect(() => {
    const paid = riwayat.find(o => o.status === 'lunas')
    if (paid && refreshed.current !== paid.id) {
      refreshed.current = paid.id
      reloadTenants()
    }
  }, [riwayat, reloadTenants])

  // QR digambar dari payload hasil konversi, bukan dari gambar statis yang
  // diunggah. Nominalnya benar-benar ada di dalam kode QR-nya.
  useEffect(() => {
    let batal = false
    setGambarQr(null)
    setGalatQr(null)

    if (!pesanan) return
    if (!pengaturan?.qris_payload) { setGalatQr('QRIS belum tersedia. Coba lagi nanti.'); return }

    const hasil = buatQrisDinamis(pengaturan.qris_payload, Number(pesanan.total))
    if (hasil.error) { setGalatQr(hasil.error); return }

    QRCode.toDataURL(hasil.payload, { errorCorrectionLevel: 'M', margin: 1, width: 640 })
      .then((url) => { if (!batal) setGambarQr(url) })
      .catch((e) => { if (!batal) setGalatQr(e.message) })

    return () => { batal = true }
  }, [pesanan, pengaturan])

  const paketTerpilih = useMemo(
    () => paket.find((p) => p.key === pilihPaket) ?? null,
    [paket, pilihPaket],
  )
  const hargaTerpilih = paketTerpilih
    ? Number(periode === 'tahunan' ? paketTerpilih.harga_tahunan : paketTerpilih.harga_bulanan)
    : null

  const addonTotal = addons.reduce((sum, a) => sum + Number(a.harga_bulanan) * (quantities[a.key] || 0) * (periode === 'tahunan' ? 12 : 1), 0)

  async function buatTagihan() {
    if (!paketTerpilih || !hargaTerpilih) return
    setSibuk(true)
    setGalat(null)

    try {
    const selectedAddons = Object.fromEntries(Object.entries(quantities).filter(([, n]) => n > 0))
    const withAddons = Object.keys(selectedAddons).length > 0
    const { error } = await supabase.rpc(withAddons ? 'buat_pesanan_qris' : 'buat_pesanan', {
      p_tenant_id: tenantId,
      p_paket: pilihPaket,
      p_periode: periode,
      ...(withAddons ? { p_addons: selectedAddons } : {}),
    })

    setSibuk(false)
    if (error) { setGalat(error.code === 'PGRST202' ? 'Pembayaran add-on sedang disiapkan. Pilihanmu tetap tersimpan. Coba kembali setelah pembaruan selesai.' : error.message); return }
    await muat()
    } catch (e) { setGalat(e.message) } finally { setSibuk(false) }
  }

  async function unggahBukti(event) {
    const berkas = event.target.files?.[0]
    event.target.value = ''
    if (!berkas || !pesanan) return

    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(berkas.type)) { setGalat('Gunakan JPG, PNG, WebP atau PDF.'); return }
    if (berkas.size > 5 * 1024 * 1024) {
      setGalat('Ukuran bukti maksimal 5 MB. Coba potret ulang atau kecilkan gambarnya.')
      return
    }

    setSibuk(true)
    setGalat(null)

    try {
    const ext = (berkas.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5)
    // Nama selalu baru, tidak pernah menimpa: bukti lama tetap tersimpan
    // kalau pembeli mengunggah ulang, jadi jejaknya utuh kalau nanti ada
    // sengketa soal "saya sudah kirim kok".
    const path = `${tenantId}/${pesanan.id}-${Date.now()}.${ext}`

    const { error: galatUnggah } = await supabase.storage
      .from('bukti-bayar')
      .upload(path, berkas, { contentType: berkas.type, upsert: false })

    if (galatUnggah) { setGalat(galatUnggah.message); setSibuk(false); return }

    const { error } = await supabase.rpc('kirim_bukti', {
      p_pesanan_id: pesanan.id,
      p_path: path,
      p_catatan: null,
    })

    setSibuk(false)
    if (error) { setGalat(error.message); return }
    await muat()
    } catch (e) { setGalat(e.message) } finally { setSibuk(false) }
  }

  async function batalkan() {
    const yakin = await tanya.ask({
      title: 'Batalkan pesanan ini?',
      description: 'Pesanan akan dibatalkan. Jangan membayar QR dari pesanan ini. '
        + 'Kalau kamu sudah terlanjur transfer, jangan dibatalkan — hubungi kami saja.',
      labelConfirm: 'Ya, batalkan',
      labelCancel: 'Tidak jadi',
      danger: true,
    })
    if (!yakin) return

    setSibuk(true)
    const { error } = await supabase.rpc('batalkan_pesanan', { p_pesanan_id: pesanan.id })
    setSibuk(false)
    if (error) { setGalat(error.message); return }
    await muat()
  }

  function salinNominal() {
    navigator.clipboard?.writeText(String(pesanan.total))
  }

  /* ---------- tampilan ---------- */

  if (memuat) {
    return <AppShell title="Pembayaran"><p className="page-subtitle">Memuat...</p></AppShell>
  }

  if (!isAdmin) {
    return (
      <AppShell title="Pembayaran">
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Hanya admin workspace yang bisa mengurus langganan. Minta admin
            {tenant?.name ? ` ${tenant.name}` : ''} untuk membuka halaman ini.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Pembayaran" maxWidth={920}>
      {galat && <p role="alert" className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <p className="page-subtitle">Pilih paket → Bayar QRIS → Unggah bukti → Persetujuan admin</p>
      {!pesanan && riwayat[0]?.status === 'lunas' && <div className="alert alert-info" role="status">Pembayaran disetujui. Paket sudah aktif. <Link to="/dashboard">Buka aplikasi</Link></div>}
      {pesanan && <button className="btn" onClick={() => muat(true)}>Perbarui status</button>}
      {pesanan ? (
        <div className="bayar-wrap">
          <div className="bayar-qr-kolom">
            <div className="bayar-qr-kartu">
              <div className="bayar-qr-kepala">
                <Icon name="qr-code-outline" size={16} />
                <span>QRIS · {pengaturan?.nama_merchant || 'Merchant'}</span>
              </div>

              <div className="bayar-qr-bingkai">
                {gambarQr && <img src={gambarQr} alt="Kode QRIS pembayaran" />}
                {galatQr && (
                  <p className="bayar-qr-galat">
                    QR belum bisa dibuat: {galatQr}
                  </p>
                )}
                {!gambarQr && !galatQr && <p className="bayar-qr-galat">Menyiapkan QR...</p>}
              </div>

              <p className="bayar-qr-catatan">
                Pindai dengan aplikasi apa pun yang mendukung QRIS. Nominalnya
                sudah terisi otomatis — tidak perlu diketik.
              </p>
            </div>

            {gambarQr && (
              <a className="btn btn-block" href={gambarQr} download={`qris-${pesanan.kode_unik}.png`}>
                <Icon name="download-outline" size={15} /> Simpan gambar QR
              </a>
            )}
          </div>

          <div className="bayar-rincian">
            <span className={`bayar-status bayar-status-${pesanan.status}`}>
              {LABEL_STATUS[pesanan.status] ?? pesanan.status}
            </span>

            <p className="bayar-total-label">Bayar tepat sejumlah</p>
            <p className="bayar-total">
              {rupiah(pesanan.total)}
              <button type="button" onClick={salinNominal} title="Salin nominal">
                <Icon name="copy-outline" size={15} />
              </button>
            </p>

            {/* Tiga angka terakhir adalah inti dari seluruh alur ini, jadi
                dijelaskan terang-terangan, bukan disembunyikan sebagai
                "biaya admin" seperti kebiasaan sebagian toko online. */}
            <div className="bayar-kode">
              <Icon name="key-outline" size={15} />
              <div>
                <strong>Tiga angka terakhir ({pesanan.kode_unik}) jangan dibulatkan.</strong>
                <span>
                  Angka itu yang kami pakai untuk mengenali pembayaran kamu di
                  mutasi rekening. Kalau nominalnya dibulatkan, kami tidak bisa
                  memastikan transfer itu milik siapa.
                </span>
              </div>
            </div>

            <dl className="bayar-daftar">
              <div><dt>Paket</dt><dd>{paket.find((p) => p.key === pesanan.paket_key)?.nama ?? pesanan.paket_key}</dd></div>
              <div><dt>Periode</dt><dd>{pesanan.periode === 'tahunan' ? '12 bulan' : '1 bulan'}</dd></div>
              <div><dt>Harga paket</dt><dd>{rupiah(pesanan.harga_dasar)}</dd></div>
              {(pesanan.addons || []).map(a => <div key={a.key}><dt>{a.nama} ×{a.quantity}</dt><dd>{rupiah(a.harga_bulanan * a.quantity * (pesanan.periode === 'tahunan' ? 12 : 1))}</dd></div>)}
              <div><dt>Kode unik</dt><dd>+{pesanan.kode_unik}</dd></div>
              <div><dt>Berlaku sampai</dt><dd>{sisaWaktu(pesanan.kadaluarsa_at) ? `${sisaWaktu(pesanan.kadaluarsa_at)} lagi` : 'Sudah lewat'}</dd></div>
            </dl>

            {pesanan.status === 'menunggu' && (
              <>
                <input
                  ref={inputBerkas}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={unggahBukti}
                  hidden
                />
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={sibuk}
                  onClick={() => inputBerkas.current?.click()}
                >
                  <Icon name="cloud-upload-outline" size={16} />
                  {sibuk ? ' Mengunggah...' : ' Saya sudah transfer, unggah bukti'}
                </button>
                <button type="button" className="btn btn-block" disabled={sibuk} onClick={batalkan}>
                  Batalkan pesanan
                </button>
              </>
            )}

            {pesanan.status === 'diperiksa' && (
              <div className="alert alert-info">
                <Icon name="time-outline" size={14} />{' '}
                Bukti sudah kami terima. Pengecekannya manual, jadi mohon
                tunggu — paketmu aktif begitu pembayarannya cocok. Kamu tidak
                perlu mengirim ulang.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Pilih paket</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Untuk workspace <strong>{tenant?.name}</strong>. Paket berlaku per
              workspace, bukan per akun.
            </p>

            <div className="segmen" role="group" aria-label="Periode" style={{ marginBottom: 14 }}>
              <button type="button" aria-pressed={periode === 'bulanan'} onClick={() => setPeriode('bulanan')}>Bulanan</button>
              <button type="button" aria-pressed={periode === 'tahunan'} onClick={() => setPeriode('tahunan')}>Tahunan</button>
            </div>

            <div className="bayar-paket-grid">
              {paket.filter((p) => Number(p.harga_bulanan) > 0).map((p) => {
                const harga = Number(periode === 'tahunan' ? p.harga_tahunan : p.harga_bulanan)
                return (
                  <button
                    key={p.key}
                    type="button"
                    className={`bayar-paket${p.key === pilihPaket ? ' terpilih' : ''}`}
                    aria-pressed={p.key === pilihPaket}
                    onClick={() => setPilihPaket(p.key)}
                  >
                    <strong>{p.nama}</strong>
                    <b>{rupiah(harga)}</b>
                    <span>{p.deskripsi}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>{addons.map(a => <label key={a.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span>{a.nama} · {rupiah(a.harga_bulanan)}/bulan</span><select aria-label={'Jumlah ' + a.nama} value={quantities[a.key] || 0} onChange={e => setQuantities({ ...quantities, [a.key]: Number(e.target.value) })}>{Array.from({length:11}, (_,n) => <option key={n} value={n}>{n === 0 ? 'Tidak perlu' : n + ' unit'}</option>)}</select></label>)}</div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 14 }}
              disabled={sibuk || !hargaTerpilih || !pengaturan?.qris_payload}
              onClick={buatTagihan}
            >
              {sibuk ? 'Menyiapkan...' : `Lanjut bayar ${hargaTerpilih ? rupiah(hargaTerpilih + addonTotal) : ''}`}
            </button>

            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
              Pembayaran lewat QRIS ke rekening {pengaturan?.nama_merchant || 'kami'}.
              Verifikasinya manual oleh tim kami, bukan otomatis — paket aktif
              setelah pembayaran dicocokkan.
            </p>
          </div>
        </>
      )}

      {riwayat.length > 0 && (
        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Riwayat pesanan</p>
          <div className="bayar-riwayat">
            {riwayat.map((o) => (
              <div key={o.id} className="bayar-riwayat-baris">
                <span className={`bayar-status bayar-status-${o.status}`}>
                  {LABEL_STATUS[o.status] ?? o.status}
                </span>
                <span>{paket.find((p) => p.key === o.paket_key)?.nama ?? o.paket_key}</span>
                <span>{o.periode === 'tahunan' ? '12 bulan' : '1 bulan'}</span>
                <strong>{rupiah(o.total)}</strong>
                <small>{new Date(o.created_at).toLocaleDateString('id-ID')}</small>
                {o.catatan_operator && <em title={o.catatan_operator}>{o.catatan_operator}</em>}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 14 }}>
        Ada kendala pembayaran? <Link to="/settings">Buka pengaturan workspace</Link> untuk
        melihat paket yang sedang aktif.
      </p>

      {tanya.dialog}
    </AppShell>
  )
}
