"use client";

import * as React from "react";
import { motion, useMotionValue, animate, useAnimationFrame } from "framer-motion";

type Variant = "rect" | "cylinder";

type FluidTankProps = {
  level: number; // 0..100 (target level)
  variant?: Variant;
  width?: number;
  height?: number;
  smoothMs?: number; // how long to smoothly move to new level
  capacityLiters?: number; // tank full capacity
  unit?: "L" | "KL";       // display unit
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FluidTank({
  level,
  variant = "rect",
  width = 220,
  height = 260,
  smoothMs = 1200,
  capacityLiters = 1000, // default 1000 L
  unit = "L",
}: FluidTankProps) {
  const pad = 12;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const isCylinder = variant === "cylinder";
  const outerRx = isCylinder ? 22 : 18;
  const innerRx = isCylinder ? 18 : 14;

  // Smooth animated "displayed level"
  const mvLevel = useMotionValue(clamp(level, 0, 100));

  React.useEffect(() => {
    const target = clamp(level, 0, 100);
    const controls = animate(mvLevel, target, {
      duration: smoothMs / 1000,
      ease: [0.22, 1, 0.36, 1], // smooth loader ease
    });
    return () => controls.stop();
  }, [level, mvLevel, smoothMs]);

  // Unique ids (client-only component)
  const uid = React.useId();
  const clipId = `clip-${uid}`;
  const liquidGradId = `liq-${uid}`;
  const glassId = `glass-${uid}`;
  const glossGradId = `gloss-${uid}`;

  // Wave params tuned for the clean "image-like" surface
  const waveAmp = 12;          // amplitude
  const waveLen = 140;         // long waves like your reference
  const speedPxPerSec = 40;    // calm movement (realistic)

  const [frontD, setFrontD] = React.useState<string>("");
  const [backD, setBackD] = React.useState<string>("");
  const [shownPct, setShownPct] = React.useState<number>(clamp(level, 0, 100));

  // === VOLUME CALCULATION (NEW) ===
  const litersNow = (shownPct / 100) * capacityLiters;
  const displayValue = unit === "KL" ? litersNow / 1000 : litersNow;
  const displayUnit = unit === "KL" ? "kL" : "L";


  // Clean smooth wave path (no spikes, no meniscus)
  const buildCleanWavePath = (topY: number, phase: number, amp: number) => {
    const startX = -innerW + phase;
    const endX = innerW * 2 + phase;

    let d = `M ${pad + startX} ${topY} `;

    for (let x = startX; x < endX; x += waveLen) {
      const x0 = pad + x;
      const xMid = x0 + waveLen / 2;
      const x1 = x0 + waveLen;

      // One smooth wave per waveLen (crest then trough)
      d += `C ${x0 + waveLen * 0.25} ${topY - amp}, ${x0 + waveLen * 0.25} ${topY - amp}, ${xMid} ${topY} `;
      d += `C ${x0 + waveLen * 0.75} ${topY + amp}, ${x0 + waveLen * 0.75} ${topY + amp}, ${x1} ${topY} `;
    }

    // Close to bottom
    d += `L ${pad + endX} ${pad + innerH} L ${pad + startX} ${pad + innerH} Z`;
    return d;
  };

  useAnimationFrame((t) => {
    const lvlNow = clamp(mvLevel.get(), 0, 100);
    setShownPct(lvlNow);

    // Convert level to topY
    const fillH = (lvlNow / 100) * innerH;
    const rawTopY = pad + (innerH - fillH);

    // Prevent weird top artifacts when near full
    const topMargin = 6;
    const topY = Math.max(pad + topMargin, rawTopY);

    // Horizontal movement phase
    const phase = -((t / 1000) * speedPxPerSec) % waveLen;

    // Back wave a bit lower + smaller amplitude
    setBackD(buildCleanWavePath(topY + 6, phase * 0.85, waveAmp * 0.55));
    // Front wave
    setFrontD(buildCleanWavePath(topY, phase, waveAmp));
  });

  return (
    <div className="relative select-none">
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id={glassId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>

          {/* KEEP YOUR COLORS — unchanged */}
          <linearGradient id={liquidGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(120, 245, 255, 0.90)" />
            <stop offset="55%" stopColor="rgba(0, 210, 255, 0.70)" />
            <stop offset="100%" stopColor="rgba(0, 120, 255, 0.62)" />
          </linearGradient>

          <linearGradient id={glossGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.00)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>

          <clipPath id={clipId}>
            <rect x={pad} y={pad} width={innerW} height={innerH} rx={innerRx} />
          </clipPath>
        </defs>

        {/* Outer glass */}
        <rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={outerRx}
          fill={`url(#${glassId})`}
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="2"
        />

        {/* Cylinder rims */}
        {isCylinder && (
          <>
            <ellipse
              cx={width / 2}
              cy={pad + 2}
              rx={innerW / 2}
              ry={10}
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.10)"
            />
            <ellipse
              cx={width / 2}
              cy={pad + innerH - 2}
              rx={innerW / 2}
              ry={10}
              fill="rgba(0,0,0,0.20)"
              opacity={0.25}
            />
          </>
        )}

        {/* Liquid */}
        <g clipPath={`url(#${clipId})`}>
          {/* BACK layer (depth) */}
          <motion.path d={backD} fill={`url(#${liquidGradId})`} opacity={0.55} />

          {/* FRONT layer */}
          <motion.path d={frontD} fill={`url(#${liquidGradId})`} opacity={0.95} />

          {/* OPTIONAL bubbles (remove if you want none) */}
          <motion.circle
            cx={pad + innerW * 0.72}
            cy={pad + innerH * 0.22}
            r="2.2"
            fill="rgba(255,255,255,0.55)"
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.65, 0.2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx={pad + innerW * 0.32}
            cy={pad + innerH * 0.35}
            r="1.6"
            fill="rgba(255,255,255,0.45)"
            animate={{ y: [0, -12, 0], opacity: [0.15, 0.55, 0.15] }}
            transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glass highlight */}
          <rect
            x={pad + innerW * 0.12}
            y={pad + 8}
            width={innerW * 0.10}
            height={innerH - 16}
            rx="14"
            fill={`url(#${glossGradId})`}
            opacity={0.55}
          />
        </g>
      </svg>

      {/* Volume badge */}
<div className="absolute inset-0 flex items-center justify-center">
  <div
    className="px-3 py-1 rounded-full text-xs font-semibold
               bg-white/10 text-white border border-white/10 backdrop-blur"
  >
    {displayValue.toFixed(unit === "KL" ? 2 : 0)} {displayUnit}
  </div>
</div>

    </div>
  );
}
