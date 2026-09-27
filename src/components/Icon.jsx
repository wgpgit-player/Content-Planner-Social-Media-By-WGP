// Pembungkus tipis untuk Ionicons (https://ionic.io/ionicons).
//
// Kenapa dibungkus, bukan langsung tulis <ion-icon> di mana-mana:
// 1. Satu tempat kalau suatu saat ganti library ikon lagi — cukup ubah file ini,
//    bukan puluhan pemanggilan yang tersebar.
// 2. Ionicons adalah web component, jadi propertinya harus lewat atribut HTML
//    biasa (name, size). React meneruskan prop yang tidak dikenal apa adanya ke
//    DOM untuk tag bertanda strip seperti <ion-icon>, jadi ini aman.
// 3. Ukuran diatur lewat font-size CSS supaya ikut mengikuti skala teks di
//    sekitarnya, sama persis seperti perilaku icon font yang dipakai sebelumnya.
//
// Nama ikon memakai penamaan resmi Ionicons, mayoritas varian "-outline"
// supaya garisnya tipis dan konsisten dengan arah desain minimalis aplikasi.

export default function Icon({ name, size = 16, color, style, ...rest }) {
  if (name === 'logo-x' || name === 'logo-twitter') return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ color: color ?? 'currentColor', verticalAlign: 'middle', flexShrink: 0, ...style }} {...rest}><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.5L.8 2h6.5l4.5 6.8L18.9 2ZM17.8 20h1.7L6.3 4H4.5L17.8 20Z"/></svg>
  return (
    <ion-icon
      name={name}
      aria-hidden="true"
      style={{
        fontSize: size,
        color: color ?? 'currentColor',
        // Tanpa ini, ikon ikut baseline teks dan terlihat agak naik.
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    />
  )
}
