import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from './Sheet'
import Icon from './Icon'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { JENIS_EVENT } from '../lib/useAgenda'
import { isoDate } from '../lib/dates'
import { useConfirm } from '../lib/useConfirm'

// Baris agenda di atas kalender.
//
// Isinya dua hal yang bagi pengguna terasa sama: hari penting dari katalog
// bersama, dan kegiatan milik workspace sendiri. Keduanya menjawab
// pertanyaan "ada apa hari itu", jadi ditaruh berdampingan.
//
// Ini yang membuat kalender tidak lagi kosong sejak hari pertama. Kalender
// kosong tidak mengajari apa pun; kalender yang sudah menunjukkan bahwa
// tanggal 17 Agustus dan 11 November itu penting langsung memberi alasan
// untuk mulai merencanakan.
//
// Hari besar Islam ditandai "perkiraan" dengan sengaja. Tanggal resminya
// ditetapkan sidang isbat dan bisa bergeser sehari — menampilkannya
// seolah-olah pasti akan membuat orang menjadwalkan konten Lebaran di hari
// yang salah.

export default function BarisAgenda({ tanggalTerlihat, agendaPerTanggal, onBerubah }) {
  const { user } = useAuth()
  const { tenantId } = useTenantContext()
  const navigate = useNavigate()
  const tanya = useConfirm()

  const [detail, setDetail] = useState(null)
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)

  const [judul, setJudul] = useState('')
  const [jenis, setJenis] = useState('shoot')
  const [tanggal, setTanggal] = useState(() => isoDate(new Date()))
  const [sampai, setSampai] = useState('')
  const [catatan, setCatatan] = useState('')

  function bukaForm(isoAwal) {
    setJudul(''); setJenis('shoot'); setSampai(''); setCatatan('')
    setTanggal(isoAwal ?? isoDate(new Date()))
    setGalat(null)
    setFormTerbuka(true)
  }

  async function simpan(e) {
    e.preventDefault()
    if (!judul.trim()) return

    setSibuk(true)
    setGalat(null)

    const { error } = await supabase.from('calendar_events').insert({
      tenant_id: tenantId,
      title: judul.trim(),
      event_type: jenis,
      event_date: tanggal,
      end_date: sampai || null,
      note: catatan.trim() || null,
      created_by: user?.id ?? null,
    })

    setSibuk(false)
    if (error) { setGalat(error.message); return }

    setFormTerbuka(false)
    onBerubah?.()
  }

  async function hapusEvent(eventId) {
    const yakin = await tanya.ask({ title: 'Hapus kegiatan ini?', description: 'Hilang dari kalender untuk semua anggota tim.' })
    if (!yakin) return

    const { error } = await supabase
      .from('calendar_events').delete().eq('id', eventId).eq('tenant_id', tenantId)

    if (error) { setGalat(error.message); return }
    setDetail(null)
    onBerubah?.()
  }

  return (
    <>
      <div className="cal-grid agenda-baris">
        <div className="agenda-label">
          <span>Agenda</span>
          <button
            type="button"
            onClick={() => bukaForm()}
            className="agenda-tambah"
            aria-label="Tambah kegiatan"
            title="Tambah kegiatan"
          >
            <Icon name="add-outline" size={13} />
          </button>
        </div>

        {tanggalTerlihat.map((d) => {
          const iso = isoDate(d)
          const isi = agendaPerTanggal[iso] ?? []
          return (
            <div key={iso} className="agenda-sel" onDoubleClick={() => bukaForm(iso)}>
              {isi.length === 0 ? (
                <button
                  type="button"
                  className="agenda-kosong"
                  onClick={() => bukaForm(iso)}
                  aria-label={`Tambah kegiatan pada ${iso}`}
                >
                  +
                </button>
              ) : (
                isi.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`agenda-pil${a.saran ? ' agenda-pil-saran' : ''}`}
                    onClick={() => {
                      // Ide konten harian bukan sesuatu untuk "dilihat detailnya"
                      // seperti hari penting atau kegiatan — satu-satunya hal
                      // yang masuk akal dilakukan dengan ide adalah memakainya,
                      // jadi langsung ke Susun konten dengan judul dan tanggal
                      // sudah terisi, bukan membuka sheet.
                      if (a.saran) {
                        navigate(`/compose?ide=${encodeURIComponent(a.judul)}&tanggal=${iso}`)
                        return
                      }
                      setDetail(a)
                    }}
                    style={{
                      background: `color-mix(in srgb, ${a.warna} 13%, #fff)`,
                      color: a.warna,
                    }}
                    title={a.saran ? `Ide konten: ${a.judul} — klik untuk memakainya` : a.judul}
                  >
                    {a.jenis === 'event' && <Icon name={a.icon} size={10} color={a.warna} />}
                    {a.saran && <Icon name="bulb-outline" size={10} color={a.warna} />}
                    <span className="agenda-pil-teks">{a.judul}</span>
                  </button>
                ))
              )}
            </div>
          )
        })}
      </div>

      {galat && <p className="alert alert-error" style={{ marginTop: 10 }}>{galat}</p>}

      {detail && (
        <Sheet open onClose={() => setDetail(null)} title={detail.judul} lebar={380}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
            <span
              className="chip"
              style={{
                background: `color-mix(in srgb, ${detail.warna} 13%, #fff)`,
                color: detail.warna,
                borderColor: 'transparent',
              }}
            >
              {detail.jenis === 'event' ? detail.tipeLabel : detail.kategori}
            </span>
            {detail.perkiraan && (
              <span className="chip" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent' }}>
                Tanggal perkiraan
              </span>
            )}
          </div>

          {detail.perkiraan && (
            <p className="alert alert-info" style={{ marginBottom: 12 }}>
              Tanggal resminya ditetapkan lewat sidang isbat mendekati harinya
              dan bisa bergeser sehari. Jangan kunci jadwal penting ke tanggal
              ini tanpa mengeceknya lagi.
            </p>
          )}

          {detail.catatan && (
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
              {detail.catatan}
            </p>
          )}

          {detail.jenis === 'event' && (
            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setDetail(null)}>Tutup</button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => hapusEvent(detail.eventId)}
              >
                Hapus kegiatan
              </button>
            </div>
          )}
        </Sheet>
      )}

      {formTerbuka && (
        <Sheet
          open
          onClose={() => setFormTerbuka(false)}
          title="Kegiatan baru"
          description="Untuk yang bukan postingan: syuting, peluncuran, tenggat laporan."
          lebar={400}
        >
          <form onSubmit={simpan}>
            <label className="field-label" htmlFor="ev-judul">Nama kegiatan</label>
            <input id="ev-judul" className="input" autoFocus value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Syuting konten Oktober"
              style={{ marginBottom: 12 }} />

            <label className="field-label" htmlFor="ev-jenis">Jenis</label>
            <select id="ev-jenis" className="select" value={jenis}
              onChange={(e) => setJenis(e.target.value)} style={{ marginBottom: 12 }}>
              {JENIS_EVENT.map((j) => <option key={j.key} value={j.key}>{j.label}</option>)}
            </select>

            <div className="sheet-kolom" style={{ marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="ev-tgl">Tanggal</label>
                <input id="ev-tgl" className="input" type="date" value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="ev-sampai">Sampai (opsional)</label>
                <input id="ev-sampai" className="input" type="date" value={sampai}
                  onChange={(e) => setSampai(e.target.value)} />
              </div>
            </div>

            <label className="field-label" htmlFor="ev-catatan">Catatan</label>
            <textarea id="ev-catatan" className="textarea" rows={3} value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Lokasi, siapa yang terlibat, apa yang perlu disiapkan."
              style={{ minHeight: 70 }} />

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setFormTerbuka(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk || !judul.trim()}>
                {sibuk ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {tanya.dialog}
    </>
  )
}
