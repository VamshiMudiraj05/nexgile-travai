import React from "react";
import { cn } from "@/lib/utils";

/**
 * EasyUI Rainbow Button Component
 * A vibrant button featuring an animated chromatic rainbow gradient border,
 * dynamic surface reflections, and an ambient blurred rainbow underglow.
 */
export const RainbowButton = React.forwardRef(
  (
    {
      children,
      variant = "default", // 'default' | 'outline'
      size = "default", // 'default' | 'sm' | 'lg' | 'icon'
      asChild = false,
      glow = true,
      speed = 3,
      color1 = "hsl(0 100% 63%)",
      color2 = "hsl(270 100% 63%)",
      color3 = "hsl(210 100% 63%)",
      color4 = "hsl(195 100% 63%)",
      color5 = "hsl(90 100% 63%)",
      className,
      style,
      onClick,
      ...props
    },
    ref
  ) => {
    // Generate inline gradient with customizable color stops
    const rainbowGradient = `linear-gradient(90deg, ${color1}, ${color2}, ${color3}, ${color4}, ${color5}, ${color1})`;

    const sizeClasses = {
      sm: "h-8 px-3 text-xs gap-1.5",
      default: "h-11 px-5 text-xs gap-2",
      lg: "h-13 px-7 text-sm gap-2.5",
      icon: "h-11 w-11 p-0 justify-center",
    };

    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative inline-flex items-center justify-center font-cinzel font-bold uppercase tracking-wider transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          sizeClasses[size] || sizeClasses.default,
          className
        )}
        style={{
          ...style,
        }}
        {...props}
      >
        <style>{`
          @keyframes easyui-rainbow-spin {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .easyui-rainbow-layer {
            background-size: 200% 200%;
            animation: easyui-rainbow-spin ${speed}s ease infinite;
          }
        `}</style>

        {/* Ambient Blurred Rainbow Glow (Drop-shadow) */}
        {glow && (
          <span
            className="easyui-rainbow-layer absolute -inset-0.5 rounded-full opacity-65 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 pointer-events-none"
            style={{
              backgroundImage: rainbowGradient,
            }}
            aria-hidden="true"
          />
        )}

        {/* Outer Rainbow Border Layer */}
        <span
          className="easyui-rainbow-layer absolute inset-0 rounded-full p-[1.5px] transition-all duration-300"
          style={{
            backgroundImage: rainbowGradient,
          }}
          aria-hidden="true"
        >
          {/* Inner Surface */}
          <span
            className={cn(
              "w-full h-full rounded-full flex items-center justify-center transition-colors duration-300",
              variant === "outline"
                ? "bg-[#0B0C1E]/90 group-hover:bg-[#13152C]"
                : "bg-[#0D0E20] group-hover:bg-[#151733]"
            )}
          >
            {/* Top 3D Reflection Highlight */}
            <span
              className="absolute inset-x-2 top-0 h-[45%] rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </span>
        </span>

        {/* Foreground Content */}
        <span className="relative z-10 flex items-center gap-2 text-white group-hover:text-[#FAF6F0] drop-shadow-sm">
          {children}
        </span>
      </Comp>
    );
  }
);

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
