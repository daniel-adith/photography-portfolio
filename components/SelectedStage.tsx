"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TIMING } from "@/lib/timing";
import FlipCard from "./FlipCard";
import ChapterControls from "./ChapterControls";
import Lightbox, { LightboxPhoto } from "./Lightbox";
import styles from "./SelectedStage.module.css";

export interface ProjectFrameData {
  n: number;
  photoUrl: string | null;
}

export interface ProjectChapterData {
  type: "six";
  no: string;
  slug: string;
  name: string;
  meta: string;
  frames: ProjectFrameData[];
}

export interface CapsuleChapterData {
  type: "sheet";
  setIndex: number; // 0 or 1
  label: string;
  slug: string;
  intro: string;
  frames: ProjectFrameData[];
}

export type ChapterData = ProjectChapterData | CapsuleChapterData;

interface SelectedStageProps {
  chapters: ChapterData[];
  currentChapter: number;
  playing: boolean;
  reducedMotion: boolean;
  isActiveScene?: boolean;
  onChapterChange: (index: number) => void;
  onTogglePlay: () => void;
  onAdvanceToContact: () => void;
  onBackToWorks: () => void;
  onLightboxStateChange: (open: boolean) => void;
}

type ChapterPhase = "title-in" | "cards-flip-in" | "hold" | "auto-outro" | "manual-outro";

export default function SelectedStage({
  chapters,
  currentChapter,
  playing,
  reducedMotion,
  isActiveScene = true,
  onChapterChange,
  onTogglePlay,
  onAdvanceToContact,
  onBackToWorks,
  onLightboxStateChange,
}: SelectedStageProps) {
  const [phase, setPhase] = useState<ChapterPhase>("title-in");
  const [titleVisible, setTitleVisible] = useState<boolean>(true);
  const [cardsFlipped, setCardsFlipped] = useState<boolean[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [targetChapterPending, setTargetChapterPending] = useState<number | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([]);

  // Focus & visibility tracking for pausing autoplay
  const [isGridFocused, setIsGridFocused] = useState<boolean>(false);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  const activeChapterData = chapters[currentChapter];
  const totalChapters = chapters.length;

  const chapterNames = useMemo(
    () =>
      chapters.map((ch) =>
        ch.type === "six" ? ch.name : `${ch.label} Set ${ch.setIndex + 1}`
      ),
    [chapters]
  );

  // Sync tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Sync lightbox state to parent (Stage)
  const prevLightboxRef = React.useRef(lightboxOpen);
  useEffect(() => {
    if (prevLightboxRef.current !== lightboxOpen) {
      prevLightboxRef.current = lightboxOpen;
      onLightboxStateChange(lightboxOpen);
    }
  }, [lightboxOpen, onLightboxStateChange]);

  const canAutoplay =
    isActiveScene &&
    playing &&
    !lightboxOpen &&
    isTabVisible &&
    !isGridFocused &&
    !reducedMotion;

  // Initialize or reset card flip states when chapter changes or when scene becomes active
  useEffect(() => {
    if (!activeChapterData || !isActiveScene) return;
    const cardCount = activeChapterData.frames.length;

    const initTimer = setTimeout(() => {
      if (reducedMotion) {
        setCardsFlipped(new Array(cardCount).fill(true));
        setTitleVisible(true);
        setPhase("hold");
        return;
      }

      setCardsFlipped(new Array(cardCount).fill(false));
      setTitleVisible(true);
      setProgress(0);
      setPhase("title-in");
    }, 0);

    const cardsTimer = setTimeout(() => {
      if (!reducedMotion) {
        setPhase("cards-flip-in");
        setCardsFlipped(new Array(cardCount).fill(true));
      }
    }, 300);

    const stagger =
      activeChapterData.type === "six"
        ? TIMING.FLIP_STAGGER_MS
        : TIMING.SHEET_STAGGER_MS;
    const totalFlipInMs = 300 + (cardCount - 1) * stagger + TIMING.FLIP_MS;

    const holdTimer = setTimeout(() => {
      if (!reducedMotion) {
        setPhase("hold");
      }
    }, totalFlipInMs);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(cardsTimer);
      clearTimeout(holdTimer);
    };
  }, [currentChapter, activeChapterData, reducedMotion, isActiveScene]);

  // Hold phase timer & progress bar filling
  useEffect(() => {
    if (phase !== "hold" || reducedMotion || !activeChapterData) return;

    const cardCount = activeChapterData.frames.length;
    const intervalTime = 50;
    const stepIncrement = intervalTime / TIMING.HOLD_MS;

    const progressInterval = setInterval(() => {
      if (!canAutoplay) return;

      setProgress((prev) => {
        const nextVal = prev + stepIncrement;
        if (nextVal >= 1) {
          clearInterval(progressInterval);
          // If this is the last chapter, hold and stop autoplay
          if (currentChapter === totalChapters - 1) {
            if (playing) {
              onTogglePlay(); // stop autoplay at last chapter
            }
          } else if (canAutoplay) {
            // Trigger auto-outro
            setPhase("auto-outro");
            setTitleVisible(false);
            setCardsFlipped(new Array(cardCount).fill(false));
          }
          return 1;
        }
        return nextVal;
      });
    }, intervalTime);

    return () => clearInterval(progressInterval);
  }, [phase, canAutoplay, currentChapter, totalChapters, playing, onTogglePlay, reducedMotion, activeChapterData]);

  // Auto-outro handling
  useEffect(() => {
    if (phase !== "auto-outro") return;

    if (!activeChapterData) return;
    const cardCount = activeChapterData.frames.length;

    const totalOutroMs = Math.max(
      TIMING.TITLE_FADE_MS,
      (cardCount - 1) * TIMING.OUTRO_STAGGER_MS + TIMING.OUTRO_FLIP_MS
    );

    const nextTimer = setTimeout(() => {
      if (currentChapter < totalChapters - 1) {
        onChapterChange(currentChapter + 1);
      }
    }, totalOutroMs);

    return () => clearTimeout(nextTimer);
  }, [phase, activeChapterData, currentChapter, totalChapters, onChapterChange]);

  // Manual-outro handling
  useEffect(() => {
    if (phase !== "manual-outro" || targetChapterPending === null) return;

    const manualTimer = setTimeout(() => {
      const dest = targetChapterPending;
      setTargetChapterPending(null);
      onChapterChange(dest);
    }, TIMING.MANUAL_OUTRO_MS);

    return () => clearTimeout(manualTimer);
  }, [phase, targetChapterPending, onChapterChange]);

  // Manual navigation handlers
  const handleManualNavigate = useCallback(
    (targetIndex: number) => {
      if (reducedMotion) {
        onChapterChange(targetIndex);
        return;
      }
      setTargetChapterPending(targetIndex);
      setPhase("manual-outro");
      setTitleVisible(false);
      if (activeChapterData) {
        setCardsFlipped(new Array(activeChapterData.frames.length).fill(false));
      }
    },
    [onChapterChange, reducedMotion, activeChapterData]
  );

  const handlePrev = useCallback(() => {
    if (currentChapter > 0) {
      handleManualNavigate(currentChapter - 1);
    } else {
      // First chapter backward -> zoom back to Works scene
      onBackToWorks();
    }
  }, [currentChapter, handleManualNavigate, onBackToWorks]);

  const handleNext = useCallback(() => {
    if (currentChapter < totalChapters - 1) {
      handleManualNavigate(currentChapter + 1);
    } else {
      // Last chapter forward -> zoom to Contact scene
      onAdvanceToContact();
    }
  }, [currentChapter, totalChapters, handleManualNavigate, onAdvanceToContact]);

  const handleSelectChapter = useCallback(
    (idx: number) => {
      if (idx === currentChapter) return;
      handleManualNavigate(idx);
    },
    [currentChapter, handleManualNavigate]
  );

  // Lightbox click handler
  const handleCardClick = useCallback(
    (frameIndex: number) => {
      if (!activeChapterData) return;
      // Collect valid photos from this chapter
      const photos: LightboxPhoto[] = [];
      let initialIdx = 0;

      activeChapterData.frames.forEach((f) => {
        if (f.photoUrl) {
          if (f.n === activeChapterData.frames[frameIndex].n) {
            initialIdx = photos.length;
          }
          photos.push({
            src: f.photoUrl,
            alt:
              activeChapterData.type === "six"
                ? `${activeChapterData.name}, foto ${f.n}`
                : `${activeChapterData.label}, foto ${f.n}`,
          });
        }
      });

      if (photos.length > 0) {
        setLightboxPhotos(photos);
        setLightboxIndex(initialIdx);
        setLightboxOpen(true);
      }
    },
    [activeChapterData]
  );

  if (!activeChapterData) return null;

  // Determine timing parameters based on phase
  const isAutoOutro = phase === "auto-outro";
  const isManualOutro = phase === "manual-outro";

  const getCardDurationMs = () => {
    if (isManualOutro) return TIMING.MANUAL_OUTRO_MS;
    if (isAutoOutro) return TIMING.OUTRO_FLIP_MS;
    return TIMING.FLIP_MS;
  };

  const getCardDelayMs = (index: number) => {
    if (isManualOutro) return 0;
    if (isAutoOutro) return index * TIMING.OUTRO_STAGGER_MS;
    return (
      index *
      (activeChapterData.type === "six"
        ? TIMING.FLIP_STAGGER_MS
        : TIMING.SHEET_STAGGER_MS)
    );
  };

  // Render cards according to chapter layout
  const renderCards = () => {
    const frames = activeChapterData.frames;
    const count = frames.length;

    if (activeChapterData.type === "six") {
      if (count === 6) {
        const topFrames = frames.slice(0, 3);
        const bottomFrames = frames.slice(3, 6);

        return (
          <div className={styles.gridSix}>
            <div className={styles.topRowSix}>
              {topFrames.map((f, i) => (
                <FlipCard
                  key={`${activeChapterData.slug}-${f.n}`}
                  n={f.n}
                  slug={activeChapterData.slug}
                  alt={`${activeChapterData.name}, foto ${f.n}`}
                  photoUrl={f.photoUrl}
                  isFlipped={cardsFlipped[i] ?? false}
                  durationMs={getCardDurationMs()}
                  delayMs={getCardDelayMs(i)}
                  shouldLoadImage={true}
                  reducedMotion={reducedMotion}
                  onCardClick={() => handleCardClick(i)}
                />
              ))}
            </div>
            <div className={styles.bottomRowSix}>
              {bottomFrames.map((f, i) => {
                const actualIdx = i + 3;
                return (
                  <FlipCard
                    key={`${activeChapterData.slug}-${f.n}`}
                    n={f.n}
                    slug={activeChapterData.slug}
                    alt={`${activeChapterData.name}, foto ${f.n}`}
                    photoUrl={f.photoUrl}
                    isFlipped={cardsFlipped[actualIdx] ?? false}
                    durationMs={getCardDurationMs()}
                    delayMs={getCardDelayMs(actualIdx)}
                    shouldLoadImage={true}
                    reducedMotion={reducedMotion}
                    onCardClick={() => handleCardClick(actualIdx)}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      if (count === 5) {
        const topFrames = frames.slice(0, 3);
        const bottomFrames = frames.slice(3, 5);

        return (
          <div className={styles.gridFive}>
            <div className={styles.topRowFive}>
              {topFrames.map((f, i) => (
                <FlipCard
                  key={`${activeChapterData.slug}-${f.n}`}
                  n={f.n}
                  slug={activeChapterData.slug}
                  alt={`${activeChapterData.name}, foto ${f.n}`}
                  photoUrl={f.photoUrl}
                  isFlipped={cardsFlipped[i] ?? false}
                  durationMs={getCardDurationMs()}
                  delayMs={getCardDelayMs(i)}
                  shouldLoadImage={true}
                  reducedMotion={reducedMotion}
                  onCardClick={() => handleCardClick(i)}
                />
              ))}
            </div>
            <div className={styles.bottomRowFive}>
              {bottomFrames.map((f, i) => {
                const actualIdx = i + 3;
                return (
                  <FlipCard
                    key={`${activeChapterData.slug}-${f.n}`}
                    n={f.n}
                    slug={activeChapterData.slug}
                    alt={`${activeChapterData.name}, foto ${f.n}`}
                    photoUrl={f.photoUrl}
                    isFlipped={cardsFlipped[actualIdx] ?? false}
                    durationMs={getCardDurationMs()}
                    delayMs={getCardDelayMs(actualIdx)}
                    shouldLoadImage={true}
                    reducedMotion={reducedMotion}
                    onCardClick={() => handleCardClick(actualIdx)}
                  />
                );
              })}
            </div>
          </div>
        );
      }

      if (count === 4) {
        // Varian C: 4 potret / 1 baris 4 kolom sama besar di desktop, 2x2 di mobile
        return (
          <div className={styles.gridFourCols}>
            {frames.map((f, i) => (
              <FlipCard
                key={`${activeChapterData.slug}-${f.n}`}
                n={f.n}
                slug={activeChapterData.slug}
                alt={`${activeChapterData.name}, foto ${f.n}`}
                photoUrl={f.photoUrl}
                isFlipped={cardsFlipped[i] ?? false}
                durationMs={getCardDurationMs()}
                delayMs={getCardDelayMs(i)}
                shouldLoadImage={true}
                reducedMotion={reducedMotion}
                onCardClick={() => handleCardClick(i)}
              />
            ))}
          </div>
        );
      }

      // 1 sampai 3 frame: satu baris kolom sama lebar
      return (
        <div
          className={styles.gridRow}
          style={{ "--cols": count } as React.CSSProperties}
        >
          {frames.map((f, i) => (
            <FlipCard
              key={`${activeChapterData.slug}-${f.n}`}
              n={f.n}
              slug={activeChapterData.slug}
              alt={`${activeChapterData.name}, foto ${f.n}`}
              photoUrl={f.photoUrl}
              isFlipped={cardsFlipped[i] ?? false}
              durationMs={getCardDurationMs()}
              delayMs={getCardDelayMs(i)}
              shouldLoadImage={true}
              reducedMotion={reducedMotion}
              onCardClick={() => handleCardClick(i)}
            />
          ))}
        </div>
      );
    }

    // Dynamic Sheet layout (Capsule)
    const cols = Math.ceil(frames.length / 2);
    return (
      <div
        className={styles.gridSheet}
        style={{ "--sheet-cols": cols } as React.CSSProperties}
      >
        {frames.map((f, i) => (
          <FlipCard
            key={`${activeChapterData.slug}-${f.n}`}
            n={f.n}
            slug={activeChapterData.slug}
            alt={`${activeChapterData.label}, foto ${f.n}`}
            photoUrl={f.photoUrl}
            isFlipped={cardsFlipped[i] ?? false}
            durationMs={getCardDurationMs()}
            delayMs={getCardDelayMs(i)}
            shouldLoadImage={true}
            reducedMotion={reducedMotion}
            onCardClick={() => handleCardClick(i)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.stageWrapper}>
      {/* Chapter Title Bar (Single line above grid) */}
      <div
        className={styles.titleBar}
        style={{
          opacity: reducedMotion || titleVisible ? 1 : 0,
          transitionDuration: `${TIMING.TITLE_FADE_MS}ms`,
        }}
      >
        <div className={styles.titleLeft}>
          {activeChapterData.type === "six" && (
            <span className={styles.chapterNumber}>[{activeChapterData.no}]</span>
          )}
          <h3 className={styles.chapterTitle}>
            {activeChapterData.type === "six"
              ? activeChapterData.name
              : activeChapterData.label}
          </h3>
        </div>

        <div className={styles.titleRight}>
          {activeChapterData.type === "six" ? (
            <span className={styles.chapterMetaMono}>{activeChapterData.meta}</span>
          ) : (
            <p className={styles.capsuleIntro}>{activeChapterData.intro}</p>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div
        className={styles.gridArea}
        onFocusCapture={() => setIsGridFocused(true)}
        onBlurCapture={() => setIsGridFocused(false)}
      >
        {renderCards()}
      </div>

      {/* Bottom Controls */}
      <ChapterControls
        totalChapters={totalChapters}
        currentChapter={currentChapter}
        chapterNames={chapterNames}
        activeProgress={progress}
        playing={playing}
        reducedMotion={reducedMotion}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePlay={onTogglePlay}
        onSelectChapter={handleSelectChapter}
      />

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Lightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
