"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import Approach from "./Approach";
import Works from "./Works";
import SelectedStage, { ChapterData } from "./SelectedStage";
import Contact from "./Contact";
import { INTRO_ONCE_PER_SESSION } from "@/lib/intro-config";
import styles from "./Stage.module.css";

export const SCENE_IDS = [
  "hero",
  "about",
  "approach",
  "works",
  "selected",
  "contact",
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export interface StageContextType {
  sceneIndex: number;
  currentSceneId: SceneId;
  chapterIndex: number;
  playing: boolean;
  busy: boolean;
  lightboxOpen: boolean;
  reducedMotion: boolean;
  goToScene: (targetIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setChapterIndex: (ch: number) => void;
  togglePlay: () => void;
  setLightboxOpen: (open: boolean) => void;
}

const StageContext = createContext<StageContextType | null>(null);

export function useStage() {
  const ctx = useContext(StageContext);
  if (!ctx) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return ctx;
}

interface StageState {
  sceneIndex: number;
  prevSceneIndex: number | null;
  isTransitioning: boolean;
  chapterIndex: number;
  playing: boolean;
  busy: boolean;
  lightboxOpen: boolean;
  direction: 1 | -1; // 1 = forward, -1 = backward
}

type StageAction =
  | { type: "NAVIGATE_SCENE"; targetIndex: number }
  | { type: "SET_INITIAL_SCENE"; targetIndex: number }
  | { type: "FINISH_TRANSITION" }
  | { type: "SET_BUSY"; busy: boolean }
  | { type: "SET_CHAPTER"; chapterIndex: number }
  | { type: "TOGGLE_PLAY" }
  | { type: "SET_LIGHTBOX"; open: boolean }
  | { type: "SET_DIRECTION"; direction: 1 | -1 };

function stageReducer(state: StageState, action: StageAction): StageState {
  switch (action.type) {
    case "NAVIGATE_SCENE": {
      if (action.targetIndex === state.sceneIndex) return state;
      const direction = action.targetIndex > state.sceneIndex ? 1 : -1;
      return {
        ...state,
        prevSceneIndex: state.sceneIndex,
        sceneIndex: action.targetIndex,
        isTransitioning: true,
        direction,
        busy: true,
      };
    }
    case "SET_INITIAL_SCENE":
      return {
        ...state,
        sceneIndex: action.targetIndex,
        prevSceneIndex: null,
        isTransitioning: false,
        busy: false,
      };
    case "FINISH_TRANSITION":
      return {
        ...state,
        prevSceneIndex: null,
        isTransitioning: false,
      };
    case "SET_BUSY":
      return { ...state, busy: action.busy };
    case "SET_CHAPTER":
      return { ...state, chapterIndex: action.chapterIndex };
    case "TOGGLE_PLAY":
      return { ...state, playing: !state.playing };
    case "SET_LIGHTBOX":
      return { ...state, lightboxOpen: action.open };
    case "SET_DIRECTION":
      return { ...state, direction: action.direction };
    default:
      return state;
  }
}

interface StageProps {
  chapters: ChapterData[];
}

// Hook to check prefers-reduced-motion safely with hydration match
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    () => false // server snapshot
  );
}

export default function Stage({ chapters }: StageProps) {
  const reducedMotion = usePrefersReducedMotion();

  const [state, dispatch] = useReducer(stageReducer, {
    sceneIndex: 0,
    prevSceneIndex: null,
    isTransitioning: false,
    chapterIndex: 0,
    playing: true,
    busy: false,
    lightboxOpen: false,
    direction: 1,
  });

  const accumulatedDeltaRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Handle initial hash routing and subsequent hash updates
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const target = SCENE_IDS.indexOf(hash as SceneId);
        if (target >= 0 && target !== state.sceneIndex) {
          if (INTRO_ONCE_PER_SESSION) {
            try {
              sessionStorage.setItem("intro_seen", "1");
            } catch {}
          }
          document.documentElement.setAttribute("data-intro", "off");
          dispatch({ type: "SET_INITIAL_SCENE", targetIndex: target });
          return;
        }
      }
    }

    const sceneId = SCENE_IDS[state.sceneIndex];
    if (state.sceneIndex === 0) {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    } else {
      history.replaceState(null, "", `#${sceneId}`);
    }

  }, [state.sceneIndex]);

  // Manage transition state duration (900ms / 250ms reduced motion)
  useEffect(() => {
    if (!state.isTransitioning) return;

    const transitionTimer = setTimeout(() => {
      dispatch({ type: "FINISH_TRANSITION" });
    }, reducedMotion ? 250 : 900);

    return () => clearTimeout(transitionTimer);
  }, [state.isTransitioning, reducedMotion]);

  // Manage busy lock (900ms + 150ms buffer = 1050ms) and heading focus
  useEffect(() => {
    if (!state.busy) return;

    const busyTimer = setTimeout(() => {
      dispatch({ type: "SET_BUSY", busy: false });

      // Move focus to new scene heading (tabIndex -1)
      const heading = document.querySelector<HTMLElement>(
        `[data-scene-index="${state.sceneIndex}"] h1, [data-scene-index="${state.sceneIndex}"] h2, [data-scene-index="${state.sceneIndex}"] h3`
      );
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }, reducedMotion ? 250 : 1050);

    return () => clearTimeout(busyTimer);
  }, [state.busy, state.sceneIndex, reducedMotion]);

  const goToScene = useCallback(
    (targetIndex: number) => {
      if (state.busy || state.lightboxOpen) return;
      const intro = document.documentElement.getAttribute("data-intro");
      if (intro === "on" || intro === "exit") return;

      if (targetIndex >= 0 && targetIndex < SCENE_IDS.length) {
        dispatch({ type: "NAVIGATE_SCENE", targetIndex });
      }
    },
    [state.busy, state.lightboxOpen]
  );

  const nextStep = useCallback(() => {
    if (state.busy || state.lightboxOpen) return;
    const intro = document.documentElement.getAttribute("data-intro");
    if (intro === "on" || intro === "exit") return;

    if (state.sceneIndex === 4) {
      // In selected works, if chapter < 7, advance chapter
      if (state.chapterIndex < 7) {
        dispatch({ type: "SET_CHAPTER", chapterIndex: state.chapterIndex + 1 });
      } else {
        // Last chapter -> zoom to contact scene
        goToScene(5);
      }
    } else if (state.sceneIndex < SCENE_IDS.length - 1) {
      goToScene(state.sceneIndex + 1);
    }
  }, [state.busy, state.lightboxOpen, state.sceneIndex, state.chapterIndex, goToScene]);

  const prevStep = useCallback(() => {
    if (state.busy || state.lightboxOpen) return;
    const intro = document.documentElement.getAttribute("data-intro");
    if (intro === "on" || intro === "exit") return;

    if (state.sceneIndex === 4) {
      if (state.chapterIndex > 0) {
        dispatch({ type: "SET_CHAPTER", chapterIndex: state.chapterIndex - 1 });
      } else {
        // First chapter backward -> zoom back to works scene
        goToScene(3);
      }
    } else if (state.sceneIndex > 0) {
      goToScene(state.sceneIndex - 1);
    }
  }, [state.busy, state.lightboxOpen, state.sceneIndex, state.chapterIndex, goToScene]);

  // Wheel input handler: accumulate deltaY > 40
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const intro = document.documentElement.getAttribute("data-intro");
      if (intro === "on" || intro === "exit") return;

      e.preventDefault();

      // Ignore horizontal scrolls
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (state.busy || state.lightboxOpen) return;

      accumulatedDeltaRef.current += e.deltaY;

      if (accumulatedDeltaRef.current > 40) {
        accumulatedDeltaRef.current = 0;
        nextStep();
      } else if (accumulatedDeltaRef.current < -40) {
        accumulatedDeltaRef.current = 0;
        prevStep();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [state.busy, state.lightboxOpen, nextStep, prevStep]);

  // Touch swipe handler: deltaY > 48px
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const intro = document.documentElement.getAttribute("data-intro");
      if (intro === "on" || intro === "exit") return;
      if (touchStartYRef.current === null) return;
      if (state.busy || state.lightboxOpen) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;

      if (deltaY > 48) {
        touchStartYRef.current = null;
        nextStep();
      } else if (deltaY < -48) {
        touchStartYRef.current = null;
        prevStep();
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [state.busy, state.lightboxOpen, nextStep, prevStep]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const intro = document.documentElement.getAttribute("data-intro");
      if (intro === "on" || intro === "exit") return;
      if (state.busy || state.lightboxOpen) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "button" || activeTag === "a") {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToScene(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToScene(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.busy, state.lightboxOpen, nextStep, prevStep, goToScene]);

  // Listen to browser hash changes (Back/Forward buttons, external links)
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace("#", "");
      if (h) {
        const target = SCENE_IDS.indexOf(h as SceneId);
        if (target >= 0 && target !== state.sceneIndex) {
          goToScene(target);
        }
      } else if (state.sceneIndex !== 0) {
        goToScene(0);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [state.sceneIndex, goToScene]);

  const handleChapterChange = useCallback((chapterIndex: number) => {
    dispatch({ type: "SET_CHAPTER", chapterIndex });
  }, []);

  const handleTogglePlay = useCallback(() => {
    dispatch({ type: "TOGGLE_PLAY" });
  }, []);

  const handleAdvanceToContact = useCallback(() => {
    goToScene(5);
  }, [goToScene]);

  const handleBackToWorks = useCallback(() => {
    goToScene(3);
  }, [goToScene]);

  const handleLightboxStateChange = useCallback((open: boolean) => {
    dispatch({ type: "SET_LIGHTBOX", open });
  }, []);

  const sceneElements = [
    <Hero key="hero" />,
    <About key="about" />,
    <Approach key="approach" />,
    <Works key="works" />,
    <SelectedStage
      key="selected"
      chapters={chapters}
      currentChapter={state.chapterIndex}
      playing={state.playing}
      reducedMotion={reducedMotion}
      isActiveScene={state.sceneIndex === 4}
      onChapterChange={handleChapterChange}
      onTogglePlay={handleTogglePlay}
      onAdvanceToContact={handleAdvanceToContact}
      onBackToWorks={handleBackToWorks}
      onLightboxStateChange={handleLightboxStateChange}
    />,
    <Contact key="contact" />,
  ];

  const currentSceneId = SCENE_IDS[state.sceneIndex];

  // Zoom motion variants
  const variants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: (dir: number) => ({
          z: dir === 1 ? -900 : 520,
          opacity: 0,
        }),
        enter: (dir: number) => ({
          z: dir === 1 ? -900 : 520,
          opacity: 0,
        }),
        center: {
          z: 0,
          opacity: 1,
        },
        exit: (dir: number) => ({
          z: dir === 1 ? 520 : -900,
          opacity: 0,
        }),
      };

  return (
    <StageContext.Provider
      value={{
        sceneIndex: state.sceneIndex,
        currentSceneId,
        chapterIndex: state.chapterIndex,
        playing: state.playing,
        busy: state.busy,
        lightboxOpen: state.lightboxOpen,
        reducedMotion,
        goToScene,
        nextStep,
        prevStep,
        setChapterIndex: (ch) => dispatch({ type: "SET_CHAPTER", chapterIndex: ch }),
        togglePlay: () => dispatch({ type: "TOGGLE_PLAY" }),
        setLightboxOpen: (open) => dispatch({ type: "SET_LIGHTBOX", open }),
      }}
    >
      <Header />
      <div id="stage-root" className={styles.stage}>
        <div className={styles.perspectiveContainer}>
          {SCENE_IDS.map((id, index) => {
            const isActive = index === state.sceneIndex;
            const isExiting = index === state.prevSceneIndex && state.isTransitioning;
            const isVisible = isActive || isExiting;

            return (
              <motion.div
                key={id}
                id={`scene-${id}`}
                data-scene-index={index}
                className={styles.sceneWrapper}
                style={{
                  visibility: isVisible ? "visible" : "hidden",
                  pointerEvents: isActive && !state.busy ? "auto" : "none",
                  zIndex: isActive ? 2 : isExiting ? 1 : 0,
                }}
                aria-hidden={!isActive ? "true" : undefined}
                inert={!isActive ? true : undefined}
                custom={state.direction}
                variants={variants}
                initial={false}
                animate={isActive ? "center" : isExiting ? "exit" : "hidden"}
                transition={{
                  duration: reducedMotion ? 0.25 : 0.9,
                  ease: [0.2, 0.7, 0.1, 1],
                }}
              >
                {sceneElements[index]}
              </motion.div>
            );
          })}
        </div>
      </div>
    </StageContext.Provider>
  );
}
