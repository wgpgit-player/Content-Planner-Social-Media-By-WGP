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
