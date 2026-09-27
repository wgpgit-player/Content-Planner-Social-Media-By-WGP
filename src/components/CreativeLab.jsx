import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBahasa } from '../lib/bahasa'
import CampaignArt from './CampaignArt'

// "Meja ide": contoh interaktif di halaman jualan.
//
// Pengunjung memilih arah cerita dan mood visual, lalu melihat hasilnya
// terbentuk seketika. Tujuannya bukan memamerkan animasi, melainkan memberi
// pengalaman kecil memakai produk sebelum mendaftar — dan itu jauh lebih
// meyakinkan daripada daftar fitur.
//
// Disebutkan terang-terangan di bawahnya bahwa ini contoh dan tidak tersimpan
// ke mana pun, supaya tidak ada yang mengira pekerjaannya hilang.

export default function CreativeLab({ inApp = false }) {
  const { t } = useBahasa()
  const [jenis, setJenis] = useState('brand')
  const [mood, setMood] = useState('playful')
  const [tersalin, setTersalin] = useState(false)
  const [galat, setGalat] = useState('')

  const ide = {
    brand: [
      t('Cerita di balik produk', 'The story behind the product'),
      t('Tunjukkan satu detail yang jarang diperhatikan pelanggan, lalu jelaskan alasan tim Anda memilihnya.',
        'Show one detail customers rarely notice, then explain why your team chose it.'),
      t('Carousel', 'Carousel'),
      t('Kenali lebih dekat', 'Get to know us'),
    ],
    edukasi: [
      t('Satu salah kaprah, satu penjelasan', 'One misconception, one explanation'),
      t('Buka dengan pertanyaan yang paling sering muncul. Jawab ringkas, lalu beri contoh yang mudah dipraktikkan.',
        'Open with the question you get most. Answer briefly, then give an example that is easy to try.'),
      t('Video pendek', 'Short video'),
      t('Simpan untuk nanti', 'Save for later'),
    ],
    komunitas: [
      t('Giliran audiens bersuara', 'Let the audience decide'),
      t('Tawarkan dua versi ide dan minta audiens memilih. Umumkan pilihan tim Anda, lalu lanjutkan percakapannya.',
        'Offer two versions and ask the audience to pick. Announce your team’s choice, then keep the conversation going.'),
      t('Story', 'Story'),
      t('Mana pilihan Anda?', 'Which one would you pick?'),
    ],
  }

  const [judul, brief, format, cta] = ide[jenis]

  async function salin() {
    try {
      await navigator.clipboard.writeText(`${judul}\n${brief}\nFormat: ${format}\nCTA: ${cta}`)
      setTersalin(true)
      setGalat('')
    } catch {
      setGalat(t('Penyalinan tidak diizinkan browser. Silakan pilih dan salin teks brief secara manual.',
                 'Your browser blocked copying. Please select and copy the brief manually.'))
    }
  }

  // Kemiringan halus mengikuti kursor. Dimatikan pada perangkat sentuh dan
  // untuk orang yang meminta gerakan dikurangi.
  function gerakkan(e) {
    if (!window.matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--art-turn', ((e.clientX - r.left) / r.width - 0.5) * 5 + 'deg')
    e.currentTarget.style.setProperty('--art-lift', ((e.clientY - r.top) / r.height - 0.5) * -8 + 'px')
  }

  function kembalikan(e) {
    e.currentTarget.style.setProperty('--art-turn', '0deg')
    e.currentTarget.style.setProperty('--art-lift', '0px')
  }

  return (
    <section
      onPointerMove={gerakkan}
      onPointerLeave={kembalikan}
      className={'creative-lab' + (inApp ? ' creative-lab-app' : '')}
      aria-label={t('Coba susun ide konten', 'Try building a content idea')}
    >
      <div className="lab-intro">
        <span className="lab-label">{t('Ruang coba', 'Try it out')}</span>
        <h2>{t(<>Coba dulu.<br />Tanpa mendaftar.</>, <>Try it first.<br />No sign-up needed.</>)}</h2>
        <p>{t('Pilih arah cerita dan mood visualnya. Hasilnya terbentuk seketika, siap dibawa ke rencana konten Anda.',
              'Choose a story angle and a visual mood. The result forms instantly, ready to bring into your content plan.')}</p>
        <img
          src="/images/creative-guide.png"
          alt={t('Ilustrasi kreator membawa tablet dan kartu ide',
                 'Illustration of a creator holding a tablet and idea cards')}
          width="500" height="500" loading="lazy"
        />
      </div>

      <div className="lab-workbench">
        <div className="lab-toolbar">
          <span><i />{t('Meja ide Anda', 'Your idea desk')}</span>
          <small>{t('Contoh interaktif', 'Interactive example')}</small>
        </div>

        <fieldset>
          <legend>{t('Apa yang ingin diceritakan?', 'What do you want to talk about?')}</legend>
          <div className="lab-options">
            {[
              ['brand', t('Brand Anda', 'Your brand')],
              ['edukasi', t('Berbagi pengetahuan', 'Share knowledge')],
              ['komunitas', t('Ajak audiens bicara', 'Engage the audience')],
            ].map(([k, l]) => (
              <button
                type="button" key={k} aria-pressed={jenis === k}
                onClick={() => { setJenis(k); setTersalin(false); setGalat('') }}
              >{l}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{t('Pilih mood visual', 'Choose a visual mood')}</legend>
          <div className="lab-moods">
            {[['playful', 'Playful'], ['fresh', 'Fresh'], ['bold', 'Bold']].map(([k, l]) => (
              <button
                type="button" className={'mood-' + k} key={k}
                aria-label={t('Mood ' + l, l + ' mood')}
                aria-pressed={mood === k}
                onClick={() => setMood(k)}
              ><i />{l}</button>
            ))}
          </div>
        </fieldset>

        <div className={'lab-poster mood-' + mood} key={jenis + mood}>
          <span>{format}</span>
          <h3>{judul}</h3>
          <CampaignArt tile={jenis === 'brand' ? 0 : jenis === 'edukasi' ? 7 : 4} className="lab-campaign-art"/>
          <small>{cta}</small>
        </div>

        <div className="lab-brief">
          <strong>{t('Ringkasan brief', 'Brief summary')}</strong>
          <p>{brief}</p>
        </div>

        <div className="lab-actions">
          <button type="button" onClick={salin}>
            {tersalin ? t('Brief tersalin ✓', 'Brief copied ✓') : t('Salin brief', 'Copy brief')}
          </button>
          <Link to={inApp ? `/compose?ide=${encodeURIComponent(judul + '. ' + brief)}` : '/signup'}>
            {inApp ? t('Susun konten ini', 'Build this content') : t('Buat versi Anda', 'Make your own')}
          </Link>
        </div>

        <p className="lab-feedback" role="status">
          {galat || (tersalin
            ? t('Siap ditempelkan ke rencana konten Anda.', 'Ready to paste into your content plan.')
            : t('Contoh template. Pilihan ini tidak disimpan ke ruang kerja mana pun.',
                'Example template. These choices are not saved to any workspace.'))}
        </p>
      </div>
    </section>
  )
}
