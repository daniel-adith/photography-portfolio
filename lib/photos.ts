import fs from "node:fs";
import path from "node:path";

const EXTENSIONS = ["jpg", "jpeg", "webp", "png"] as const;

export function getFrame(slug: string, n: number): string | null {
  const nn = String(n).padStart(2, "0");
  const dirPath = path.join(process.cwd(), "public", "photos", slug);

  if (!fs.existsSync(dirPath)) {
    return null;
  }

  try {
    for (const ext of EXTENSIONS) {
      const fileName = `${nn}.${ext}`;
      const filePath = path.join(dirPath, fileName);
      if (fs.existsSync(filePath)) {
        return `/photos/${slug}/${fileName}`;
      }
      // Also check uppercase extensions (e.g. .JPG)
      const upperFileName = `${nn}.${ext.toUpperCase()}`;
      const upperFilePath = path.join(dirPath, upperFileName);
      if (fs.existsSync(upperFilePath)) {
        return `/photos/${slug}/${upperFileName}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}
