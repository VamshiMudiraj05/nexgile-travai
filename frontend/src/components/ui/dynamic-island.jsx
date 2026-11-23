import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 420,
  damping: 28,
};

/**
 * Minimal EasyUI Dynamic Island User Indicator
 * - Displays only a small, sleek icon by default.
 * - On hover, smoothly expands with spring physics to show name, role badge, and a Sign Out button.
 */
export const DynamicIsland = ({
  avatar,
  avatarAlt = "User Avatar",
  name = "Eleanor Vance",
  role = "TRAVELER",
  onLogout,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const cleanName = typeof name === 'string' ? name.replace(/\s*\(.*?\)\s*/g, '').trim() || name : 'Eleanor Vance';

  // Close when clicking outside (especially useful on mobile or touch devices)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative inline-block z-40 select-none", className)}
    >
      <motion.div
        layout
        transition={SPRING_TRANSITION}
        className={cn(
          "bg-[#0D0E20]/95 backdrop-blur-md border border-[#DFB76C]/40 text-[#FAF6F0] shadow-xl overflow-hidden cursor-pointer",
          isHovered
            ? "rounded-full px-4 py-2 border-[#DFB76C]"
            : "rounded-full p-1.5 hover:border-[#DFB76C] hover:bg-[#13152C]"
        )}
      >
        <AnimatePresence mode="wait">
          {!isHovered ? (
            /* ==============================================================
               1. INITIAL STATE: COMPACT SMALL ICON ONLY
               ============================================================== */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1B1E3D] text-[#DFB76C]"
              title={`${cleanName} (${role})`}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={avatarAlt}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="font-cinzel text-xs font-bold tracking-wider">
                  {cleanName ? cleanName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </span>
              )}
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#0D0E20]" />
            </motion.div>
          ) : (
            /* ==============================================================
               2. HOVERED STATE: EXPANDED (NAME, ROLE, SIGN OUT)
               ============================================================== */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3.5 whitespace-nowrap"
            >
              {/* Avatar Icon */}
              <div className="relative flex-shrink-0 w-8 h-8 rounded-full bg-[#1B1E3D] border border-[#DFB76C]/60 flex items-center justify-center text-[#DFB76C]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={avatarAlt}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-cinzel text-xs font-bold">
                    {cleanName ? cleanName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#0D0E20]" />
              </div>

              {/* Name & Role Badge (Matching Institutional Security Badges) */}
              <div className="flex flex-col text-left">
                <span className="font-editorial text-xs font-bold text-white tracking-tight leading-tight">
                  {cleanName}
                </span>
                <span className="font-cinzel text-[8.5px] text-[#DFB76C] font-semibold tracking-[0.16em] uppercase px-2 py-0.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] mt-1 shadow-xs inline-block">
                  {role}
                </span>
              </div>

              {/* Subtle divider */}
              <div className="w-[1px] h-5 bg-[#2C315E]" />

              {/* Sign Out Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B1E3D] hover:bg-rose-950/60 border border-[#2C315E] hover:border-rose-500/40 text-white/80 hover:text-rose-300 font-cinzel text-[10px] uppercase font-bold transition-all cursor-pointer shadow-sm group"
                  title="Sign out of your session"
                >
                  <LogOut className="w-3 h-3 text-[#DFB76C] group-hover:text-rose-400 transition-colors" />
                  <span>Sign Out</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DynamicIsland;
