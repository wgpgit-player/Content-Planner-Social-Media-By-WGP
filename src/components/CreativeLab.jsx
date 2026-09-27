import { useState } from 'react'
import { Link } from 'react-router-dom'
const ideas = {
 brand: ['Cerita di balik produk','Tunjukkan satu detail yang sering luput dari perhatian. Ceritakan kenapa tim kamu memilihnya.','Carousel','Kenalan lebih dekat'],
 edukasi: ['Satu mitos, satu penjelasan','Buka dengan pertanyaan yang sering muncul. Jawab singkat, lalu beri contoh yang mudah dicoba.','Video pendek','Simpan buat nanti'],
 komunitas: ['Giliran audiens bercerita','Ajak audiens memilih dua versi ide. Ceritakan pilihan tim kamu, lalu buka obrolannya.','Story','Kamu pilih yang mana?'],
}
export default function CreativeLab({inApp=false}) {
 const [kind,setKind]=useState('brand'),[tone,setTone]=useState('playful'),[copied,setCopied]=useState(false),[error,setError]=useState('')
 const [title,brief,format,cta]=ideas[kind]
 async function copy(){try{await navigator.clipboard.writeText(`${title}\n${brief}\nFormat: ${format}\nCTA: ${cta}`);setCopied(true);setError('')}catch{setError('Belum bisa menyalin. Pilih dan salin teks brief secara manual.')}}
 function moveArt(e){if(!window.matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--art-turn',((e.clientX-r.left)/r.width-.5)*5+'deg');e.currentTarget.style.setProperty('--art-lift',((e.clientY-r.top)/r.height-.5)*-8+'px')}
 function resetArt(e){e.currentTarget.style.setProperty('--art-turn','0deg');e.currentTarget.style.setProperty('--art-lift','0px')}
 return <section onPointerMove={moveArt} onPointerLeave={resetArt} className={'creative-lab'+(inApp?' creative-lab-app':'')} aria-label="Coba ide konten">
 <div className="lab-intro"><span className="lab-label">Ruang coba</span><h2>Ide kecil.<br/>Bisa jadi sesuatu.</h2><p>Pilih arah ceritamu. Coba tampilannya, lalu bawa ke rencana konten.</p><img src="/images/creative-guide.png" alt="Karakter 3D kreator dengan tablet dan kartu ide" width="500" height="500" loading="lazy"/></div>
 <div className="lab-workbench"><div className="lab-toolbar"><span><i/>Meja ide kamu</span><small>Contoh interaktif</small></div>
 <fieldset><legend>Mau cerita tentang apa?</legend><div className="lab-options">{[['brand','Brand kamu'],['edukasi','Berbagi tips'],['komunitas','Ajak ngobrol']].map(([k,l])=><button type="button" key={k} aria-pressed={kind===k} onClick={()=>{setKind(k);setCopied(false);setError('')}}>{l}</button>)}</div></fieldset>
 <fieldset><legend>Pilih mood visual</legend><div className="lab-moods">{[['playful','Playful'],['fresh','Fresh'],['bold','Bold']].map(([k,l])=><button type="button" className={'mood-'+k} key={k} aria-label={'Mood '+l} aria-pressed={tone===k} onClick={()=>setTone(k)}><i/>{l}</button>)}</div></fieldset>
 <div className={'lab-poster mood-'+tone} key={kind+tone}><span>{format}</span><h3>{title}</h3><div className="poster-shape" aria-hidden="true"/><small>{cta}</small></div>
 <div className="lab-brief"><strong>Brief singkat</strong><p>{brief}</p></div><div className="lab-actions"><button type="button" onClick={copy}>{copied?'Brief tersalin ✓':'Salin brief'}</button><Link to={inApp?`/compose?ide=${encodeURIComponent(title+'. '+brief)}`:'/signup'}>{inApp?'Susun konten ini':'Buat versimu'}</Link></div><p className="lab-feedback" role="status">{error || (copied?'Siap ditempel ke rencana konten kamu.':'Contoh template. Pilihan ini belum disimpan ke workspace.')}</p></div>
 </section>
}
