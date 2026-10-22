export const CONTENT = {
  meta: {
    title: "Daniel Adith Portfolio",
    description: "Daniel Adith memotret untuk brand, hotel, hingga berbagai macam acara.",
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
    kicker: "Photography Portfolio",
    title: "The untold story in every frame"
  },
  hero: {
    lines: ["Daniel", "Adith"],
    mark: "@2026",
    support: "Saya memotret momen yang terasa nyata. Cahaya lembut, warna hangat, tanpa kaku.", // BARU
    cta: { label: "Let’s talk!", target: "contact" }
  },
  about: {
    title: "The untold story in every frame",
    paragraphs: [
      "Daniel Adith memotret untuk brand, hotel, hingga berbagai macam acara.",
      "Di luar foto yang bagus, pastinya terdapat momen yang terasa nyata & banyak yang tidak tahu mengenai ini. Hasilnya rapi, tenang, dan tetap terasa manusia."
    ]
  },
  approach: {
    title: "The style that “different”",
    intro: "Tiga hal yang saya jaga di setiap frame.", // BARU
    items: [
      { no: "01", name: "Intimate", text: "Setiap foto memiliki hasil yang intim. Tidak ada kaku di dalam kamus saya." },
      { no: "02", name: "Cinematic", text: "Cahaya lembut, warna hangat. Tiap frame seperti berbicara dengan audience." },
      { no: "03", name: "Effortless", text: "Kamu cukup hadir, biarkan saya yang mengatasi semua ini." }
    ]
  },
  works: {
    question: "Apa yang bisa kamu percaya?",
    title: "This is Capsule Memories"
  },
  selected: {
    title: "Selected Works",
    intro: "Enam cerita. Satu rasa yang sama.", // BARU
    items: [
      { no: "01", slug: "farewell-party", name: "Farewell Party", meta: "The Hermitage Tribute Portfolio Hotel, Jakarta", frames: 6 },
      { no: "02", slug: "noodzilla", name: "Noodzilla", meta: "Brand Campaign, Jakarta", frames: 6 },
      { no: "03", slug: "cotti-coffee", name: "Cotti Coffee", meta: "Brand Campaign, Jakarta", frames: 6 },
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
    { slug: "noodzilla", n: 2 },
    { slug: "cotti-coffee", n: 2 }
  ],
  capsule: {
    label: "Capsule Memories",
    slug: "capsule-memories",
    intro: "Potongan momen yang masih terasa sampai sekarang.", // BARU
    sets: [8, 10]
  },
  contact: {
    title: "Let’s talk!",
    cta: "Ceritakan kebutuhan mu disini!",
    channels: [
      { label: "Instagram", text: "@artivastudio.id", url: "https://www.instagram.com/artivastudio.id" },
      { label: "WhatsApp", text: "+62 851 2128 6440", url: "https://wa.me/6285121286440" }
    ]
  },
  ui: {
    skipIntro: "Lewati intro",
    pause: "Jeda",
    play: "Putar",
    prev: "Sebelumnya",
    next: "Berikutnya",
    chapters: "Daftar chapter",
    lightboxClose: "Tutup",
    lightboxPrev: "Foto sebelumnya",
    lightboxNext: "Foto berikutnya"
  }
} as const;
