import { CONTENT } from "@/content/content";
import { getFrame } from "@/lib/photos";
import Intro, { TunnelCardItem } from "@/components/Intro";
import Stage from "@/components/Stage";
import { ChapterData } from "@/components/SelectedStage";

export default function Home() {
  // Server-side calculation of tunnel cards for 3D Intro
  const tunnelCards: TunnelCardItem[] = CONTENT.tunnel.map((item) => {
    const project = CONTENT.selected.items.find((s) => s.slug === item.slug);
    const title = project ? project.name : item.slug;
    const photoUrl = getFrame(item.slug, item.n);
    return {
      slug: item.slug,
      n: item.n,
      title,
      photoUrl,
    };
  });

  // Server-side calculation of 8 chapters (6 projects + 2 capsule sets)
  const projectChapters: ChapterData[] = CONTENT.selected.items.map((p) => {
    const frames = [];
    for (let i = 1; i <= p.frames; i++) {
      frames.push({
        n: i,
        photoUrl: getFrame(p.slug, i),
      });
    }
    return {
      type: "six",
      no: p.no,
      slug: p.slug,
      name: p.name,
      meta: p.meta,
      frames,
    };
  });

  const capsuleChapters: ChapterData[] = [];
  let frameOffset = 0;
  CONTENT.capsule.sets.forEach((setCount, setIndex) => {
    const setFrames = [];
    for (let i = 1; i <= setCount; i++) {
      const frameNum = frameOffset + i;
      setFrames.push({
        n: frameNum,
        photoUrl: getFrame(CONTENT.capsule.slug, frameNum),
      });
    }
    frameOffset += setCount;
    capsuleChapters.push({
      type: "sheet",
      setIndex,
      label: CONTENT.capsule.label,
      slug: CONTENT.capsule.slug,
      intro: CONTENT.capsule.intro,
      frames: setFrames,
    });
  });

  const allChapters: ChapterData[] = [...projectChapters, ...capsuleChapters];

  return (
    <>
      <Intro
        cards={tunnelCards}
        kicker={CONTENT.intro.kicker}
        title={CONTENT.intro.title}
      />

      <main id="main-content">
        <Stage chapters={allChapters} />
      </main>
    </>
  );
}
