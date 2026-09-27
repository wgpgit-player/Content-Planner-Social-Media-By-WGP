import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Icon from './Icon'
import TombolBahasa from './TombolBahasa'
import { useBahasa } from '../lib/bahasa'
import { USAHA, alamatSatuBaris, waUrl } from '../config/usaha'

// Footer situs publik.
//
// APA GUNANYA SELAIN TAUTAN
//
// Footer adalah tempat orang mencari jawaban satu pertanyaan sebelum
// mengeluarkan uang: "ini siapa, dan ke mana saya mengadu kalau bermasalah?"
// Karena itu isinya bukan sekadar navigasi, melainkan identitas yang bisa
// diperiksa — nama badan usaha, alamat yang bisa dicari di peta, nomor yang
// bisa disimpan ke kontak, dan halaman aturan yang bisa dibaca sebelum
// membayar.
//
// Nomor telepon ditulis apa adanya, tidak cuma jadi tautan WhatsApp. Tautan
// yang tidak memperlihatkan tujuannya membuat orang enggan mengekliknya, dan
// nomor yang tidak bisa disalin tidak bisa disimpan.

export default function FooterSitus() {
  const { t } = useBahasa()
  const a = USAHA.alamat

  return (
    <footer className="situs-footer">
      <div className="situs-footer-utama">
        <div className="situs-footer-merek">
          <Link className="studio-logo" to="/"><BrandLogo /></Link>
          <p>{t('Perencanaan dan kolaborasi konten untuk brand, kreator, dan agensi.',
                'Content planning and collaboration for brands, creators, and agencies.')}</p>

          {/* Penanda jujur: menyebut apa yang TIDAK dilakukan aplikasi ini
              lebih berguna daripada janji. Orang yang mencari alat auto-post
              lebih baik tahu sekarang daripada setelah membayar. */}
          <p className="situs-footer-catatan">
            {t('Menangani perencanaan, produksi, dan persetujuan konten. Penerbitan tetap dilakukan melalui aplikasi media sosial masing-masing.',
               'Covers planning, production, and approval. Publishing still happens in each social platform’s own app.')}
          </p>

          <TombolBahasa className="pilih-bahasa-footer" />
        </div>

        <nav className="situs-footer-kolom" aria-label={t('Produk', 'Product')}>
          <h3>{t('Produk', 'Product')}</h3>
          <Link to="/tentang#fitur">{t('Fitur', 'Features')}</Link>
          <Link to="/tentang#cara-kerja">{t('Cara kerja', 'How it works')}</Link>
          <Link to="/tentang#paket">{t('Harga', 'Pricing')}</Link>
          <Link to="/signup">{t('Coba gratis', 'Start free')}</Link>
        </nav>

        <nav className="situs-footer-kolom" aria-label={t('Bantuan', 'Support')}>
          <h3>{t('Bantuan', 'Support')}</h3>
          <Link to="/tentang#pertanyaan">{t('Pertanyaan umum', 'FAQ')}</Link>
          <a href={waUrl('Halo admin plannersm.co, saya mau bertanya.')} target="_blank" rel="noopener noreferrer">
            {t('WhatsApp tim kami', 'WhatsApp our team')}
          </a>
          <a href={`mailto:${USAHA.email}`}>{t('Kirim email', 'Send an email')}</a>
          <Link to="/login">{t('Masuk ke akun', 'Sign in')}</Link>
        </nav>

        <nav className="situs-footer-kolom" aria-label="Legal">
          <h3>Legal</h3>
          <Link to="/syarat">{t('Syarat & Ketentuan', 'Terms of Service')}</Link>
          <Link to="/privasi">{t('Kebijakan Privasi', 'Privacy Policy')}</Link>
          <Link to="/syarat#pembayaran">{t('Pembayaran & refund', 'Payments & refunds')}</Link>
        </nav>

        <address className="situs-footer-kontak">
          <h3>{t('Penyelenggara', 'Operated by')}</h3>
          <strong>{USAHA.penyelenggara}</strong>
          <span>{USAHA.badanHukum}</span>
          <span className="situs-footer-alamat">
            {a.baris}<br />
            {a.kelurahan}, {a.kota} {a.kodePos}<br />
            {a.provinsi}, {a.negara}
          </span>
          <a href={waUrl()} target="_blank" rel="noopener noreferrer">
            <Icon name="logo-whatsapp" size={14} /> {USAHA.teleponTampil}
          </a>
          <a href={`mailto:${USAHA.email}`}>
            <Icon name="mail-outline" size={14} /> {USAHA.email}
          </a>
          <span className="situs-footer-jam">{USAHA.jamLayanan} · {USAHA.waktuBalas}</span>
        </address>
      </div>

      <div className="situs-footer-bawah">
        <small>
          © {new Date().getFullYear()} {USAHA.penyelenggara}.{' '}
          {t('Seluruh hak cipta dilindungi.', 'All rights reserved.')}
        </small>
        <small>{alamatSatuBaris()}</small>
      </div>
    </footer>
  )
}
