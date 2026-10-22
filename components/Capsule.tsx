import { CONTENT } from "@/content/content";
import { PhotoFrame, GalleryPhoto } from "./Gallery";
import styles from "./Capsule.module.css";

export interface CapsuleFrameData {
  n: number;
  photoUrl: string | null;
}

interface CapsuleProps {
  set1Frames: CapsuleFrameData[];
  set2Frames: CapsuleFrameData[];
}

export default function Capsule({ set1Frames, set2Frames }: CapsuleProps) {
  const allPhotos: GalleryPhoto[] = [];
  [...set1Frames, ...set2Frames].forEach((frame) => {
    if (frame.photoUrl) {
      allPhotos.push({
        src: frame.photoUrl,
        alt: `${CONTENT.capsule.label}, foto ${frame.n}`,
      });
    }
  });

  return (
    <section id="capsule" className={styles.section} aria-label={CONTENT.capsule.label}>
      <div className={styles.inner}>
        <p className={styles.intro}>{CONTENT.capsule.intro}</p>

        {/* Set 1: 8 frames (4 cols x 2 rows on desktop, 2 cols on mobile) */}
        <div className={styles.grid1}>
          {set1Frames.map((frame) => (
            <PhotoFrame
              key={frame.n}
              slug={CONTENT.capsule.slug}
              n={frame.n}
              alt={`${CONTENT.capsule.label}, foto ${frame.n}`}
              photoUrl={frame.photoUrl}
              className={styles.aspect45}
              allPhotos={allPhotos}
            />
          ))}
        </div>

        {/* Set 2: 10 frames (5 cols x 2 rows on desktop, 2 cols on mobile) */}
        <div className={styles.grid2}>
          {set2Frames.map((frame) => (
            <PhotoFrame
              key={frame.n}
              slug={CONTENT.capsule.slug}
              n={frame.n}
              alt={`${CONTENT.capsule.label}, foto ${frame.n}`}
              photoUrl={frame.photoUrl}
              className={styles.aspect45}
              allPhotos={allPhotos}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
