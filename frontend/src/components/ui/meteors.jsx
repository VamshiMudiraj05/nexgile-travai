import React, { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Generate randomized meteor trail positions & timings.
 */
const generateMeteorStyles = (count, minD, maxD, minDur, maxDur) => {
  return Array.from({ length: count }).map(() => ({
    top: `${Math.floor(Math.random() * 40) - 20}%`,
    left: `${Math.floor(Math.random() * 120) - 10}%`,
    animationDelay: `${(Math.random() * (maxD - minD) + minD).toFixed(2)}s`,
    animationDuration: `${Math.floor(Math.random() * (maxDur - minDur) + minDur)}s`,
  }));
};

/**
 * EasyUI Meteors Component
 * Animated meteor shower effect that streams diagonal glowing celestial light beams.
 */
export const Meteors = ({
  number = 20,
  color = "#94A3B8",
  trailColor = "#64748B",
  tailLength = 60,
  angle = 215,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 8,
  className,
  children,
  style,
  ...props
}) => {
  const [meteorStyles] = useState(() =>
    generateMeteorStyles(number, minDelay, maxDelay, minDuration, maxDuration)
  );

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={style}
      aria-hidden="true"
      {...props}
    >
      <style>{`
        @keyframes easyui-meteor-streak {
          0% {
            transform: rotate(${angle}deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(${angle}deg) translateX(-600px);
            opacity: 0;
          }
        }
        .easyui-meteor-item {
          animation-name: easyui-meteor-streak;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .easyui-meteor-item {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>

      {meteorStyles.map((itemStyle, idx) => (
        <span
          key={`meteor-${idx}`}
          className="easyui-meteor-item absolute h-0.5 w-0.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.12), 0 0 8px 1px ${color}`,
            top: itemStyle.top,
            left: itemStyle.left,
            animationDelay: itemStyle.animationDelay,
            animationDuration: itemStyle.animationDuration,
          }}
        >
          {/* Luminous tail pseudo-element */}
          <span
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 block"
            style={{
              width: `${tailLength}px`,
              height: "1px",
              background: `linear-gradient(to right, ${trailColor}, transparent)`,
            }}
          />
        </span>
      ))}

      {children && (
        <div className="pointer-events-auto relative z-10 h-full w-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default Meteors;
