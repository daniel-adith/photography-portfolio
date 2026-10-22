#!/usr/bin/env node
// Alat foto portofolio Daniel Adith. Ada tiga mode.
//
// 1) ANALISIS: membuat thumbnail, lembar kontak, dan index.json (ukuran, orientasi,
//    ketajaman, kecerahan, kelompok duplikat) untuk SEMUA foto di folder asli, termasuk subfolder.
//      node scripts/optimize-photos.mjs "<folder-asli>" --thumbs "<folder-kerja>"
//
// 2) MANIFEST: memproses foto yang dipilih (daftar di file JSON) menjadi versi web.
//      node scripts/optimize-photos.mjs "<folder-asli>" --manifest scripts/photo-manifest.json [--clean]
//    Format manifest (path relatif terhadap folder asli, urutan = nomor frame):
//      { "farewell-party": ["Farewell Party/IMG_12.jpg", "Farewell Party/IMG_03.jpg"] }
//
// 3) FOLDER: mengambil N foto pertama per subfolder menurut urutan nama.
//      node scripts/optimize-photos.mjs "<folder-asli>" [--clean]
//    Nama subfolder dicocokkan longgar dengan slug ("Farewell Party" -> farewell-party).
//
// Apit path dengan tanda kutip bila ada spasi.
//
// Hasil mode 2 dan 3 (default folder-hasil public/photos, bisa diberi sebagai argumen kedua):
//   public/photos/<slug>/01.jpg, 02.jpg, ...
//
// Opsi umum:
//   --dry-run          tampilkan rencana tanpa menulis atau menghapus file
//   --format jpg|webp  format hasil (default jpg)
//   --long-edge 2400   sisi terpanjang dalam pixel (default 2400)
//   --max-kb 600       batas ukuran per foto; kualitas turun bertahap sampai muat (0 = matikan)
//   --clean            hapus file hasil lama berpola NN.jpg/jpeg/webp/png di folder slug yang tidak
//                      ikut ditulis. Hanya file berpola itu di folder hasil. File asli tidak pernah disentuh.
//
// Pemasangan satu kali:  npm install --save-dev sharp
// File asli TIDAK diubah.

import { readdir, stat, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// ====== PENGATURAN (ubah di sini) ======
const KNOWN_SLUGS = [
  "farewell-party",
  "noodzilla",
  "cotti-coffee",
  "noir-limousine",
  "senyum-museum-artravel",
  "urbahn-international",
  "capsule-memories",
];
// Nama pendek yang ingin dipetakan ke slug. Kunci huruf kecil dengan tanda hubung.
const SLUG_ALIASES = {};
// Jumlah foto maksimal per slug.
const MAX_FRAMES = { default: 6, "capsule-memories": 18 };
const QUALITY_STEPS = [85, 82, 80, 78, 75, 72, 70];
const EXT_IN = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);
// Mode analisis
const THUMB_EDGE = 800;
const DUP_DISTANCE = 6; // jarak hash maksimal agar dua foto dianggap hampir sama
const SHEET_COLS = 4;
const SHEET_ROWS = 3;
const TILE_W = 400;
const TILE_H = 300;
// ======================================

const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

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

function fail(msg) {
  console.error(`Galat: ${msg}`);
  process.exit(1);
}

const BOOL_FLAGS = new Set(["dry-run", "clean"]);
const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    if (BOOL_FLAGS.has(k)) flags[k] = true;
    else flags[k] = args[++i];
  } else pos.push(a);
}

const inputDir = pos[0];
if (!inputDir) {
  console.error(
    'Pemakaian:\n  node scripts/optimize-photos.mjs "<folder-asli>" --thumbs "<folder-kerja>"\n  node scripts/optimize-photos.mjs "<folder-asli>" --manifest scripts/photo-manifest.json [--clean]\n  node scripts/optimize-photos.mjs "<folder-asli>" [folder-hasil] [--clean] [--dry-run] [--format jpg|webp] [--long-edge 2400] [--max-kb 600]'
  );
  process.exit(1);
}
const dryRun = !!flags["dry-run"];
const clean = !!flags.clean;
const outDir = pos[1] ?? "public/photos";
const format = String(flags.format ?? "jpg").toLowerCase();
const longEdge = Number(flags["long-edge"] ?? 2400);
const maxKB = Number(flags["max-kb"] ?? 600);
if (!["jpg", "webp"].includes(format)) fail("--format harus jpg atau webp.");
if (!Number.isFinite(longEdge) || longEdge < 200) fail("--long-edge harus angka minimal 200.");
if (!Number.isFinite(maxKB) || maxKB < 0) fail("--max-kb harus angka 0 atau lebih.");

sharp.cache(false);

async function walk(dir, rel = "") {
  const out = [];
  const list = (await readdir(dir, { withFileTypes: true })).sort((a, b) => collator.compare(a.name, b.name));
  for (const e of list) {
    if (e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(abs, r)));
    else if (e.isFile() && EXT_IN.has(path.extname(e.name).toLowerCase())) out.push({ abs, rel: r });
  }
  return out;
}

// ---------------------------------------------------------------- MODE 1: ANALISIS
async function runThumbs(thumbsDir) {
  const files = await walk(inputDir);
  if (files.length === 0) fail(`tidak ada foto yang bisa dibaca di ${inputDir}.`);
  await mkdir(thumbsDir, { recursive: true });
  console.log(`Menganalisis ${files.length} foto...`);

  const entries = [];
  const hashes = [];
  let n = 0;
  for (const f of files) {
    n++;
    try {
      const meta = await sharp(f.abs, { failOn: "none" }).metadata();
      let w = meta.width;
      let h = meta.height;
      if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w];
      const thumb = await sharp(f.abs, { failOn: "none" })
        .rotate()
        .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
      const thumbPath = path.join(thumbsDir, `${f.rel}.jpg`);
      await mkdir(path.dirname(thumbPath), { recursive: true });
      await writeFile(thumbPath, thumb);

      const lap = await sharp(thumb)
        .greyscale()
        .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], scale: 1, offset: 128 })
        .stats();
      const st = await sharp(thumb).greyscale().stats();
      const { data, info } = await sharp(thumb).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
      let hash = 0n;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const a = data[(y * 9 + x) * info.channels];
          const b = data[(y * 9 + x + 1) * info.channels];
          hash = (hash << 1n) | (a < b ? 1n : 0n);
        }
      }
      const ratio = w / h;
      entries.push({
        path: f.rel,
        folder: f.rel.includes("/") ? f.rel.split("/")[0] : "(akar)",
        width: w,
        height: h,
        orientation: ratio >= 1.15 ? "landscape" : ratio <= 0.87 ? "portrait" : "square",
        bytes: (await stat(f.abs)).size,
        sharpness: round(lap.channels[0].stdev, 2),
        brightness: round(st.channels[0].mean, 1),
        hash: hash.toString(16).padStart(16, "0"),
      });
      hashes.push(hash);
    } catch (err) {
      console.warn(`  Lewati ${f.rel}: ${err.message}`);
    }
    if (n % 25 === 0) console.log(`  ${n}/${files.length}`);
  }

  // Ketajaman relatif terhadap median folder yang sama.
  const byFolder = new Map();
  for (const e of entries) {
    if (!byFolder.has(e.folder)) byFolder.set(e.folder, []);
    byFolder.get(e.folder).push(e);
  }
  for (const list of byFolder.values()) {
    const s = list.map((e) => e.sharpness).sort((a, b) => a - b);
    const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    for (const e of list) e.sharpRel = med > 0 ? round(e.sharpness / med, 2) : 1;
  }

  // Kelompok duplikat (foto hampir sama).
  const parent = entries.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const popcount = (x) => {
    let c = 0;
    while (x) {
      c += Number(x & 1n);
      x >>= 1n;
    }
    return c;
  };
  // Foto dengan hash hampir kosong atau hampir penuh (sangat polos) tidak ikut dibandingkan,
  // karena banyak foto polos akan tampak mirip padahal berbeda.
  const informative = hashes.map((h) => {
    const c = popcount(h);
    return c >= 10 && c <= 54;
  });
  for (let i = 0; i < entries.length; i++) {
    if (!informative[i]) continue;
    for (let j = i + 1; j < entries.length; j++) {
      if (!informative[j]) continue;
      if (popcount(hashes[i] ^ hashes[j]) <= DUP_DISTANCE) parent[find(j)] = find(i);
    }
  }
  const groups = new Map();
  entries.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  });
  let gid = 0;
  for (const idxs of groups.values()) {
    if (idxs.length > 1) {
      gid++;
      for (const i of idxs) entries[i].dup = `dup${gid}`;
    }
  }

  // Lembar kontak per folder, 12 foto per lembar, diberi nomor dan nama file.
  const sheetsDir = path.join(thumbsDir, "_sheets");
  await mkdir(sheetsDir, { recursive: true });
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const perSheet = SHEET_COLS * SHEET_ROWS;
  for (const [folder, list] of byFolder) {
    const safe = folder.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "akar";
    for (let s = 0; s * perSheet < list.length; s++) {
      const chunk = list.slice(s * perSheet, (s + 1) * perSheet);
      const composites = [];
      for (let k = 0; k < chunk.length; k++) {
        const e = chunk[k];
        const name = path.basename(e.path);
        const label = Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}"><rect x="0" y="${TILE_H - 24}" width="${TILE_W}" height="24" fill="#000" fill-opacity="0.7"/><text x="6" y="${TILE_H - 8}" font-size="15" fill="#fff" font-family="sans-serif">${k + 1}. ${esc(name)}</text></svg>`
        );
        const tile = await sharp(await readFile(path.join(thumbsDir, `${e.path}.jpg`)))
          .resize(TILE_W - 4, TILE_H - 4, { fit: "contain", background: "#111111" })
          .extend({ top: 2, bottom: 2, left: 2, right: 2, background: "#111111" })
          .composite([{ input: label }])
          .jpeg({ quality: 80 })
          .toBuffer();
        composites.push({ input: tile, left: (k % SHEET_COLS) * TILE_W, top: Math.floor(k / SHEET_COLS) * TILE_H });
        e.sheet = `_sheets/${safe}-${s + 1}.jpg`;
        e.tile = k + 1;
      }
      await sharp({
        create: { width: SHEET_COLS * TILE_W, height: SHEET_ROWS * TILE_H, channels: 3, background: "#111111" },
      })
        .composite(composites)
        .jpeg({ quality: 80 })
        .toFile(path.join(sheetsDir, `${safe}-${s + 1}.jpg`));
    }
  }

  const index = { inputDir, count: entries.length, thumbEdge: THUMB_EDGE, dupDistance: DUP_DISTANCE, photos: entries };
  await writeFile(path.join(thumbsDir, "index.json"), JSON.stringify(index, null, 2));

  console.log(`\nSelesai. ${entries.length} foto. Hasil di ${thumbsDir}`);
  console.log("Folder             foto  potret  lanskap  persegi  duplikat  buram(<0.5)");
  for (const [folder, list] of byFolder) {
    const c = (o) => list.filter((e) => e.orientation === o).length;
    console.log(
      `${folder.padEnd(18).slice(0, 18)} ${String(list.length).padStart(5)} ${String(c("portrait")).padStart(7)} ${String(c("landscape")).padStart(8)} ${String(c("square")).padStart(8)} ${String(list.filter((e) => e.dup).length).padStart(9)} ${String(list.filter((e) => e.sharpRel < 0.5).length).padStart(12)}`
    );
  }
}

// ---------------------------------------------------------------- MODE 2 DAN 3: PROSES
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

async function buildJobsFromFolders(notes) {
  const entries = await readdir(inputDir, { withFileTypes: true });
  const dirNames = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort(collator.compare);
  if (dirNames.length === 0) fail(`tidak ada subfolder proyek di ${inputDir}.`);
  const jobs = [];
  const seen = new Map();
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
    const all = (await readdir(srcDir, { withFileTypes: true }))
      .filter((e) => e.isFile() && !e.name.startsWith(".") && EXT_IN.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort(collator.compare);
    if (all.length === 0) {
      notes.push(`${dirName}: tidak ada foto yang bisa dibaca langsung di folder ini (jpg, jpeg, png, tif, tiff, webp). Periksa subfolder di dalamnya atau format file.`);
      continue;
    }
    const max = MAX_FRAMES[slug] ?? MAX_FRAMES.default;
    if (all.length > max) {
      notes.push(`${slug}: ${all.length - max} foto di luar batas ${max} frame dilewati (urut nama). Yang dilewati dimulai dari ${all[max]}.`);
    }
    jobs.push({
      slug,
      title: dirName === slug ? slug : `${dirName} -> ${slug}`,
      files: all.slice(0, max).map((n) => ({ abs: path.join(srcDir, n), label: n })),
    });
  }
  return jobs;
}

async function buildJobsFromManifest(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (err) {
    fail(`manifest tidak bisa dibaca (${manifestPath}): ${err.message}`);
  }
  const jobs = [];
  const used = new Map();
  const problems = [];
  for (const [slug, list] of Object.entries(manifest)) {
    if (!KNOWN_SLUGS.includes(slug)) {
      problems.push(`Slug tidak dikenal di manifest: ${slug}`);
      continue;
    }
    if (!Array.isArray(list) || list.length === 0) {
      problems.push(`${slug}: daftar foto kosong atau bukan array.`);
      continue;
    }
    const max = MAX_FRAMES[slug] ?? MAX_FRAMES.default;
    if (list.length > max) problems.push(`${slug}: ${list.length} foto melebihi batas ${max} frame.`);
    const files = [];
    for (const rel of list) {
      const abs = path.join(inputDir, rel);
      if (!EXT_IN.has(path.extname(rel).toLowerCase())) problems.push(`${slug}: ekstensi tidak didukung: ${rel}`);
      try {
        await stat(abs);
      } catch {
        problems.push(`${slug}: file tidak ditemukan: ${rel}`);
        continue;
      }
      if (used.has(rel)) problems.push(`Foto dipakai dua kali: ${rel} (${used.get(rel)} dan ${slug})`);
      else used.set(rel, slug);
      files.push({ abs, label: rel });
    }
    jobs.push({ slug, title: `${slug} (manifest)`, files });
  }
  if (problems.length) {
    console.error("Manifest bermasalah:");
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
  return jobs;
}

async function runProcess() {
  const ext = format === "webp" ? "webp" : "jpg";
  const notes = [];
  let totalBefore = 0;
  let totalAfter = 0;
  let totalCount = 0;

  try {
    await stat(inputDir);
  } catch {
    fail(`folder asli tidak ditemukan: ${inputDir}`);
  }
  const jobs = flags.manifest ? await buildJobsFromManifest(flags.manifest) : await buildJobsFromFolders(notes);

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Sisi panjang ${longEdge}px, format ${ext}, batas ${maxKB > 0 ? maxKB + " KB" : "tidak ada"}${clean ? ", --clean" : ""}\n`
  );

  for (const job of jobs) {
    const { slug, files } = job;
    const dstDir = path.join(outDir, slug);
    const max = MAX_FRAMES[slug] ?? MAX_FRAMES.default;
    if (files.length < max) notes.push(`${slug}: ${files.length} dari ${max} frame. Website harus memakai jumlah frame ${files.length} untuk slug ini.`);

    console.log(`${job.title} (${files.length} foto)`);
    if (!dryRun) await mkdir(dstDir, { recursive: true });
    const written = new Set();

    for (let i = 0; i < files.length; i++) {
      const name = `${String(i + 1).padStart(2, "0")}.${ext}`;
      written.add(name);
      if (dryRun) {
        console.log(`  ${files[i].label} -> ${name}`);
        continue;
      }
      const before = (await stat(files[i].abs)).size;
      const { buf, q, over } = await encode(files[i].abs);
      await writeFile(path.join(dstDir, name), buf);
      totalBefore += before;
      totalAfter += buf.length;
      totalCount++;
      console.log(`  ${files[i].label} -> ${name}  ${fmtSize(before)} -> ${fmtSize(buf.length)}  (kualitas ${q})`);
      if (over) notes.push(`${slug}/${name}: ${fmtSize(buf.length)} melewati batas ${maxKB} KB pada kualitas ${q}. Foto ini berbutir atau sangat detail. Periksa hasilnya, atau naikkan --max-kb.`);
    }

    let existing = [];
    try {
      existing = await readdir(dstDir);
    } catch {
      /* folder belum ada */
    }
    const leftovers = existing.filter((n) => !written.has(n) && n !== ".gitkeep");
    const pattern = /^\d{2}\.(jpe?g|webp|png)$/i;
    if (leftovers.length) {
      if (clean) {
        const removable = leftovers.filter((n) => pattern.test(n));
        const keep = leftovers.filter((n) => !pattern.test(n));
        for (const n of removable) {
          if (!dryRun) await rm(path.join(dstDir, n));
        }
        if (removable.length) notes.push(`${slug}: ${dryRun ? "akan dihapus" : "dihapus"} file hasil lama: ${removable.join(", ")}.`);
        if (keep.length) notes.push(`${slug}: file di folder hasil yang bukan berpola NN tidak disentuh: ${keep.join(", ")}.`);
      } else {
        notes.push(`${slug}: file lama di folder hasil tidak ikut diganti: ${leftovers.join(", ")}. Jalankan dengan --clean atau hapus sendiri bila tidak dipakai.`);
      }
    }
  }

  if (!dryRun) console.log(`\n${totalCount} foto selesai. ${fmtSize(totalBefore)} -> ${fmtSize(totalAfter)}`);
  if (notes.length) {
    console.log("\nCatatan:");
    for (const n of notes) console.log(`- ${n}`);
  }
  if (!dryRun && totalCount === 0) process.exit(1);
}

// ---------------------------------------------------------------- JALANKAN
if (flags.thumbs) {
  await runThumbs(flags.thumbs);
} else {
  await runProcess();
}
