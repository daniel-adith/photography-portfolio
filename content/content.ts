export const CONTENT = {
  meta: {
    title: "Daniel Adith Portfolio",
    description: "Saya Daniel Adith, fotografer untuk brand, hotel, dan berbagai acara. Lihat enam proyek pilihan saya.",
    name: "Daniel Adith",
    year: "@2026"
  },
  nav: [
    { id: "about", label: "About" },
    { id: "approach", label: "Approach" },
    { id: "selected", label: "Selected Works" },
    { id: "contact", label: "Contact" }
  ],
  intro: {
    kicker: "Halo, ini portfolio saya",
    title: "The untold story in every frame"
  },
  hero: {
    lines: ["Daniel", "Adith"],
    mark: "@2026",
    support: "Saya memotret momen yang terasa nyata. Cahaya lembut, warna hangat, tanpa kaku.", // BARU
    cta: { label: "Let’s talk!", target: "contact" }
  },
  about: {
    title: "Kenalan dulu, saya Daniel.",
    paragraphs: [
      "Saya memotret untuk brand, hotel, dan berbagai acara.",
      "Saya mencari momen yang terasa nyata di balik foto yang bagus. Banyak orang tidak menyadarinya. Hasilnya rapi dan tenang, tapi tetap terasa manusia."
    ]
  },
  approach: {
    title: "Cara saya memotret",
    intro: "Tiga hal yang saya jaga di setiap frame.", // BARU
    items: [
      { no: "01", name: "Intimate", text: "Saya ingin fotonya terasa dekat dan akrab. Suasana kaku saya hindari." },
      { no: "02", name: "Cinematic", text: "Saya suka cahaya yang lembut dan warna yang hangat. Tiap frame saya susun supaya bicara langsung ke audience." },
      { no: "03", name: "Effortless", text: "Kamu cukup hadir dan santai. Sisanya biar saya yang urus." }
    ]
  },
  works: {
    question: "Mau lihat buktinya?",
    title: "This is Capsule Memories"
  },
  selected: {
    title: "Selected Works",
    intro: "Enam proyek pilihan saya. Pilih foto untuk memperbesar.", // BARU
    items: [
      { no: "01", slug: "farewell-party", name: "Farewell Party", meta: "The Hermitage Tribute Portfolio Hotel, Jakarta", frames: 6 },
      { no: "02", slug: "noodzilla", name: "Noodzilla", meta: "Brand Campaign, Jakarta", frames: 6 },
      { no: "03", slug: "cotti-coffee", name: "Cotti Coffee", meta: "Brand Campaign, Jakarta", frames: 4 },
      { no: "04", slug: "noir-limousine", name: "Noir Limousine", meta: "Brand Campaign, Switzerland", frames: 6 },
      { no: "05", slug: "senyum-museum-artravel", name: "Senyum Museum Artravel", meta: "Brand Campaign, Jakarta", frames: 6 },
      { no: "06", slug: "urbahn-international", name: "Urbahn International", meta: "Brand Campaign, Jakarta", frames: 6 }
    ]
  },
  tunnel: [
    { slug: "farewell-party", n: 1 },
    { slug: "noodzilla", n: 1 },
    { slug: "cotti-coffee", n: 1 },
    { slug: "noir-limousine", n: 1 },
    { slug: "senyum-museum-artravel", n: 1 },
    { slug: "urbahn-international", n: 1 },
    { slug: "farewell-party", n: 2 },
    { slug: "noir-limousine", n: 2 },
    { slug: "cotti-coffee", n: 2 }
  ],
  capsule: {
    label: "Capsule Memories",
    slug: "capsule-memories",
    intro: "Potongan momen yang masih terasa buat saya sampai sekarang.", // BARU
    sets: [8, 10]
  },
  contact: {
    title: "Let’s talk!",
    cta: "Ceritakan kebutuhanmu, nanti kita cari idenya bareng.",
    channels: [
      { label: "Instagram", text: "@artivastudio.id", url: "https://www.instagram.com/artivastudio.id" },
      { label: "WhatsApp", text: "+62 851 2128 6440", url: "https://wa.me/6285121286440" }
    ]
  },
  ui: {
    skipIntro: "Lewati intro",
    pause: "Jeda pergantian otomatis",
    play: "Putar pergantian otomatis",
    prev: "Bagian sebelumnya",
    next: "Bagian berikutnya",
    chapters: "Daftar bagian",
    lightboxClose: "Tutup foto",
    lightboxPrev: "Foto sebelumnya",
    lightboxNext: "Foto berikutnya"
  }
} as const;
