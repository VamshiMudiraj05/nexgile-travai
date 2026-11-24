import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Spring physics configuration for the gliding selection pill & sliding months
 */
const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 460,
  damping: 38,
  mass: 0.7,
};

const SLIDE_VARIANTS = {
  enter: (d) => ({ x: d * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d * -24, opacity: 0 }),
};

/* ── Date Helpers (Dependency-Free) ── */
const startOfDay = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
};
const isSameDay = (a, b) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const EMPTY_RANGE = { from: null, to: null };

const toRange = (v) => {
  if (v === undefined) return undefined;
  if (v === null) return EMPTY_RANGE;
  if (v instanceof Date) return { from: v, to: null };
  return v;
};

function useControllableState(value, defaultValue, onChange) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const set = useCallback(
    (next) => {
      if (!controlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [controlled]
  );

  return [current, set];
}

/**
 * EasyUI Calendar
 * A dependency-free calendar with a selected-day pill that glides from date to date,
 * range support with a live hover preview band, and months that slide in the direction you navigate.
 */
export function Calendar({
  mode = "single",
  value,
  defaultValue,
  onChange,
  defaultMonth,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 0,
  locale = "en-US",
  className,
}) {
  const isRange = mode === "range";
  const uid = useId().replace(/:/g, "");

  const [selected, setSelected] = useControllableState(
    toRange(value),
    toRange(defaultValue) ?? EMPTY_RANGE,
    (next) => {
      if (mode === "range") onChange?.(next);
      else onChange?.(next.from);
    }
  );

  const { from, to } = selected || EMPTY_RANGE;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState(() => {
    const base = defaultMonth ?? from ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [dir, setDir] = useState(1);
  const [focus, setFocus] = useState(from ?? today);
  const [hover, setHover] = useState(null);
  const gridRef = useRef(null);
  const shouldFocus = useRef(false);

  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;
  const disabled = (d) => (!!min && d < min) || (!!max && d > max) || !!isDateDisabled?.(d);

  const y = view.getFullYear();
  const m = view.getMonth();
  const canPrev = !min || new Date(y, m, 0) >= min;
  const canNext = !max || new Date(y, m + 1, 1) <= max;

  const go = (target, direction) => {
    setDir(direction ?? (target > view ? 1 : -1));
    setView(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale]
  );
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    // 1 Aug 2021 is a Sunday
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2021, 7, 1 + ((weekStartsOn + i) % 7))));
  }, [locale, weekStartsOn]);

  const dim = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() - weekStartsOn + 7) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => {
    const n = i - offset + 1;
    return n < 1 || n > dim ? null : new Date(y, m, n);
  });
  const tabDate = isSameMonth(focus, view) ? focus : new Date(y, m, 1);

  const pick = (d) => {
    if (disabled(d)) return;
    setFocus(d);
    if (!isRange) {
      setSelected({ from: d, to: null });
    } else if (!from || to || d < from) {
      setSelected({ from: d, to: null });
    } else {
      setSelected({ from, to: d });
    }
  };

  const rangeEnd = isRange && from ? (to ?? (hover && hover > from ? hover : null)) : null;

  const onKeyDown = (e) => {
    const el = e.target.closest("[data-date]");
    if (!el) return;
    const [yy, mm, dd] = el.dataset.date.split("-").map(Number);
    const cur = new Date(yy, mm - 1, dd);
    const col = (cur.getDay() - weekStartsOn + 7) % 7;
    let next = null;
    if (e.key === "ArrowLeft") next = addDays(cur, -1);
    else if (e.key === "ArrowRight") next = addDays(cur, 1);
    else if (e.key === "ArrowUp") next = addDays(cur, -7);
    else if (e.key === "ArrowDown") next = addDays(cur, 7);
    else if (e.key === "Home") next = addDays(cur, -col);
    else if (e.key === "End") next = addDays(cur, 6 - col);
    else if (e.key === "PageUp") next = addMonths(cur, e.shiftKey ? -12 : -1);
    else if (e.key === "PageDown") next = addMonths(cur, e.shiftKey ? 12 : 1);
    if (!next) return;
    e.preventDefault();
    if (min && next < min) next = min;
    if (max && next > max) next = max;
    shouldFocus.current = true;
    setFocus(next);
    if (!isSameMonth(next, view)) go(next);
  };

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector(`[data-date="${dayKey(focus)}"]`)?.focus();
  }, [focus, view]);

  return (
    <div
      className={cn(
        "w-fit select-none p-3.5 bg-[#13152C] border border-[#2C315E] rounded-[4px] shadow-xl text-[#FAF6F0]",
        className
      )}
    >
      {/* Month & Navigation Header */}
      <div className="mb-2.5 flex h-8 items-center gap-1">
        <NavButton
          label="Previous month"
          disabled={!canPrev}
          onClick={() => go(addMonths(view, -1), -1)}
        >
          <ChevronLeft className="w-4 h-4 text-[#DFB76C]" />
        </NavButton>

        <div className="relative h-5 flex-1 overflow-hidden text-center text-xs font-bold font-cinzel tracking-[0.16em] uppercase text-[#DFB76C]">
          <AnimatePresence initial={false} custom={dir}>
            <motion.span
              key={y * 12 + m}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_TRANSITION}
              aria-live="polite"
              className="absolute inset-0 flex items-center justify-center truncate"
            >
              {monthFmt.format(view)}
            </motion.span>
          </AnimatePresence>
        </div>

        <NavButton
          label="Next month"
          disabled={!canNext}
          onClick={() => go(addMonths(view, 1), 1)}
        >
          <ChevronRight className="w-4 h-4 text-[#DFB76C]" />
        </NavButton>
      </div>

      {/* Weekday Row */}
      <div className="flex border-b border-[#2C315E]/60 pb-1 mb-1" aria-hidden>
        {weekdays.map((w, i) => (
          <div
            key={i}
            className="grid h-7 w-9 place-items-center font-cinzel text-[10px] font-semibold text-[#DFB76C]/60 uppercase tracking-wider"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid with Directional Slide and Gliding Pill */}
      <div className="-m-0.5 overflow-hidden p-0.5">
        <div
          ref={gridRef}
          role="grid"
          aria-label={monthFmt.format(view)}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHover(null)}
          className="relative h-[216px]"
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={y * 12 + m}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_TRANSITION}
              className="absolute inset-0"
            >
              {Array.from({ length: 6 }, (_, r) => (
                <div key={r} role="row" className="flex">
                  {cells.slice(r * 7, r * 7 + 7).map((d, col) => {
                    if (!d) {
                      return <div key={col} role="gridcell" className="h-9 w-9" />;
                    }

                    const isStart = isSameDay(d, from);
                    const isEnd = !isStart && isRange && isSameDay(d, to);
                    const picked = isStart || isEnd;
                    const inBand =
                      isRange &&
                      !!from &&
                      !!rangeEnd &&
                      !isSameDay(from, rangeEnd) &&
                      d >= from &&
                      d <= rangeEnd;
                    const off = disabled(d);
                    const isToday = isSameDay(d, today);

                    return (
                      <div
                        key={col}
                        role="gridcell"
                        aria-selected={picked || inBand}
                        className={cn(
                          "relative h-9 w-9",
                          inBand && "bg-[#DFB76C]/15 text-[#FAF6F0]",
                          inBand &&
                            (isSameDay(d, from) || col === 0 || d.getDate() === 1) &&
                            "rounded-l-[2px]",
                          inBand &&
                            (isSameDay(d, rangeEnd) || col === 6 || d.getDate() === dim) &&
                            "rounded-r-[2px]"
                        )}
                      >
                        <button
                          type="button"
                          data-date={dayKey(d)}
                          tabIndex={isSameDay(d, tabDate) ? 0 : -1}
                          aria-label={dayFmt.format(d)}
                          aria-disabled={off || undefined}
                          aria-current={isToday ? "date" : undefined}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          className={cn(
                            "group relative grid size-9 place-items-center rounded-[2px] text-xs font-sans tabular-nums outline-none transition-colors cursor-pointer",
                            picked
                              ? "text-[#13152C] font-bold z-10"
                              : "text-[#FAF6F0]/90",
                            !picked &&
                              !off &&
                              (inBand
                                ? "hover:bg-[#DFB76C]/25 text-white"
                                : "hover:bg-[#1B1E3D] hover:text-[#DFB76C]"),
                            off && "cursor-not-allowed opacity-25"
                          )}
                        >
                          {/* Gliding selection pill using spring physics */}
                          {picked && (
                            <motion.span
                              layoutId={isRange ? `${uid}-${isStart ? "start" : "end"}` : `${uid}-sel`}
                              transition={SPRING_TRANSITION}
                              className="absolute inset-0 rounded-[2px] bg-[#DFB76C] shadow-[0_2px_10px_rgba(223,183,108,0.4)]"
                            />
                          )}
                          <span className="relative z-10 transition-transform duration-150 group-active:scale-90">
                            {d.getDate()}
                          </span>
                          {/* Small indicator dot for Today */}
                          {isToday && !picked && (
                            <span className="absolute bottom-1 size-1 rounded-full bg-[#DFB76C]" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] text-[#DFB76C] outline-none transition-all hover:bg-[#24284F] hover:border-[#DFB76C]/40 active:scale-95 disabled:pointer-events-none disabled:opacity-25 cursor-pointer shadow-xs"
    >
      {children}
    </button>
  );
}

export default Calendar;
