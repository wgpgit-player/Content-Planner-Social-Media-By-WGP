export function priceLabel(value) {
 return value===null || value===undefined || value==='' ? 'Harga belum diumumkan' : new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value))
}
export function validatePlan(p) {
 if(!p.nama?.trim()) return 'Nama paket wajib diisi.'
 for(const key of ['harga_bulanan','harga_tahunan']) {
 if(p[key]!=='' && p[key]!=null && (!Number.isSafeInteger(Number(p[key])) || Number(p[key])<0)) return 'Harga harus berupa rupiah bulat dan tidak negatif.'
 }
 if(!Number.isFinite(Number(p.storageMb)) || Number(p.storageMb)<1) return 'Penyimpanan minimal 1 MB.'
 if(p.batas_anggota!=='' && p.batas_anggota!=null && (!Number.isInteger(Number(p.batas_anggota)) || Number(p.batas_anggota)<1)) return 'Batas anggota minimal satu.'
 if(p.metode_pembelian==='checkout' && (!safeWebUrl(p.checkout_url) || !/^https:\/\//i.test(p.checkout_url||''))) return 'Isi link checkout HTTPS yang valid.'
 return ''
}
export function safeWebUrl(value) { try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:undefined}catch{return undefined} }
