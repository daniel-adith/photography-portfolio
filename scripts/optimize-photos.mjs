#!/usr/bin/env node
// Pengecil foto portofolio Daniel Adith.
//
// Pemakaian:
//   node scripts/optimize-photos.mjs "<folder-asli>" [folder-hasil] [opsi]
//
// Apit path dengan tanda kutip bila ada spasi.
//
// Struktur folder asli: satu subfolder per proyek, nama file bebas.
// Nama subfolder tidak harus sama dengan slug. Skrip mencocokkan secara longgar:
// huruf besar-kecil, spasi, tanda baca, dan angka di depan diabaikan.
//   "Farewell Party"      -> farewell-party
//   "1. Noodzilla"        -> noodzilla
//   "capsule memories"    -> capsule-memories
// Subfolder yang tidak cocok dilewati dan dicatat di laporan.
//
// Hasil (default folder-hasil: public/photos):
//   public/photos/farewell-party/01.jpg, 02.jpg, ...
//
// Urutan foto = urutan nama file (angka dibaca sebagai angka). Atur urutan dengan
// menamai file: 01-nama.jpg, 02-nama.jpg, dan seterusnya.
//
// Opsi:
//   --dry-run          tampilkan rencana tanpa menulis file
//   --format jpg|webp  format hasil (default jpg)
//   --long-edge 2400   sisi terpanjang dalam pixel (default 2400)
//   --max-kb 600       batas ukuran per foto; kualitas turun bertahap sampai muat
//                      (0 = matikan batas, pakai kualitas 82 tetap)
//
// Pemasangan satu kali:  npm install --save-dev sharp
// File asli TIDAK diubah. Hasil ditulis ke folder hasil saja.

import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// ====== PENGATURAN (ubah di sini) ======
// Slug proyek yang dikenal website.
const KNOWN_SLUGS = [
  "farewell-party",
  "noodzilla",
  "cotti-coffee",
  "noir-limousine",
  "senyum-museum-artravel",
  "urbahn-international",
  "capsule-memories",
];
// Nama pendek yang ingin dipetakan ke slug. Kunci ditulis huruf kecil dengan tanda hubung.
// Contoh: { "cotti": "cotti-coffee", "senyum-museum": "senyum-museum-artravel" }
const SLUG_ALIASES = {
  "senyumuseum-artravel": "senyum-museum-artravel",
};
const MAX_FRAMES = { default: 6, "capsule-memories": 18 };
// Kualitas dicoba dari kiri ke kanan sampai ukuran muat. Batas bawah 70 menjaga tampilan.
const QUALITY_STEPS = [85, 82, 80, 78, 75, 72, 70];
const EXT_IN = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);
// ======================================

const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

const toKey = (name) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^\d+[\s._-]*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function resolveSlug(dirName) {
  const key = toKey(dirName);
  if (SLUG_ALIASES[key]) return SLUG_ALIASES[key];
  return KNOWN_SLUGS.includes(key) ? key : null;
}

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--dry-run") flags.dryRun = true;
  else if (a.startsWith("--")) flags[a.slice(2)] = args[++i];
  else pos.push(a);
}

const inputDir = pos[0];
if (!inputDir) {
  console.error('Pemakaian: node scripts/optimize-photos.mjs "<folder-asli>" [folder-hasil] [--dry-run] [--format jpg|webp] [--long-edge 2400] [--max-kb 600]');
  process.exit(1);
}
const outDir = pos[1] ?? "public/photos";
const format = String(flags.format ?? "jpg").toLowerCase();
const longEdge = Number(flags["long-edge"] ?? 2400);
const maxKB = Number(flags["max-kb"] ?? 600);
if (!["jpg", "webp"].includes(format)) fail("--format harus jpg atau webp.");
if (!Number.isFinite(longEdge) || longEdge < 200) fail("--long-edge harus angka minimal 200.");
if (!Number.isFinite(maxKB) || maxKB < 0) fail("--max-kb harus angka 0 atau lebih.");

function fail(msg) {
  console.error(`Galat: ${msg}`);
  process.exit(1);
}

sharp.cache(false);

// sharp mengubah warna ke sRGB dan membuang metadata (termasuk lokasi GPS) secara default.
// .rotate() tanpa argumen menerapkan orientasi EXIF sebelum metadata dibuang.
async function encode(file) {
  const base = sharp(file, { failOn: "none" })
    .rotate()
    .resize({ width: longEdge, height: longEdge, fit: "inside", withoutEnlargement: true });
  const steps = maxKB > 0 ? QUALITY_STEPS : [82];
  let buf = null;
  let q = steps[0];
  for (q of steps) {
    buf =
      format === "webp"
        ? await base.clone().webp({ quality: q, effort: 5 }).toBuffer()
        : await base.clone().jpeg({ quality: q, mozjpeg: true }).toBuffer();
    if (maxKB <= 0 || buf.length <= maxKB * 1024) break;
  }
  return { buf, q, over: maxKB > 0 && buf.length > maxKB * 1024 };
}

let entries;
try {
  entries = await readdir(inputDir, { withFileTypes: true });
} catch {
  fail(`folder asli tidak ditemukan: ${inputDir}`);
}
const dirNames = entries
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .map((e) => e.name)
  .sort(collator.compare);
if (dirNames.length === 0) fail(`tidak ada subfolder proyek di ${inputDir}.`);

const ext = format === "webp" ? "webp" : "jpg";
const notes = [];
const seen = new Map();
let totalBefore = 0;
let totalAfter = 0;
let totalCount = 0;

console.log(`${flags.dryRun ? "[DRY RUN] " : ""}Sisi panjang ${longEdge}px, format ${ext}, batas ${maxKB > 0 ? maxKB + " KB" : "tidak ada"}\n`);

for (const dirName of dirNames) {
  const slug = resolveSlug(dirName);
  if (!slug) {
    notes.push(`Folder "${dirName}" tidak cocok dengan slug mana pun, dilewati. Tambahkan di SLUG_ALIASES bila perlu.`);
    continue;
  }
  if (seen.has(slug)) {
    notes.push(`Folder "${dirName}" dan "${seen.get(slug)}" sama-sama cocok dengan ${slug}. "${dirName}" dilewati.`);
    continue;
  }
  seen.set(slug, dirName);

  const srcDir = path.join(inputDir, dirName);
  const dstDir = path.join(outDir, slug);
  const all = (await readdir(srcDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && !e.name.startsWith(".") && EXT_IN.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort(collator.compare);
  if (all.length === 0) {
    notes.push(`${dirName}: tidak ada foto yang bisa dibaca langsung di folder ini (jpg, jpeg, png, tif, tiff, webp). Periksa subfolder di dalamnya atau format file.`);
    continue;
  }
  const max = MAX_FRAMES[slug] ?? MAX_FRAMES.default;
  const use = all.slice(0, max);
  if (all.length > max) {
    notes.push(`${slug}: ${all.length - max} foto di luar batas ${max} frame dilewati (urut nama). Yang dilewati dimulai dari ${all[max]}.`);
  }
  if (use.length < max) {
    notes.push(`${slug}: hanya ${use.length} dari ${max} frame tersedia. Sisanya tampil sebagai placeholder.`);
  }

  console.log(`${dirName === slug ? slug : `${dirName} -> ${slug}`} (${use.length} foto)`);
  if (!flags.dryRun) await mkdir(dstDir, { recursive: true });
  const written = new Set();

  for (let i = 0; i < use.length; i++) {
    const name = `${String(i + 1).padStart(2, "0")}.${ext}`;
    const srcFile = path.join(srcDir, use[i]);
    if (flags.dryRun) {
      console.log(`  ${use[i]} -> ${name}`);
      continue;
    }
    const before = (await stat(srcFile)).size;
    const { buf, q, over } = await encode(srcFile);
    await writeFile(path.join(dstDir, name), buf);
    written.add(name);
    totalBefore += before;
    totalAfter += buf.length;
    totalCount++;
    console.log(`  ${use[i]} -> ${name}  ${fmtSize(before)} -> ${fmtSize(buf.length)}  (kualitas ${q})`);
    if (over) notes.push(`${slug}/${name}: ${fmtSize(buf.length)} melewati batas ${maxKB} KB pada kualitas ${q}. Foto ini berbutir atau sangat detail. Periksa hasilnya, atau naikkan --max-kb.`);
  }

  if (!flags.dryRun) {
    const leftovers = (await readdir(dstDir)).filter((n) => !written.has(n) && n !== ".gitkeep");
    if (leftovers.length) {
      notes.push(`${slug}: file lama di folder hasil tidak ikut diganti: ${leftovers.join(", ")}. Hapus sendiri bila tidak dipakai.`);
    }
  }
}

if (!flags.dryRun) {
  console.log(`\n${totalCount} foto selesai. ${fmtSize(totalBefore)} -> ${fmtSize(totalAfter)}`);
}
if (notes.length) {
  console.log("\nCatatan:");
  for (const n of notes) console.log(`- ${n}`);
}
if (!flags.dryRun && totalCount === 0) process.exit(1);
