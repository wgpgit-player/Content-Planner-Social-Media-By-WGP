import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Icon from './Icon'

// Kerangka halaman modern untuk layar autentikasi: Masuk, Daftar, Undangan.
// Desain split-screen modern dengan live widget pratinjau produk di panel kiri
// dan form terpusat yang responsif di panel kanan.

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      {/* Ambient background glow orbs */}
      <div className="auth-ambient-glow glow-1" aria-hidden="true" />
      <div className="auth-ambient-glow glow-2" aria-hidden="true" />

      <div className="auth-card">
        {/* Left Promo & Live Product Preview */}
        <div className="auth-promo">
          <div className="auth-promo-top">
            <Link to="/" className="auth-brand-link" title="Kembali ke Beranda">
              <BrandLogo />
            </Link>
            <span className="auth-promo-pill">
              <span className="auth-promo-dot" />
              Ruang Kerja Tim v2.5
            </span>
          </div>

          <div className="auth-promo-body">
            <h1 className="auth-promo-heading">
              Semua alur kerja konten tim kamu, <span className="auth-gradient-text">dalam satu sistem.</span>
            </h1>
            <p className="auth-promo-sub">
              Dari mandat brief, wording slide & video, hingga persetujuan (ACC) manajer dan kalender jadwal tayang.
            </p>

            {/* Live Interactive Product Preview Widget */}
            <div className="auth-preview-widget">
              <div className="auth-preview-header">
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="auth-pill-platform">
                    <Icon name="logo-instagram" size={12} color="#e1306c" /> Reels
                  </span>
                  <span className="auth-pill-status">
                    <Icon name="time-outline" size={11} /> Menunggu ACC
                  </span>
                </div>
                <span className="auth-preview-date">12 Nov · 16:30 WIB</span>
              </div>

              <h4 className="auth-preview-title">
                Video Reels: 3 Tips Sedekah Subuh Berkah
              </h4>

              <div className="auth-preview-checklist">
                <div className="auth-preview-check">
                  <Icon name="checkmark-circle" size={13} color="#10b981" />
                  <span>Hook visual 3 detik & script naskah</span>
                </div>
                <div className="auth-preview-check">
                  <Icon name="checkmark-circle" size={13} color="#10b981" />
                  <span>Link folder aset Drive terlampir</span>
                </div>
                <div className="auth-preview-check pending">
                  <Icon name="ellipse-outline" size={13} color="#f59e0b" />
                  <span>Persetujuan Manajer Sosmed (ACC)</span>
                </div>
              </div>

              <div className="auth-preview-footer">
                <div className="auth-preview-pic">
                  <div className="auth-pic-avatar">F</div>
                  <span>Fahri (Content Creator)</span>
                </div>
                <span className="auth-dispatch-tag">
                  <Icon name="flash" size={11} color="#6366f1" /> Smart Dispatch
                </span>
              </div>
            </div>
          </div>

          <div className="auth-promo-bottom">
            <div className="auth-stars">
              ★★★★★
            </div>
            <p className="auth-quote">
              "Semua brief, wording naskah, dan persetujuan jadi rapi tanpa tercecer di WhatsApp."
            </p>
            <div className="auth-trust-badge">
              <span className="auth-avatars">
                <span className="auth-av av-1">Z</span>
                <span className="auth-av av-2">R</span>
                <span className="auth-av av-3">A</span>
                <span className="auth-av av-4">+</span>
              </span>
              <span>Dipercaya 500+ Tim Kreatif & Brand</span>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="auth-form">
          <div className="auth-brand-mobile">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <BrandLogo />
            </Link>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">{title}</h2>
            {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
          </div>

          <div className="auth-form-content">
            {children}
          </div>

          {footer && (
            <div className="auth-form-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
