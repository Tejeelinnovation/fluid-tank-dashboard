"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";

export default function BackgroundFX() {
  const reduce = useReducedMotion();

  // Scroll parallax
  const { scrollYProgress } = useScroll();
  const py1 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-10, 80]);
  const py2 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-20, 120]);
  const py3 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 160]);

  // Mouse parallax (normalized -1..+1)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Smooth it (GPU-friendly)
  const smx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const smy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  // Convert mouse (-1..1) into small px offsets.
  // Keep tiny so blobs stay centered.
  const mouseX = useTransform(smx, [-1, 1], reduce ? [0, 0] : [-18, 18]);
  const mouseY = useTransform(smy, [-1, 1], reduce ? [0, 0] : [-12, 12]);

  // Hue cycling (filter) - stays cheap and looks great
  const hueAnim = reduce
    ? undefined
    : {
        filter: [
          "hue-rotate(0deg)",
          "hue-rotate(120deg)",
          "hue-rotate(240deg)",
          "hue-rotate(360deg)",
        ],
      };

  const hueTransition = reduce
    ? undefined
    : { duration: 22, repeat: Infinity, ease: "linear" };

  // rAF-throttled pointer handler
  React.useEffect(() => {
    if (reduce) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      // throttle to animation frame
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;

        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;

        // normalize to -1..+1 (center = 0)
        const nx = (e.clientX / w) * 2 - 1;
        const ny = (e.clientY / h) * 2 - 1;

        // clamp to avoid wild edges
        mx.set(Math.max(-1, Math.min(1, nx)));
        my.set(Math.max(-1, Math.min(1, ny)));
      });
    };

    const onLeave = () => {
      // gently return to center
      mx.set(0);
      my.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [mx, my, reduce]);

  // Combine scroll + mouse for each blob group (motion template for performance)
  const y1 = useMotionTemplate`calc(${py1}px + ${mouseY}px)`;
  const y2 = useMotionTemplate`calc(${py2}px + ${mouseY}px)`;
  const y3 = useMotionTemplate`calc(${py3}px + ${mouseY}px)`;

  const xS = mouseX; // shared subtle X

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-[#070A12]" />

      {/* BLOB GROUP 1 (cyan) */}
      <motion.div
        className="absolute left-[57%] top-[-300px] -translate-x-1/2 will-change-transform"
        style={{ x: xS, y: y1 }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, 22, -18, 0],
                y: [0, -28, 18, 0],
                scale: [1, 1.07, 0.99, 1],
                rotate: [0, 2, -2, 0],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 22, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.div
          className="h-[780px] w-[780px] rounded-full blur-[300px] opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(110,220,255,0.95), transparent 62%)",
            willChange: "transform, filter",
          }}
          animate={hueAnim}
          transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "linear" }}

        />
      </motion.div>

      {/* BLOB GROUP 2 (pink) */}
      <motion.div
        className="absolute left-[25%] top-[-150px] -translate-x-1/2 will-change-transform"
        style={{ x: xS, y: y2 }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, -16, 14, 0],
                y: [0, -20, 12, 0],
                scale: [1, 1.5, 0.97, 1],
                rotate: [0, -1.5, 1.5, 0],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 26, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.div
          className="h-[740px] w-[740px] rounded-full blur-[1200px] opacity-58"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,115,180,0.92), transparent 60%)",
            willChange: "transform, filter",
          }}
          animate={hueAnim}
          transition={reduce ? undefined : { duration: 26, repeat: Infinity, ease: "linear" }}

        />
      </motion.div>

      {/* BLOB GROUP 3 (warm accent) */}
      <motion.div
        className="absolute left-[50%] top-[-120px] -translate-x-1/2 will-change-transform"
        style={{ x: xS, y: y3 }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, 12, -10, 0],
                y: [0, -14, 8, 0],
                scale: [1, 1.03, 0.99, 1],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 30, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.div
          className="h-[980px] w-[980px] rounded-full blur-[340px] opacity-62"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,170,90,0.78), transparent 65%)",
            willChange: "transform, filter",
          }}
          animate={hueAnim}
          transition={reduce ? undefined : { duration: 12, repeat: Infinity, ease: "linear" }}

        />
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,0,0,0.0),rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />

      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27 opacity=%270.45%27/%3E%3C/svg%3E")',
          backgroundRepeat: "repeat",
          backgroundSize: "240px 240px",
        }}
      />

      {/* Super subtle drifting grain (optional) */}
      {!reduce && (
        <motion.div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay will-change-transform"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.75%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27 opacity=%270.45%27/%3E%3C/svg%3E")',
            backgroundRepeat: "repeat",
            backgroundSize: "260px 260px",
          }}
          animate={{ x: [0, 16, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
