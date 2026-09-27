import { Link } from 'react-router-dom'
import { PLATFORMS } from '../config/platforms'
import Icon from './Icon'

// Platform shortcuts start a new draft with that platform selected.
export default function Topbar() {
  return (
    <header className="topbar-desktop">
      <nav className="social-shortcuts" aria-label="Buat konten untuk platform">
        {PLATFORMS.map(p => (
          <Link key={p.key} to={`/compose?platforms=${p.key}`} className="social-shortcut" title={`Buat konten ${p.label}`} aria-label={`Buat konten ${p.label}`} style={{color: p.key === 'instagram' ? '#d84683' : p.color}}>
            <Icon name={p.icon} size={22} />
          </Link>
        ))}
      </nav>
      <Link to="/content-bank" className="topbar-inspiration"><Icon name="bulb-outline" size={18} /><span>Ide kecil, cerita berikutnya</span></Link>
      <div className="topbar-kanan">
        <Link to="/reminders" className="topbar-ikon-bulat" aria-label="Pengingat" title="Pengingat"><Icon name="notifications-outline" size={21} /></Link>
        <Link to="/media" className="topbar-ikon-bulat topbar-upload" aria-label="Buka koleksi media" title="Koleksi media"><Icon name="cloud-upload-outline" size={21} /></Link>
      </div>
    </header>
  )
}
