import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import CreativeLab from '../components/CampaignPlannerDemo'
import FeatureShowcase from '../components/FeatureShowcase'
import FooterSitus from '../components/FooterSitus'
import Icon from '../components/Icon'
import PratinjauProduk from '../components/SocialPreview'
import CampaignArt from '../components/CampaignArt'
import PricingSelector from '../components/PricingSelector'
import StudioInteractions from '../components/StudioInteractions'
import TombolBahasa from '../components/TombolBahasa'
import { useBahasa } from '../lib/bahasa'
import { useReveal } from '../lib/useReveal'
import '../landing-studio.css'

// Halaman depan publik plannersm.co.
//
// SOAL NASKAHNYA
//
// Versi sebelumnya memakai kalimat yang enak dibaca tapi tidak menjelaskan
// apa-apa — "Ide boleh ke mana saja, kerjanya tetap tertata". Kalimat seperti
// itu terasa hangat, tetapi orang yang sedang menimbang membeli perangkat
// lunak untuk timnya tidak mendapat satu pun keterangan darinya: dipakai
// siapa, mengerjakan apa, menggantikan apa.
//
// Naskah di sini ditulis ulang dengan satu aturan: tiap kalimat harus bisa
// menjawab "lalu apa artinya buat saya". Judul menyebut hasil, anak judul
// menyebut cara kerjanya, dan istilahnya konsisten — konten, ruang kerja,
// persetujuan — bukan berganti-ganti demi variasi.

export default function Landing() {
  const { t } = useBahasa()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [boardStep, setBoardStep] = useState(0)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    const sebelum = document.title
    document.title = t(
      'plannersm.co | Manajemen produksi konten untuk tim pemasaran',
      'plannersm.co | Content production management for marketing teams',
    )
    return () => { document.title = sebelum }
  }, [t])

  useEffect(() => {
    if (!menu) return
    const tutup = (e) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', tutup)
    return () => window.removeEventListener('keydown', tutup)
  }, [menu])

  // Dijalankan ulang saat bahasa berganti: tinggi tiap bagian berubah, jadi
  // pengamatnya perlu dipasang ulang terhadap elemen yang sudah dirender ulang.
  useReveal([t])

  const tautanNav = [
    ['#fitur', t('Fitur', 'Features')],
    ['#pratinjau', t('Pratinjau', 'Preview')],
    ['#cara-kerja', t('Cara kerja', 'How it works')],
    ['#paket', t('Harga', 'Pricing')],
    ['#pertanyaan', t('Pertanyaan', 'FAQ')],
  ]

  const FAQ = [
    [
      t('Apakah konten terbit otomatis ke media sosial?',
        'Does plannersm publish to social media automatically?'),
      t('Siapkan semua materi hingga siap tayang di plannersm.co, lalu publikasikan melalui platform pilihan kamu. Integrasi penerbitan otomatis masuk rencana pengembangan kami. Tim kami siap membantu menata alur yang cocok untuk brand kamu.',
        'Prepare every asset for publishing in plannersm.co, then publish through your chosen platform. Automatic publishing is on our development roadmap. Our team can help you shape a workflow for your brand.'),
    ],
    [
      t('Harga dihitung per akun media sosial atau per ruang kerja?',
        'Is pricing per social account or per workspace?'),
      t('Per ruang kerja. Satu ruang kerja digunakan untuk mengelola konten satu brand bersama tim Anda, tanpa batas jumlah akun media sosial. Agensi yang menangani beberapa brand dapat membuat ruang kerja terpisah dan memilih paket untuk masing-masing.',
        'Per workspace. One workspace manages one brand’s content with your team, with no limit on the number of social accounts. Agencies handling several brands can create separate workspaces and choose a plan for each.'),
    ],
    [
      t('Apa yang membedakan paket Gratis, Studio, dan Pro?',
        'What separates the Free, Studio, and Pro plans?'),
      t('Seluruh fitur perencanaan tersedia di ketiga paket. Yang membedakan adalah kapasitas penyimpanan materi dan jumlah anggota tim. Rincian terkini ada pada bagian Harga di halaman ini.',
        'All planning features are available on every plan. What differs is media storage capacity and team size. Current details are in the Pricing section on this page.'),
    ],
    [
      t('Bagaimana proses pembelian dan aktivasinya?',
        'How does purchase and activation work?'),
      t('Pilih paket dan periode, bayar melalui QRIS, lalu unggah bukti pembayaran. Tim kami akan memverifikasi pembayaran dan mengaktifkan paketmu.',
        'Choose a plan and billing period, pay via QRIS, then upload your receipt. Our team will verify the payment and activate your plan.'),
    ],
    [
      t('Apa yang terjadi jika kapasitas penyimpanan terlampaui?',
        'What happens if I exceed my storage limit?'),
      t('Materi yang sudah tersimpan tetap aman. Pantau kapasitas melalui Pengaturan, lalu rapikan arsip atau tambah ruang sesuai kebutuhan. Saat kapasitas penuh, kosongkan atau tambah ruang untuk melanjutkan unggahan. Tim kami siap membantu memilih kapasitas yang pas.',
        'Your existing assets stay safe. Track usage in Settings, then organise your archive or add space as needed. When storage is full, free up or add space to continue uploading. Our team can help you choose the right capacity.'),
    ],
    [
      t('Apakah tersedia penulisan caption dengan AI atau analitik otomatis?',
        'Do you offer AI caption writing or automatic analytics?'),
      t('Sekarang kamu bisa merapikan ide, brief, materi, dan review dalam satu alur. Bantuan caption AI dan analitik masuk rencana pengembangan berikutnya. Ceritakan kebutuhan tim kamu kepada kami agar pengembangannya menjawab cara kamu bekerja.',
        'Today you can organise ideas, briefs, assets, and reviews in one workflow. AI caption assistance and analytics are planned for future development. Tell us what your team needs so we can build around the way you work.'),
    ],
  ]

  const LANGKAH = [
    [
      t('Susun rencana konten', 'Build the content plan'),
      t('Tetapkan tema, tanggal tayang, dan platform untuk setiap konten dalam satu kalender bersama.',
        'Set the theme, publish date, and platform for every piece of content in one shared calendar.'),
    ],
    [
      t('Bagikan pekerjaan ke tim', 'Assign the work'),
      t('Lengkapi brief dan materi pendukung, lalu tentukan penanggung jawab setiap konten.',
        'Complete the brief and supporting media, then name an owner for each piece of content.'),
    ],
    [
      t('Kumpulkan persetujuan', 'Collect approvals'),
      t('Pantau progres, kirim tautan review ke klien, dan siapkan materi final untuk ditayangkan.',
        'Track progress, send a review link to the client, and prepare the final assets for publishing.'),
    ],
  ]

  const PAPAN = [
    [
      t('Dalam produksi', 'In production'),
      t('Katalog produk baru', 'New product catalogue'),
      t('Foto produk · Instagram', 'Product photo · Instagram'),
      t('Visual dan caption sedang dikerjakan.', 'Visuals and caption in progress.'),
    ],
    [
      t('Menunggu review', 'Awaiting review'),
      t('Panduan memilih produk', 'Product selection guide'),
      t('Carousel · Instagram', 'Carousel · Instagram'),
      t('Materi siap ditinjau klien.', 'Assets ready for client review.'),
    ],
    [
      t('Siap tayang', 'Ready to publish'),
      t('Cerita pelanggan', 'Customer story'),
      t('Video · TikTok', 'Video · TikTok'),
      t('Persetujuan klien sudah diterima.', 'Client approval received.'),
    ],
  ]

  return (
    <div className="studio-landing hero-overlay-page">
      <a className="studio-skip" href="#isi">{t('Lewati navigasi', 'Skip navigation')}</a>

      <header className={`studio-nav${scrolled ? ' is-scrolled' : ''}${menu ? ' menu-open' : ''}`}>
        <a className="studio-logo" href="#isi" aria-label={t('Kembali ke beranda', 'Back to home')} onClick={(e) => { e.preventDefault(); setMenu(false); window.scrollTo({ top: 0, behavior: 'instant' }) }}><BrandLogo /></a>

        <nav aria-label={t('Navigasi halaman', 'Page navigation')} className={menu ? 'is-open' : ''}>
          {tautanNav.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>
          ))}
        </nav>

        <div className="studio-nav-actions">
          <TombolBahasa />
          <Link to="/login">{t('Masuk', 'Sign in')}</Link>
          <Link to="/signup" className="studio-button">{t('Coba gratis', 'Start free')}</Link>
        </div>

        <button
          className="studio-menu"
          type="button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? t('Tutup menu', 'Close menu') : t('Buka menu', 'Open menu')}
          aria-expanded={menu}
        >
          <Icon name={menu ? 'close-outline' : 'menu-outline'} size={25} />
        </button>
      </header>

      <main id="isi">
        {/* Hero. Tata letaknya tidak diubah — hanya naskahnya yang kini
            menyebut siapa penggunanya dan apa yang dikerjakan produk ini. */}
        <section className="studio-hero">
          <div className="studio-hero-copy">
            <p className="studio-category">
              {t('Untuk tim pemasaran, agensi, dan kreator',
                 'For marketing teams, agencies, and creators')}
            </p>
            <h1>
              <span className="hero-desktop-copy">
                {t(<>Seluruh produksi konten Anda,<br />dalam satu sistem kerja.</>,
                   <>Your entire content operation,<br />in one working system.</>)}
              </span>
              <span className="hero-mobile-copy">
                {t(<>Produksi konten,<br />dalam satu sistem.</>,
                   <>Content production,<br />in one system.</>)}
              </span>
            </h1>
            <p className="studio-lead">
              <span className="hero-desktop-copy">
                {t('plannersm.co menyatukan perencanaan, penugasan, dan persetujuan konten media sosial. Dari ide pertama sampai materi disetujui klien.',
                   'plannersm.co brings planning, assignment, and approval of social media content together. From the first idea to final client approval.')}
              </span>
              <span className="hero-mobile-copy">
                {t('Rencanakan, kerjakan, dan setujui konten tim Anda di satu tempat.',
                   'Plan, produce, and approve your team’s content in one place.')}
              </span>
            </p>
            <div className="studio-hero-actions">
              <Link className="studio-button studio-button-large" to="/signup">
                <span className="hero-desktop-copy">{t('Mulai tanpa biaya', 'Get started free')}</span>
                <span className="hero-mobile-copy">{t('Mulai gratis', 'Start free')}</span>
              </Link>
              <a className="studio-secondary" href="#pratinjau">
                {t('Lihat produknya', 'See the product')} <Icon name="play-circle-outline" size={21} />
              </a>
            </div>
            <p className="studio-small">
              {t('Paket Gratis tersedia selamanya. Tanpa kartu kredit.',
                 'Free plan available indefinitely. No credit card required.')}
            </p>
          </div>

          <figure className="studio-hero-scene">
            <picture>
              <source media="(max-width: 700px)" srcSet="/images/studio-mobile-lavender.png" />
              <img
                src="/images/studio-team-hero.png"
                alt={t('Ilustrasi tim kreatif menyusun rencana konten bersama',
                       'Illustration of a creative team planning content together')}
                width="1860" height="846" fetchpriority="high"
              />
            </picture>
          </figure>
        </section>

        <section className="studio-section reveal" id="fitur">
          <div className="studio-section-heading">
            <h2>{t(<>Lebih sedikit koordinasi.<br />Lebih banyak konten selesai.</>,
                   <>Less coordinating.<br />More content finished.</>)}</h2>
            <p>{t('Pilih satu fitur untuk melihat bentuknya di dalam aplikasi.',
                  'Choose a feature to see how it looks inside the app.')}</p>
          </div>
          <FeatureShowcase />
        </section>

        <PratinjauProduk />

        <div className="reveal"><CreativeLab /></div>

        <section className="studio-review reveal">
          <div className="studio-review-image">
            <img
              src="/images/studio-review.png"
              alt={t('Ilustrasi dua anggota tim meninjau rencana konten',
                     'Illustration of two team members reviewing a content plan')}
              width="1448" height="1086" loading="lazy"
            />
          </div>
          <div className="studio-review-copy">
            <span className="studio-section-kicker">{t('Review dan persetujuan', 'Review and approval')}</span>
            <h2>{t(<>Satu tautan untuk klien.<br />Tanpa rantai email.</>,
                   <>One link for the client.<br />No email chains.</>)}</h2>
            <p>
              {t('Kirim satu tautan review. Catatan revisi dan persetujuan tersimpan bersama kontennya, sehingga tim selalu tahu apa yang perlu dikerjakan berikutnya.',
                 'Send one review link. Revision notes and approvals stay attached to the content itself, so your team always knows what to work on next.')}
            </p>
            <ul>
              <li><Icon name="checkmark-circle-outline" />{t('Klien meninjau tanpa membuat akun', 'Clients review without creating an account')}</li>
              <li><Icon name="checkmark-circle-outline" />{t('Riwayat revisi melekat pada kontennya', 'Revision history stays with the content')}</li>
              <li><Icon name="checkmark-circle-outline" />{t('Materi tiap brand terpisah per ruang kerja', 'Each brand’s assets stay in its own workspace')}</li>
            </ul>
            <a href="#paket" className="studio-text-link">
              {t('Lihat pilihan paket', 'View plans')} <Icon name="arrow-forward-outline" />
            </a>
          </div>
        </section>

        <section className="studio-section studio-process reveal" id="cara-kerja">
          <div className="studio-section-heading">
            <h2>{t(<>Tiga langkah.<br />Semua orang tahu perannya.</>,
                   <>Three steps.<br />Everyone knows their part.</>)}</h2>
            <p>{t('Alur kerja yang sama dipakai untuk satu brand maupun dua puluh.',
                  'The same workflow serves one brand or twenty.')}</p>
          </div>

          <div className="studio-process-layout">
            <ol>
              {LANGKAH.map(([judul, ket], i) => (
                <li key={judul}><b>{i + 1}</b><div><h3>{judul}</h3><p>{ket}</p></div></li>
              ))}
            </ol>

            <div className="studio-board" aria-label={t('Contoh papan kerja konten', 'Example content board')}>
              <div className="studio-board-top">
                <strong>{t('Papan konten', 'Content board')}</strong>
                <span>{t('Contoh ruang kerja', 'Example workspace')}</span>
              </div>
              <div className="studio-board-columns">
                {PAPAN.map(([status, judul, jenis, catatan], i) => (
                  <div key={judul}>
                    <span className={'studio-board-status status-' + i}>{status}</span>
                    <article className={boardStep === i ? 'board-active' : ''}>
                      <button type="button" className="board-pick" aria-pressed={boardStep === i} onClick={() => setBoardStep(i)} aria-label={t('Lihat tahap ', 'View stage ') + status}>
                      <div className={'studio-board-visual visual-' + i}>
                        <CampaignArt tile={[0, 4, 6][i]} label={judul}/>
                      </div>
                      <h4>{judul}</h4>
                      </button>
                      <small>{jenis}</small>
                      <p>{catatan}</p>
                      <span className="studio-board-person">
                        {['DI', 'RA', 'AN'][i]}<span>{t('Penanggung jawab', 'Owner')}</span>
                      </span>
                    </article>
                  </div>
                ))}
              </div>
              <p className="board-detail" aria-live="polite">{PAPAN[boardStep][0]}: {PAPAN[boardStep][3]}</p>
            </div>
          </div>
        </section>

        <section className="studio-pricing-section reveal" id="paket">
          <div className="studio-section-heading">
            <h2>{t(<>Harga per ruang kerja.<br />Tanpa biaya tersembunyi.</>,
                   <>Priced per workspace.<br />No hidden fees.</>)}</h2>
            <p>{t('Mulai dari paket Gratis. Naikkan kapasitas hanya ketika tim Anda membutuhkannya.',
                  'Start on the Free plan. Add capacity only when your team needs it.')}</p>
          </div>
          <PricingSelector />
        </section>

        <section className="studio-section studio-faq-section reveal" id="pertanyaan">
          <div>
            <h2>{t('Pertanyaan yang sering diajukan', 'Frequently asked questions')}</h2>
            <p>{t('Belum menemukan jawabannya? Tim kami siap membantu memilih paket yang sesuai.',
                  'Still unanswered? Our team can help you choose the right plan.')}</p>
            <a
              href="https://wa.me/6285111037992"
              target="_blank" rel="noopener noreferrer"
              className="studio-text-link"
            >
              {t('Hubungi tim kami', 'Talk to our team')} <Icon name="logo-whatsapp" />
            </a>
          </div>
          <div className="studio-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<Icon name="add-outline" size={20} /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="studio-final reveal">
          <div>
            <h2>{t(<>Siap merapikan<br />produksi konten Anda?</>,
                   <>Ready to organise<br />your content production?</>)}</h2>
            <p>{t('Buat ruang kerja pertama Anda hari ini. Gratis, tanpa kartu kredit.',
                  'Create your first workspace today. Free, no credit card.')}</p>
          </div>
          <Link to="/signup" className="studio-button studio-button-light">
            {t('Buat ruang kerja', 'Create a workspace')}
          </Link>
        </section>
      </main>

      <FooterSitus />
      <StudioInteractions />
    </div>
  )
}
