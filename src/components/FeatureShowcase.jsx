import { useState } from 'react'
import { useBahasa } from '../lib/bahasa'
import CampaignArt from './CampaignArt'

// Penjelajah fitur bertab.
//
// Tiga tab, dan panel di sebelahnya menampilkan tiruan tampilan fitur yang
// sedang dipilih. Tirunya sengaja tidak berupa tangkapan layar: tangkapan
// layar akan usang tiap kali aplikasinya berubah, sedangkan tiruan yang
// dibangun dari elemen halaman ikut mengikuti warna dan tipografi merek.
//
// Navigasi papan ketik dibuat mengikuti pola tablist yang lazim — panah kiri
// dan kanan berpindah tab, Home dan End melompat ke ujung — supaya orang yang
// tidak memakai tetikus tetap bisa menjelajahinya.

export default function FeatureShowcase() {
  const { t } = useBahasa()
  const [aktif, setAktif] = useState(0)
  const [day, setDay] = useState(1)
  const [approved, setApproved] = useState(false)

  const fitur = [
    [
      t('Kalender', 'Calendar'),
      t('Satu bulan penuh dalam satu layar.', 'A full month on one screen.'),
      t('Tetapkan tanggal tayang dan platform tiap konten. Seluruh agenda tim terbaca sekaligus.',
        'Set the publish date and platform for each piece. The whole team’s schedule reads at a glance.'),
    ],
    [
      t('Brief', 'Brief'),
      t('Arahan jelas, eksekusi tanpa tebak-tebakan.', 'Clear direction, no guesswork.'),
      t('Referensi, caption, dan materi pendukung tersimpan menyatu dengan kontennya.',
        'References, captions, and supporting assets all live with the content itself.'),
    ],
    [
      t('Review', 'Review'),
      t('Masukan yang bisa langsung ditindaklanjuti.', 'Feedback you can act on.'),
      t('Bagikan satu tautan kepada klien. Catatan dan persetujuannya melekat pada kontennya.',
        'Share one link with the client. Notes and approvals stay attached to the content.'),
    ],
  ]

  function onKey(e) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const n = e.key === 'Home' ? 0
      : e.key === 'End' ? 2
      : (aktif + (e.key === 'ArrowRight' ? 1 : 2)) % 3
    setAktif(n)
    document.getElementById('feature-tab-' + n)?.focus()
  }

  return (
    <div className="feature-showcase">
      <div className="feature-picker">
        <div role="tablist" aria-label={t('Jelajahi fitur', 'Explore features')} onKeyDown={onKey}>
          {fitur.map(([nama], i) => (
            <button
              key={nama}
              role="tab"
              id={'feature-tab-' + i}
              aria-selected={aktif === i}
              aria-controls="feature-panel"
              tabIndex={aktif === i ? 0 : -1}
              onClick={() => setAktif(i)}
            >
              {nama}
            </button>
          ))}
        </div>
        <h3>{fitur[aktif][1]}</h3>
        <p>{fitur[aktif][2]}</p>
        <span className="feature-demo-label">{t('Pratinjau fitur', 'Feature preview')}</span>
      </div>

      <div
        role="tabpanel"
        id="feature-panel"
        aria-labelledby={'feature-tab-' + aktif}
        tabIndex="0"
        className="feature-stage"
      >
        <div key={aktif} className={'feature-scene scene-' + aktif}>
          {aktif === 0 ? (
            <>
              <div className="demo-top">
                <strong>{t('Agenda Oktober', 'October schedule')}</strong>
                <span>{t('Tim kreatif', 'Creative team')}</span>
              </div>
              <div className="demo-week">
                {(t(['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])).map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="demo-calendar">
                {Array.from({ length: 10 }, (_, i) => (
                  <button type="button" key={i} aria-pressed={day === i} onClick={() => setDay(i)} aria-label={t('Lihat agenda tanggal ', 'View schedule for ') + (i + 12)}>
                    <small>{i + 12}</small>
                    {[1, 3, 5, 8].includes(i) && (
                      <span className={'demo-event event-' + i}>
                        {t(
                          { 1: 'Foto produk', 3: 'Cerita brand', 5: 'Tips singkat', 8: 'Peluncuran' },
                          { 1: 'Product shoot', 3: 'Brand story', 5: 'Quick tips', 8: 'Launch' },
                        )[i]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="calendar-selection"><CampaignArt tile={day % 9}/><div><strong>{t('Agenda ', 'Schedule ') + (day + 12)} Oktober</strong><span>{t('Satu ide, lengkap dengan materi dan timnya.', 'One idea, with its assets and team.')}</span></div><span className="calendar-dot">✓</span></div>
            </>
          ) : aktif === 1 ? (
            <>
              <div className="demo-top">
                <strong>{t('Cerita di balik produk', 'The story behind the product')}</strong>
                <span>{t('Dalam produksi', 'In production')}</span>
              </div>
              <div className="demo-brief">
                <CampaignArt tile={0} className="demo-art" label={t('Contoh foto produk fashion', 'Sample fashion product photo')}/>
                <div>
                  <small>{t('Tujuan konten', 'Objective')}</small>
                  <p>{t('Memperkenalkan proses kreatif di balik koleksi terbaru.',
                        'Introduce the creative process behind the new collection.')}</p>
                  <small>{t('Format', 'Format')}</small>
                  <p>{t('Carousel Instagram', 'Instagram carousel')}</p>
                  <div className="demo-people">
                    <b>NA</b>
                    <span>{t('Nadia mengerjakan desain', 'Nadia is handling design')}</span>
                  </div>
                </div>
              </div>
              <div className="demo-note">{t('Arahan dan materi siap dikerjakan.', 'Direction and assets ready to work on.')}</div>
            </>
          ) : (
            <>
              <div className="demo-top">
                <strong>{t('Review koleksi terbaru', 'New collection review')}</strong>
                <span>{t('Tautan review klien', 'Client review link')}</span>
              </div>
              <div className="demo-feedback">
                <div className="demo-people">
                  <b>RA</b><strong>Rani</strong><small>{t('Klien', 'Client')}</small>
                </div>
                <p>{t('Visualnya sudah sesuai. Bisakah foto detail produk dipindah ke slide kedua?',
                      'The visuals work well. Could the product detail shot move to the second slide?')}</p>
                <div className="demo-reply">{t('Sudah kami sesuaikan.', 'Updated as requested.')}</div>
                <button type="button" className="demo-approve-action" onClick={() => setApproved(!approved)} aria-pressed={approved}>{approved ? t('✓ Disetujui. Siap ke langkah berikutnya!', '✓ Approved. Ready for the next step!') : t('Coba setujui konten', 'Try approving the content')}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
