import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBahasa } from '../lib/bahasa'
import CampaignArt from './CampaignArt'
import Icon from './Icon'

const formats = ['Instagram', 'Story', 'Reels', 'TikTok', 'X', 'Threads']
const brands = [
  { name: 'Rupa Studio', handle: 'rupastudio', label: ['Fashion', 'Fashion'], tile: 0, headline: ['Detail kecil. Cerita besar.', 'Small details. Big stories.'] },
  { name: 'Teman Pagi', handle: 'temanpagi', label: ['Kedai kopi', 'Coffee shop'], tile: 3, headline: ['Jeda sebentar, yuk.', 'Take a little break.'] },
  { name: 'Kerja Kreatif', handle: 'kerjakreatif', label: ['Agensi', 'Agency'], tile: 6, headline: ['Ide bagus layak dilihat.', 'Good ideas deserve a spotlight.'] },
]

export default function SocialPreview() {
  const { t } = useBahasa()
  const [brand, setBrand] = useState(0)
  const [format, setFormat] = useState('Instagram')
  const [selected, setSelected] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const c = brands[brand]
  const theme = ['fashion', 'coffee', 'agency'][brand]
  const titles = t(
    [['Koleksi baru', 'Nyaman seharian', 'Kenali bahannya', 'Dari sketsa', 'Gaya pilihanmu', 'Detail favorit', 'Padu padan', 'Pelengkap cerita', 'Dibuat untukmu'], ['Selamat pagi', 'Secangkir jeda', 'Dibuat sepenuh hati', 'Teman ngopi', 'Cerita di meja', 'Segar lagi', 'Dari biji pilihan', 'Proses di balik rasa', 'Sampai jumpa di sini'], ['Mulai dari ide', 'Siapkan alatmu', 'Temukan arahnya', 'Waktunya berkarya', 'Bertukar perspektif', 'Catat kemungkinan', 'Ruang untuk fokus', 'Lihat lebih dekat', 'Rayakan bersama']],
    [['New collection', 'Everyday comfort', 'Meet the fabric', 'From a sketch', 'Your style', 'Favourite details', 'Mix and match', 'The finishing touch', 'Made for you'], ['Good morning', 'A cup of calm', 'Made with care', 'Coffee companions', 'Stories at the table', 'A fresh start', 'Selected beans', 'Behind the flavour', 'See you here'], ['Start with an idea', 'Tools of the trade', 'Find your direction', 'Time to create', 'Fresh perspectives', 'Write it down', 'Space to focus', 'Look closer', 'Celebrate together']],
  )[brand]
  const short = ['Story', 'Reels', 'TikTok'].includes(format)
  const text = format === 'X' || format === 'Threads'
  function chooseFormat(value) { setFormat(value); setSelected(null); setPlaying(false); setLiked(false) }
  return <section className="pratinjau-produk social-playground reveal" id="pratinjau">
    <div className="pratinjau-copy">
      <span className="studio-section-kicker">{t('Satu ide, banyak cara tampil.', 'One idea, so many ways to show it.')}</span>
      <h2>{t(<>Feed rapi.<br />Cerita makin hidup.</>, <>A cohesive feed.<br />Stories that come alive.</>)}</h2>
      <p>{t('Jelajahi contoh kampanye. Ganti brand, pilih format, dan lihat ceritanya dari sudut yang berbeda.', 'Explore a sample campaign. Switch brands and formats to see the story from a different angle.')}</p>
      <div className="sample-formats" role="group" aria-label={t('Format contoh', 'Sample format')}>{formats.map(f => <button type="button" key={f} aria-pressed={f === format} onClick={() => chooseFormat(f)}>{f}</button>)}</div>
      <div className="pratinjau-pilih" role="group" aria-label={t('Contoh brand', 'Sample brand')}>{brands.map((b, i) => <button type="button" key={b.handle} aria-pressed={brand === i} onClick={() => { setBrand(i); setSelected(null); setLiked(false) }}>{t(...b.label)}</button>)}</div>
      <p className="sample-hint">{t('Buka salah satu desain, lalu geser untuk melihat sembilan slide kampanyenya.', 'Open a design, then browse all nine campaign slides.')}</p>
      <Link to="/signup" className="studio-button">{t('Mulai cerita brand kamu', 'Start your brand story')}</Link>
    </div>
    <div className="social-stage">
      <div className="social-sculptures" aria-hidden="true"><span className="sculpture s-instagram"><Icon name="logo-instagram" size={34}/></span><span className="sculpture s-tiktok"><Icon name="logo-tiktok" size={30}/></span><span className="sculpture s-x">𝕏</span><span className="sculpture s-threads">@</span><span className="sculpture s-play"><Icon name="play" size={26}/></span></div>
      <div className={'sample-phone' + (short ? ' is-short' : '')}>
        <div className="sample-status"><span>9:41</span><i/><span>▰</span></div>
        <div className="sample-app-title"><strong>{format}</strong><span>•••</span></div>
        <div className="sample-screen" key={format + c.handle}>
          {short ? <div className={'motion-sample' + (playing ? ' playing' : '')}>
            <CampaignArt tile={4} theme={theme} className="motion-art"/>
            <div className="motion-copy"><small>{t('Satu ide. Satu cerita.', 'One idea. One story.')}</small><h3>{t(...c.headline)}</h3></div>
            <button className="motion-control" type="button" aria-label={playing ? t('Jeda animasi', 'Pause animation') : t('Putar animasi', 'Play animation')} onClick={() => setPlaying(!playing)}><Icon name={playing ? 'pause' : 'play'} size={22}/></button>
            <div className="motion-footer"><strong>@{c.handle}</strong><p>{t('Dari proses kecil, jadi sesuatu yang berarti.', 'Small moments, something meaningful.')}</p></div>
            <div className="motion-progress"><i/></div>
          </div> : text ? <div className="sample-text-post"><div className="sample-author"><b>{c.name[0]}</b><span><strong>{c.name}</strong><small>@{c.handle}</small></span></div><p>{t(...c.headline)}</p><p>{t('Kadang yang bikin orang berhenti scroll bukan hal besar. Cukup satu detail yang terasa dekat. Apa detail favoritmu hari ini?', 'Sometimes one thoughtful detail is all it takes to stop the scroll. What caught your eye today?')}</p><CampaignArt tile={0} theme={theme}/><button className="sample-like" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? '♥' : '♡'} {t('Suka', 'Like')}</button><small>{t('Contoh postingan', 'Sample post')}</small></div> : <>
            <div className="sample-profile"><b>{c.name[0]}</b><div><strong>{c.name}</strong><small>@{c.handle}</small></div><span>9<br/><small>{t('konten', 'posts')}</small></span></div>
            {selected !== null ? <div className="sample-open">
              <button type="button" onClick={() => setSelected(null)}>← {t('Kembali ke feed', 'Back to feed')}</button>
              <div className="carousel-design"><CampaignArt tile={selected} theme={theme}/><div><small>{c.name} / {String(selected + 1).padStart(2, '0')}</small><strong>{titles[selected]}</strong></div></div>
              <div className="carousel-controls"><button type="button" aria-label={t('Slide sebelumnya', 'Previous slide')} onClick={() => setSelected((selected + 8) % 9)}>←</button><span aria-live="polite">{selected + 1} / 9</span><button type="button" aria-label={t('Slide berikutnya', 'Next slide')} onClick={() => setSelected((selected + 1) % 9)}>→</button></div>
            </div> : <div className="sample-grid">{Array.from({ length: 9 }, (_, i) => <button type="button" key={i} aria-label={t('Buka contoh konten ', 'Open sample post ') + (i + 1)} onClick={() => { setSelected(i); setLiked(false) }}><CampaignArt tile={i} theme={theme}/><span>{titles[i]}</span></button>)}</div>}
          </>}
        </div>
      </div>
    </div>
  </section>
}
