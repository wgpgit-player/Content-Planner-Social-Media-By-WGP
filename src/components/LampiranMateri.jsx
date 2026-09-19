import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { unggahMateri, urlMateri, hapusMateri, ukuranTerbaca, JENIS_DITERIMA } from '../lib/materi'
import { useConfirm } from '../lib/useConfirm'

// Lampiran materi di halaman brief.
//
// Ini bagian yang membuat alur persetujuan berarti. Sebelum ada ini, staff
// tidak punya tempat menaruh hasil desainnya, dan yang menyetujui hanya
// melihat judul — jadi "Setujui" sebenarnya menyetujui sebuah deskripsi,
// bukan karyanya.
//
// Dua jalur, dan keduanya disediakan dengan sengaja:
//
//   Unggah   untuk gambar yang perlu DILIHAT saat ditinjau. Dikecilkan di
//            peramban, disimpan di bucket privat, ditampilkan lewat URL
//            bertanda tangan yang kedaluwarsa sendiri.
//
//   Tautan   untuk materi yang memang tinggal di Canva atau Drive, dan
//            untuk video yang tidak bisa diunggah ke sini. Canva tidak
//            bisa disematkan, jadi jalur ini selalu berupa tombol.

export default function LampiranMateri({ contentId, nilai, onBerubah }) {
  const { tenantId } = useTenantContext()
  const tanya = useConfirm()
  const inputRef = useRef(null)

  const [pratinjau, setPratinjau] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const [seret, setSeret] = useState(false)
  const [tautan, setTautan] = useState(nilai?.asset_url ?? '')

  useEffect(() => { setTautan(nilai?.asset_url ?? '') }, [nilai?.asset_url])

  const muatPratinjau = useCallback(async () => {
    if (!nilai?.asset_path) { setPratinjau(null); return }
    setPratinjau(await urlMateri(nilai.asset_path))
  }, [nilai?.asset_path])

  useEffect(() => { muatPratinjau() }, [muatPratinjau])

  async function terimaBerkas(file) {
    setSibuk(true)
    setGalat(null)

    const hasil = await unggahMateri({ file, tenantId, contentItemId: contentId })

    if (hasil.error) { setSibuk(false); setGalat(hasil.error); return }

    // Berkas lama dibuang setelah yang baru berhasil naik, bukan sebelumnya.
    // Kalau urutannya dibalik dan unggahannya gagal, konten kehilangan
    // materinya tanpa penggantinya pernah ada.
    const lama = nilai?.asset_path

    const { error } = await supabase
      .from('content_items')
      .update({ asset_path: hasil.path, asset_mime: hasil.mime, asset_size: hasil.size })
      .eq('id', contentId)
      .eq('tenant_id', tenantId)

    if (error) { setSibuk(false); setGalat(error.message); return }

    if (lama) await hapusMateri(lama)

    setSibuk(false)
    onBerubah?.()
  }

  async function lepasMateri() {
    const yakin = await tanya.ask({ title: 'Hapus materi ini?', description: 'Gambar yang sudah diunggah akan dihapus dari penyimpanan.' })
    if (!yakin) return

    setSibuk(true)
    const path = nilai?.asset_path

    const { error } = await supabase
      .from('content_items')
      .update({ asset_path: null, asset_mime: null, asset_size: null })
      .eq('id', contentId)
      .eq('tenant_id', tenantId)

    if (error) { setSibuk(false); setGalat(error.message); return }

    if (path) await hapusMateri(path)
    setSibuk(false)
    setPratinjau(null)
    onBerubah?.()
  }

  async function simpanTautan() {
    setSibuk(true)
    setGalat(null)
    const { error } = await supabase
      .from('content_items')
      .update({ asset_url: tautan.trim() || null })
      .eq('id', contentId)
      .eq('tenant_id', tenantId)
    setSibuk(false)
    if (error) { setGalat(error.message); return }
    onBerubah?.()
  }

  const adaSesuatu = Boolean(nilai?.asset_path || nilai?.asset_url)

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <Icon name="image-outline" size={16} color="var(--text-secondary)" />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Materi</p>
        {!adaSesuatu && (
          <span
            className="chip"
            style={{ marginLeft: 'auto', background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent' }}
          >
            Belum ada
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.55 }}>
        Yang dilampirkan di sini muncul saat konten ditinjau, di grid, dan di
        halaman klien. Tanpa ini, yang menyetujui hanya melihat judulnya.
      </p>

      {galat && <p className="alert alert-error" style={{ marginBottom: 12 }}>{galat}</p>}

      {pratinjau ? (
        <div style={{ marginBottom: 12 }}>
          <img
            src={pratinjau}
            alt="Materi konten"
            style={{
              width: '100%', maxHeight: 340, objectFit: 'contain',
              borderRadius: 12, background: 'var(--surface-1)',
              border: '0.5px solid var(--border)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {ukuranTerbaca(nilai?.asset_size)}
            </span>
            <button type="button" className="btn btn-sm" disabled={sibuk}
              onClick={() => inputRef.current?.click()} style={{ marginLeft: 'auto' }}>
              Ganti
            </button>
            <button type="button" className="btn btn-sm btn-ghost" disabled={sibuk}
              onClick={lepasMateri} style={{ color: 'var(--danger)' }}>
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`jatuhkan${seret ? ' aktif' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setSeret(true) }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSeret(false)
            const file = e.dataTransfer.files?.[0]
            if (file) terimaBerkas(file)
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        >
          <Icon name={sibuk ? 'hourglass-outline' : 'cloud-upload-outline'} size={26} color="var(--text-muted)" />
          <p style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>
            {sibuk ? 'Mengunggah...' : 'Ketuk untuk memilih gambar'}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.55 }}>
            JPG, PNG, WebP, atau GIF. Gambar dikecilkan otomatis di perangkatmu
            sebelum dikirim, jadi yang tersimpan salinan untuk ditinjau — bukan
            berkas aslinya.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={JENIS_DITERIMA}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Nilainya dikosongkan supaya memilih berkas yang sama dua kali
          // tetap memicu onChange.
          e.target.value = ''
          if (file) terimaBerkas(file)
        }}
      />

      <div style={{ paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
        <label className="field-label" htmlFor="lm-tautan">Atau tautan ke Canva, Drive, atau video</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="lm-tautan"
            className="input"
            type="url"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
            onBlur={simpanTautan}
            placeholder="https://"
          />
          {nilai?.asset_url && (
            <a
              href={nilai.asset_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <Icon name="open-outline" size={15} />
            </a>
          )}
        </div>
        <p className="field-hint">
          Tautan Canva tidak bisa ditampilkan sebagai gambar — ia selalu
          membuka Canva. Kalau materinya perlu dilihat langsung saat
          ditinjau, unggah gambarnya di atas.
        </p>
      </div>

      {tanya.dialog}
    </div>
  )
}
