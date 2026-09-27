export const PREVIEW_PLANS = [
 {key:'gratis',nama:'Gratis',harga_bulanan:0,harga_tahunan:0,batas_penyimpanan:209715200,batas_anggota:3,deskripsi:'Mulai menyusun konten untuk brand Anda.',fitur:['Kalender dan bank ide','Brief dan pratinjau feed','200 MB penyimpanan'],metode_pembelian:'whatsapp'},
 {key:'dasar',nama:'Studio',harga_bulanan:49000,harga_tahunan:490000,batas_penyimpanan:2147483648,batas_anggota:10,deskripsi:'Untuk operasional konten harian bersama tim.',fitur:['Kalender, brief, dan papan kerja','Pembagian tugas dan alur persetujuan','Tautan review klien','2 GB penyimpanan'],metode_pembelian:'whatsapp'},
 {key:'pro',nama:'Pro',harga_bulanan:129000,harga_tahunan:1290000,batas_penyimpanan:10737418240,batas_anggota:null,deskripsi:'Untuk produksi konten dengan kebutuhan materi lebih besar.',fitur:['Seluruh fitur perencanaan Studio','Kolaborasi tim dan review klien','Identitas brand per workspace','10 GB penyimpanan'],metode_pembelian:'whatsapp'}
]
export const PREVIEW_ADDONS=[
 {key:'storage_5',nama:'Penyimpanan 5 GB',deskripsi:'Untuk tambahan materi desain dan foto.',harga_bulanan:19000,storage_bytes:5368709120},
 {key:'storage_20',nama:'Penyimpanan 20 GB',deskripsi:'Untuk arsip kampanye dan materi video yang lebih besar.',harga_bulanan:59000,storage_bytes:21474836480}
]
export function calculateQuote(plan,period,addons,quantities){
 const yearly=period==='yearly'
 const base=plan?.[yearly?'harga_tahunan':'harga_bulanan']
 if(base===null || base===undefined || !Number.isSafeInteger(Number(base)) || Number(base)<0)return null
 const lines=addons.map(a=>({...a,quantity:Math.max(0,Math.min(10,Math.trunc(Number(quantities[a.key])||0)))})).filter(a=>a.quantity>0)
 if(lines.some(a=>!Number.isSafeInteger(Number(a.harga_bulanan)) || Number(a.harga_bulanan)<0))return null
 const extra=lines.reduce((n,a)=>n+Number(a.harga_bulanan)*a.quantity*(yearly?12:1),0)
 return {base:Number(base),extra,total:Number(base)+extra,lines,months:yearly?12:1}
}
export function quoteContactUrl(plan,period,quote){
 if(!plan || !quote)return ''
 const money=n=>'Rp'+n.toLocaleString('id-ID')
 const extras=quote.lines.length?quote.lines.map(a=>a.nama+' x'+a.quantity).join(', '):'Tanpa add-on'
 return 'https://wa.me/6285111037992?text='+encodeURIComponent('Halo admin plannersm.co, saya ingin mengajukan paket '+plan.nama+' untuk 1 workspace, periode '+(period==='yearly'?'12 bulan':'1 bulan')+'. '+extras+'. Estimasi total '+money(quote.total)+'. Mohon konfirmasi tagihan dan aktivasi.')
}

