"use client";

import {
  motion,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { CONTENT } from "@/content/content";
import styles from "./Intro.module.css";

export interface TunnelCardItem {
  slug: string;
  n: number;
  title: string;
  photoUrl: string | null;
}

interface TunnelCardData {
  item: TunnelCardItem;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
}

interface StageDimensions {
  width: number;
  height: number;
  isMobile: boolean;
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

function useCameraParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

interface TunnelCardProps {
  card: TunnelCardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
  const staggerSpan = 0.55;
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  const localProgress = useTransform(progress, [start, end], [0, 1]);

  const farZ = stage.isMobile ? -1200 : -1700;
  const nearZ = stage.isMobile ? 350 : 500;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

  const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

  const cardWidth = stage.isMobile
    ? Math.max(130, Math.min(180, stage.width * 0.38))
    : Math.max(180, Math.min(270, stage.width * 0.18));

  const baseX = card.angleCos * (stage.width * card.radiusFactorX);
  const baseY = card.angleSin * (stage.height * card.radiusFactorY);
  const panStrength = stage.isMobile ? 20 : 45;

  const transform = useTransform(
    [z, pointer.x, pointer.y],
    ([currZ, px, py]: number[]) => {
      const offsetX = baseX - px * panStrength;
      const offsetY = baseY - py * panStrength;
      return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
    }
  );

  const formattedNumber = String(card.item.n).padStart(2, "0");

  return (
    <motion.div
      style={{
        width: cardWidth,
        transform,
        opacity,
        zIndex: card.index + 1,
      }}
      className={styles.card}
    >
      <div className={styles.cardFrame}>
        {card.item.photoUrl ? (
          <Image
            src={card.item.photoUrl}
            alt={`${card.item.title}, foto ${card.item.n}`}
            fill
            sizes="(max-width: 768px) 180px, 270px"
            loading="eager"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className={styles.placeholderNumber}>[{formattedNumber}]</span>
        )}
      </div>
      <span className={styles.cardTitle}>{card.item.title}</span>
    </motion.div>
  );
}

interface IntroProps {
  cards: TunnelCardItem[];
  kicker: string;
  title: string;
  onComplete?: () => void;
}

export default function Intro({ cards, kicker, title, onComplete }: IntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();
  const [introState, setIntroState] = useState<"on" | "exit" | "off">("on");
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [stage, setStage] = useState<StageDimensions>({
    width: 1440,
    height: 900,
    isMobile: false,
  });

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.0001,
  });

  const pointer = useCameraParallax(!prefersReduced);

  const tunnelCards: TunnelCardData[] = cards.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    const radiusFactorX = 0.28 + (i % 3) * 0.08;
    const radiusFactorY = 0.26 + (i % 2) * 0.09;
    return {
      item,
      angleCos: Math.cos(goldenAngle),
      angleSin: Math.sin(goldenAngle),
      radiusFactorX,
      radiusFactorY,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });

  const completeIntro = useCallback(() => {
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);

    setIntroState("exit");
    document.documentElement.setAttribute("data-intro", "exit");

    finishTimeoutRef.current = setTimeout(() => {
      setIntroState("off");
      document.documentElement.setAttribute("data-intro", "off");
      try {
        sessionStorage.setItem("intro_seen", "1");
      } catch {
        // ignore sessionStorage errors
      }
      onComplete?.();
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.focus();
      }
    }, 700);
  }, [onComplete]);

  // Check initial state: reduced motion, sessionStorage, or html[data-intro="off"]
  useEffect(() => {
    let shouldSkip = false;
    try {
      const seen = sessionStorage.getItem("intro_seen");
      if (seen === "1" || seen === "true") {
        shouldSkip = true;
      }
      if (
        window.location.hash &&
        ["#about", "#approach", "#works", "#selected", "#contact"].includes(
          window.location.hash
        )
      ) {
        shouldSkip = true;
      }
    } catch {
      // ignore
    }

    if (
      shouldSkip ||
      prefersReduced ||
      document.documentElement.getAttribute("data-intro") === "off"
    ) {
      queueMicrotask(() => {
        setIntroState("off");
        document.documentElement.setAttribute("data-intro", "off");
        onComplete?.();
      });
    }
  }, [prefersReduced, onComplete]);

  // Stage dimension listener
  useEffect(() => {
    const updateDimensions = () => {
      setStage({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Monitor progress reaching 1.0
  useEffect(() => {
    if (introState !== "on") return;

    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (latest >= 0.999 && !exitTimeoutRef.current && introState === "on") {
        exitTimeoutRef.current = setTimeout(() => {
          completeIntro();
        }, 400);
      }
    });

    return () => {
      unsubscribe();
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [smoothProgress, introState, completeIntro]);

  // Wheel listener
  useEffect(() => {
    if (introState !== "on") return;
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const current = rawProgress.get();
      const delta = e.deltaY * 0.0008;
      const next = Math.min(1, Math.max(0, current + delta));
      rawProgress.set(next);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [rawProgress, introState]);

  // Touch listener (swipe up advances, swipe down decreases)
  useEffect(() => {
    if (introState !== "on") return;
    const el = containerRef.current;
    if (!el) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const diff = touchStartY - currentY;
        touchStartY = currentY;
        e.preventDefault();
        const current = rawProgress.get();
        const delta = diff * 0.002;
        const next = Math.min(1, Math.max(0, current + delta));
        rawProgress.set(next);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [rawProgress, introState]);

  // Keyboard navigation & Tab trapping
  useEffect(() => {
    if (introState !== "on") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        const current = rawProgress.get();
        rawProgress.set(Math.min(1, current + 0.12));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const current = rawProgress.get();
        rawProgress.set(Math.max(0, current - 0.12));
      } else if (e.key === "End") {
        e.preventDefault();
        rawProgress.set(1);
      } else if (e.key === "Tab") {
        // Tab trapping: keep focus on skip button
        e.preventDefault();
        skipButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rawProgress, introState]);

  // Manage inert on background content while intro is active
  useEffect(() => {
    const headerEl = document.getElementById("site-header");
    const mainEl = document.getElementById("main-content");
    const footerEl = document.getElementById("site-footer");

    if (introState === "on" || introState === "exit") {
      headerEl?.setAttribute("inert", "");
      mainEl?.setAttribute("inert", "");
      footerEl?.setAttribute("inert", "");
    } else {
      headerEl?.removeAttribute("inert");
      mainEl?.removeAttribute("inert");
      footerEl?.removeAttribute("inert");
    }
  }, [introState]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.7, 1, 1.35]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.12, 0.85, 1], [0.25, 1, 1, 0]);
  const promptOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  if (introState === "off") {
    return null;
  }

  return (
    <div
      id="intro-layer"
      ref={containerRef}
      className={`${styles.introContainer} ${
        introState === "exit" ? styles.introExiting : ""
      }`}
      style={{
        perspective: stage.isMobile ? "900px" : "1200px",
        transformStyle: "preserve-3d",
      }}
      role="region"
      aria-label="3D Photo Tunnel Intro"
    >
      {/* Central Anchor Typography */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className={styles.titleWrapper}
      >
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.mainTitle}>{title}</h1>
      </motion.div>

      {/* Scroll Prompt Line */}
      <motion.div style={{ opacity: promptOpacity }} className={styles.scrollHint} />

      {/* Skip Button */}
      <button
        ref={skipButtonRef}
        type="button"
        className={styles.skipButton}
        onClick={completeIntro}
        aria-label={CONTENT.ui.skipIntro}
      >
        →
      </button>

      {/* 3D Z-Space Plane */}
      <div className={styles.plane3d} style={{ transformStyle: "preserve-3d" }}>
        {tunnelCards.map((card, i) => (
          <TunnelCard
            key={i}
            card={card}
            progress={smoothProgress}
            pointer={pointer}
            total={tunnelCards.length}
            stage={stage}
          />
        ))}
      </div>
    </div>
  );
}
