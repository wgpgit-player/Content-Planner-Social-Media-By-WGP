import { useState } from 'react'
import { Link } from 'react-router-dom'
import TeleponMockup from './TeleponMockup'
import PratinjauInstagram from './PratinjauInstagram'
import Icon from './Icon'
import { useBahasa } from '../lib/bahasa'

// Pratinjau produk sungguhan di halaman jualan.
//
// KENAPA INI LEBIH BERHARGA DARIPADA ILUSTRASI
//
// Ilustrasi 3D membuat halaman terlihat rapi, tapi tidak menjawab pertanyaan
// yang sebenarnya ada di kepala calon pembeli: "kalau saya pakai, bentuknya
// seperti apa?" Riset halaman jualan menunjukkan pratinjau produk yang bisa
// disentuh memberi keterlibatan jauh di atas tangkapan layar diam.
//
// Yang ditampilkan di sini adalah komponen yang SAMA PERSIS dengan yang
// dipakai di dalam aplikasi — TeleponMockup dan PratinjauInstagram, bukan
// tiruan khusus halaman jualan. Jadi kalau tampilan di aplikasi berubah,
// halaman ini ikut berubah, dan tidak akan pernah menjanjikan sesuatu yang
// tidak ada di produknya.
//
// Angka yang tampil pun angka contoh yang jujur: Konten / Terjadwal / Draf,
// yaitu hitungan milik aplikasi ini sendiri — bukan "12 rb pengikut" yang
// dikarang supaya terlihat ramai.

const CONTOH = [
  {
    key: 'fashion',
    label: 'Brand fashion',
    nama: 'Rupa Studio',
    handle: '@rupastudio',
    bio: 'Pakaian sehari-hari, dijahit di Bandung.',
    warna: '#6B5EE0',
    konten: 24, terjadwal: 6, draf: 3,
    sel: ['#6B5EE0', '#B98AD9', '#E7A0B8', '#8E7BE8', '#D8C2F0', '#F0D6E2',
          '#7A6BE4', '#C9A7E6', '#EEBFCF', '#9E8CEC', '#E0CCF4', '#F6E3EA'],
  },
  {
    key: 'kuliner',
    label: 'Kedai kopi',
    nama: 'Teman Pagi',
    handle: '@temanpagi',
    bio: 'Kopi dan roti, buka dari jam enam.',
    warna: '#C4713A',
    konten: 41, terjadwal: 9, draf: 2,
    sel: ['#C4713A', '#E0A06A', '#F2D3AE', '#A85C2E', '#D99A63', '#EFC79A',
          '#B86A38', '#E5B184', '#F5DFC4', '#9E5528', '#DCA874', '#F8EAD8'],
  },
  {
    key: 'agensi',
    label: 'Agensi',
    nama: 'Kerja Kreatif',
    handle: '@kerjakreatif',
    bio: 'Mengelola konten untuk 7 brand.',
    warna: '#2F8F7A',
    konten: 138, terjadwal: 21, draf: 11,
    sel: ['#2F8F7A', '#6FBCA8', '#A9DCCE', '#247A67', '#57AE98', '#8ECFBE',
          '#3D9C86', '#7FC5B2', '#B9E3D7', '#1E6B5A', '#66B8A3', '#CDEDE4'],
  },
]

export default function PratinjauProduk() {
  const { t } = useBahasa()
  const [aktif, setAktif] = useState(0)
  const c = CONTOH[aktif]

  const label = {
    fashion: t('Brand fashion', 'Fashion brand'),
    kuliner: t('Kedai kopi', 'Coffee shop'),
    agensi: t('Agensi', 'Agency'),
  }

  return (
    <section className="pratinjau-produk reveal" id="pratinjau">
      <div className="pratinjau-copy">
        <span className="studio-section-kicker">{t('Pratinjau feed', 'Feed preview')}</span>
        <h2>{t(<>Periksa tampilannya<br />sebelum konten diunggah.</>,
               <>Check how it looks<br />before anything goes live.</>)}</h2>
        <p>
          {t('Susun urutan konten dan lihat bentuk feed Anda lebih dulu. Ubah urutannya sampai sesuai, baru kerjakan materinya.',
             'Arrange your content order and see the feed take shape first. Adjust until it works, then produce the assets.')}
        </p>

        <div className="pratinjau-pilih" role="group" aria-label={t('Contoh brand', 'Example brands')}>
          {CONTOH.map((x, i) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={aktif === i}
              onClick={() => setAktif(i)}
            >
              {label[x.key]}
            </button>
          ))}
        </div>

        <ul className="pratinjau-poin">
          <li><Icon name="checkmark-circle-outline" />{t('Rasio 4:5, sesuai standar Instagram', '4:5 ratio, matching Instagram')}</li>
          <li><Icon name="checkmark-circle-outline" />{t('Warna dan logo mengikuti brand tiap ruang kerja', 'Colours and logo follow each workspace’s brand')}</li>
          <li><Icon name="checkmark-circle-outline" />{t('Angka yang tampil berasal dari pekerjaan Anda sendiri', 'The numbers shown come from your own work')}</li>
        </ul>

        <Link to="/signup" className="studio-button">
          {t('Coba dengan brand Anda', 'Try it with your brand')}
        </Link>
      </div>

      <div className="pratinjau-panggung" key={c.key}>
        <TeleponMockup lebar={268}>
          <PratinjauInstagram
            handle={c.handle}
            nama={c.nama}
            bio={c.bio}
            warnaAksen={c.warna}
            jumlahKonten={c.konten}
            jumlahTerjadwal={c.terjadwal}
            jumlahDraf={c.draf}
          >
            {/* Sel feed. Warnanya mengikuti pilar konten di aplikasi
                sungguhan; di sini dipakai contoh palet per brand supaya
                terlihat bahwa feed ikut warna masing-masing workspace. */}
            <div className="ig-grid">
              {c.sel.map((warna, i) => (
                <div
                  key={i}
                  className="ig-sel"
                  style={{
                    background: `color-mix(in srgb, ${warna} 22%, #fff)`,
                    borderColor: i >= 9 ? warna : 'transparent',
                    borderStyle: i >= 9 ? 'dashed' : 'solid',
                  }}
                />
              ))}
            </div>
          </PratinjauInstagram>
        </TeleponMockup>
      </div>
    </section>
  )
}
