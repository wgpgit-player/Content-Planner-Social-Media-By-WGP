import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBahasa } from '../lib/bahasa'

// Panduan mengambang di sudut halaman publik, plus efek kursor opsional.
//
// KENAPA DISEBUT PANDUAN, BUKAN CHAT
//
// Bentuknya mirip widget obrolan, dan itu berisiko membuat orang mengira ada
// admin atau AI yang menunggu di ujung sana lalu menunggu jawaban yang tidak
// akan datang. Karena itu ada satu baris di bawahnya yang menyatakan terus
// terang bahwa ini pilihan topik otomatis, dan tautan ke WhatsApp disediakan
// bagi yang memang ingin berbicara dengan manusia.
//
// Efek kursor aktif di halaman publik untuk pointer presisi; preferensi
// pengurangan gerakan dan perangkat sentuh tetap dihormati.

export default function StudioInteractions({ inApp = false }) {
  const { t } = useBahasa()
  const [buka, setBuka] = useState(false)
  const [topik, setTopik] = useState('mulai')
  const kursor = !inApp

  const dialog = useRef(null)
  const cincin = useRef(null)
  const pemicu = useRef(null)

  const jawaban = {
    mulai: {
      label: t('Mulai dari mana?', 'Where do I start?'),
      teks: t('Sudah punya ide? Buka Susun konten. Kalau masih mencari arah, mulai dari Bank ide, atau coba Meja ide pada halaman ini.',
              'Already have an idea? Open the composer. Still looking for direction, start from the idea bank, or try the idea desk on this page.'),
      tautan: '/signup',
      aksi: t('Buat ruang kerja', 'Create a workspace'),
    },
    paket: {
      label: t('Memilih paket', 'Choosing a plan'),
      teks: t('Seluruh fitur perencanaan tersedia di semua paket. Yang membedakan hanya kapasitas penyimpanan dan jumlah anggota tim.',
              'All planning features are included on every plan. Only storage capacity and team size differ.'),
      tautan: '/tentang#paket',
      aksi: t('Lihat harga', 'View pricing'),
    },
    review: {
      label: t('Review klien', 'Client review'),
      teks: t('Bagikan satu tautan review agar klien dapat memberi catatan dan persetujuan tanpa membuat akun.',
              'Share a single review link so clients can leave notes and approve without creating an account.'),
      tautan: '/tentang#fitur',
      aksi: t('Kenali fiturnya', 'See the features'),
    },
    terbit: {
      label: t('Bisa terbit otomatis?', 'Can it auto-publish?'),
      teks: t('Siapkan konten hingga siap tayang bersama tim, lalu publikasikan melalui platform pilihanmu. Integrasi penerbitan otomatis masuk rencana pengembangan kami.',
              'Prepare content with your team, then publish through your chosen platform. Automatic publishing is on our development roadmap.'),
      tautan: '/tentang#pertanyaan',
      aksi: t('Baca pertanyaan lain', 'Read other questions'),
    },
  }

  useEffect(() => {
    if (buka && !dialog.current.open) dialog.current.showModal()
    else if (!buka && dialog.current.open) dialog.current.close()
  }, [buka])

  useEffect(() => {
    if (!kursor) return
    const media = matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)')
    let frame = 0

    const gerak = (e) => {
      if (!media.matches) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (cincin.current) {
          cincin.current.style.transform = `translate3d(${e.clientX - 16}px,${e.clientY - 16}px,0)`
          cincin.current.style.opacity = '1'
        }
      })
    }
    const sembunyi = () => { if (cincin.current) cincin.current.style.opacity = '0' }

    window.addEventListener('pointermove', gerak, { passive: true })
    document.addEventListener('pointerleave', sembunyi)
    window.addEventListener('blur', sembunyi)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', gerak)
      document.removeEventListener('pointerleave', sembunyi)
      window.removeEventListener('blur', sembunyi)
    }
  }, [kursor])

  useEffect(() => {
    if (!buka) return
    const sebelum = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = sebelum }
  }, [buka])

  function tutup() {
    setBuka(false)
    pemicu.current?.focus()
  }

  const jwb = jawaban[topik]

  return (
    <>
      <div className="studio-tools">
        <button ref={pemicu} className="guide-trigger" title={t('Butuh arahan?', 'Need guidance?')} onClick={() => setBuka(true)} aria-haspopup="dialog">
          <img src="/brand/plannersm-icon.svg" alt="" />
          {t('Butuh arahan?', 'Need guidance?')}
        </button>
      </div>

      {kursor && <div ref={cincin} className="creative-cursor" aria-hidden="true" />}

      <dialog
        ref={dialog}
        className="studio-guide"
        aria-labelledby="guide-title"
        onCancel={tutup}
        onClose={() => setBuka(false)}
        onClick={(e) => { if (e.target === dialog.current) tutup() }}
      >
        <div className="guide-heading">
          <div>
            <span>{t('Panduan plannersm', 'plannersm guide')}</span>
            <h2 id="guide-title">{t('Apa yang sedang Anda cari?', 'What are you looking for?')}</h2>
          </div>
          <button autoFocus onClick={tutup} aria-label={t('Tutup panduan', 'Close guide')}>×</button>
        </div>

        <div className="guide-welcome">
          <img src="/images/creative-guide.png" alt="" />
          <p>{t(<>Pilih salah satu topik.<br />Kami mulai dari yang Anda butuhkan.</>,
                <>Pick a topic.<br />We will start from what you need.</>)}</p>
        </div>

        <div className="guide-topics">
          {Object.entries(jawaban).map(([kunci, a]) => (
            <button key={kunci} aria-pressed={topik === kunci} onClick={() => setTopik(kunci)}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="guide-answer" aria-live="polite">
          <p>{jwb.teks}</p>
          <Link onClick={tutup} to={inApp && topik === 'mulai' ? '/compose' : jwb.tautan}>
            {inApp && topik === 'mulai' ? t('Susun konten', 'Build content') : jwb.aksi}
          </Link>
        </div>

        <p className="guide-disclosure">
          {t('Panduan otomatis berbasis topik. Bukan chat AI, dan bukan admin yang sedang daring.',
             'Automated topic guide. Not an AI chat, and not a live agent.')}
        </p>

        <a className="guide-contact" href="https://wa.me/6285111037992" target="_blank" rel="noopener noreferrer">
          {t('Bicara dengan tim kami', 'Talk to our team')}
        </a>
      </dialog>
    </>
  )
}
