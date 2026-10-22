import { CONTENT } from "@/content/content";
import { PhotoFrame, GalleryPhoto } from "./Gallery";
import styles from "./Selected.module.css";

export interface ProjectFrameData {
  n: number;
  photoUrl: string | null;
}

export interface ProjectData {
  no: string;
  slug: string;
  name: string;
  meta: string;
  frames: ProjectFrameData[];
}

interface SelectedProps {
  projects: ProjectData[];
}

export default function Selected({ projects }: SelectedProps) {
  // Build a list of all existing photos for lightbox navigation
  const allPhotos: GalleryPhoto[] = [];
  projects.forEach((proj) => {
    proj.frames.forEach((frame) => {
      if (frame.photoUrl) {
        allPhotos.push({
          src: frame.photoUrl,
          alt: `${proj.name}, foto ${frame.n}`,
        });
      }
    });
  });

  return (
    <section id="selected" className={styles.section} aria-labelledby="selected-title">
      <div className={styles.inner}>
        <div className={styles.sectionHeader}>
          <h2 id="selected-title" className={styles.sectionTitle}>
            {CONTENT.selected.title}
          </h2>
          <p className={styles.sectionIntro}>{CONTENT.selected.intro}</p>
        </div>

        <div className={styles.projectList}>
          {projects.map((proj) => {
            const frame1 = proj.frames[0];
            const frame2 = proj.frames[1];
            const frame3 = proj.frames[2];
            const frame4 = proj.frames[3];
            const frame5 = proj.frames[4];
            const frame6 = proj.frames[5];

            return (
              <article key={proj.slug} className={styles.projectItem}>
                <div className={styles.projectBar}>
                  <div className={styles.projectBarLeft}>
                    <span className={styles.projectNo}>[{proj.no}]</span>
                    <h3 className={styles.projectName}>{proj.name}</h3>
                  </div>
                  <span className={styles.projectMeta}>{proj.meta}</span>
                </div>

                <div className={styles.framesContainer}>
                  {/* Top Row: 1:1:2 */}
                  <div className={styles.topRow}>
                    <div className={styles.topRowMobilePair}>
                      <div className={styles.topRowItem1}>
                        {frame1 && (
                          <PhotoFrame
                            slug={proj.slug}
                            n={frame1.n}
                            alt={`${proj.name}, foto ${frame1.n}`}
                            photoUrl={frame1.photoUrl}
                            className={styles.aspect45}
                            allPhotos={allPhotos}
                          />
                        )}
                      </div>
                      <div className={styles.topRowItem2}>
                        {frame2 && (
                          <PhotoFrame
                            slug={proj.slug}
                            n={frame2.n}
                            alt={`${proj.name}, foto ${frame2.n}`}
                            photoUrl={frame2.photoUrl}
                            className={styles.aspect45}
                            allPhotos={allPhotos}
                          />
                        )}
                      </div>
                    </div>
                    <div className={styles.topRowThird}>
                      {frame3 && (
                        <PhotoFrame
                          slug={proj.slug}
                          n={frame3.n}
                          alt={`${proj.name}, foto ${frame3.n}`}
                          photoUrl={frame3.photoUrl}
                          className={styles.aspectTopThird}
                          allPhotos={allPhotos}
                        />
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: 3 frames equal width */}
                  <div className={styles.bottomRow}>
                    {[frame4, frame5, frame6].map(
                      (frame) =>
                        frame && (
                          <PhotoFrame
                            key={frame.n}
                            slug={proj.slug}
                            n={frame.n}
                            alt={`${proj.name}, foto ${frame.n}`}
                            photoUrl={frame.photoUrl}
                            className={styles.aspectBottom}
                            allPhotos={allPhotos}
                          />
                        )
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
