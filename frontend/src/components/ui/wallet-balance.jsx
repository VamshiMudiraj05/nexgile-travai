import React, {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*  Wallet Balance — cards tucked in a pouch, tap the eye to reveal / hide      */
/*  Deps: react 19, framer-motion, tailwindcss.                                */
/*                                                                             */
/*  <WalletBalance />                                                          */
/*  <WalletBalance accounts={myAccounts} visible={v} onVisibleChange={setV} /> */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Design space ------------------------------- */
// Authored on a 340×400 stage, then scaled to the container width.

const STAGE_W = 340;
const STAGE_H = 400;
const CARD_W = 266;
const CARD_H = 130;
const CARD_LEFT = (STAGE_W - CARD_W) / 2;
const HIDE_SCALE = 0.89;
const MAX_CARDS = 3;
const POCKET_TOP = 179;

const visibleTop = (i) => 13 + i * 49.5; // fanned out
const hiddenTop = (i) => 75 + i * 35; // tucked into the pouch

const EASE_OUT = [0.23, 1, 0.32, 1];
const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, "SF Mono", "Space Mono", Menlo, Consolas, monospace)';
const MASK = "******";

/* ------------------------------ Brand marks ----------------------------- */

export function StripeMark() {
  return (
    <span className="text-[22px] font-bold lowercase leading-none tracking-[-0.045em] text-white">
      stripe
    </span>
  );
}

export function WiseMark() {
  return (
    <span className="flex items-center gap-[3px] text-[#163300]">
      <svg viewBox="0 0 17 16" className="h-[14px] w-[15px]" aria-hidden="true">
        <path fill="currentColor" d="M12.2 0 5 8.4h4.6L6.7 15.6 17 4.2h-5.1L14.4 0z" />
      </svg>
      <span className="text-[21px] font-extrabold italic uppercase leading-none tracking-[-0.04em]">
        wise
      </span>
    </span>
  );
}

export function RazorpayMark() {
  return (
    <span className="flex items-center gap-[5px] text-white">
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
        <path d="M22.436 0l-11.91 7.773-3.714 6.643 4.417-2.88 2.213-3.957 4.298-2.805-4.484 8.016-5.748 3.75-7.508 4.9L3.58 15.65l6.574-4.288 3.714-6.643L0 13.568l3.153 10.432h6.14l13.143-8.577L24 0h-1.564z" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight text-[#528FF0]">
        Razorpay
      </span>
    </span>
  );
}

export function NexgileMark() {
  return (
    <span className="flex items-center gap-[4px] text-[#DFB76C]">
      <span className="text-[12px] tracking-[0.2em] font-serif uppercase font-bold">
        NEXGILE
      </span>
    </span>
  );
}

export const DEFAULT_ACCOUNTS = [
  { id: "nexgile", name: "Nexgile Reserve", balance: 125000, logo: <NexgileMark />, background: "#1c2237", amountColor: "#DFB76C" },
  { id: "razorpay", name: "Razorpay Credits", balance: 45000, logo: <RazorpayMark />, background: "#0c2340", amountColor: "#528FF0" },
  { id: "wise", name: "Wise", balance: 345865, logo: <WiseMark />, background: "#a0d67b", amountColor: "#4f7a3b" },
];

/* ------------------------------- Small parts -------------------------------- */

// Crossfades between a real value and its mask.
function Swap({
  show,
  value,
  mask = MASK,
  className = "",
  maskClassName = "",
}) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={show ? "value" : "mask"}
          className={`whitespace-nowrap ${show ? className : maskClassName || className}`}
          initial={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }}
          transition={{ duration: reduce ? 0 : 0.18, ease: EASE_OUT }}
        >
          {show ? value : mask}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function EyeIcon({ open }) {
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.28, ease: EASE_OUT };
  return (
    <motion.svg
      viewBox="0 0 34 24"
      className="h-[22px] w-[31px] overflow-visible"
      initial={false}
      animate={{ color: open ? "#a4d37e" : "#44593a" }}
      transition={t}
      aria-hidden="true"
    >
      <path d="M1.5 12C5.5 5 10.5 1.5 17 1.5S28.5 5 32.5 12c-4 7-9 10.5-15.5 10.5S5.5 19 1.5 12Z" fill="currentColor" />
      <circle cx="17" cy="12" r="6.6" fill="#243420" />
      <circle cx="17" cy="12" r="3.6" fill="currentColor" />
      {/* slash draws in when hidden: dark underlay cuts the eye, light stroke on top */}
      <motion.path
        d="M5 22.5 29 1.5"
        stroke="#243420"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={{ pathLength: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={t}
      />
      <motion.path
        d="M5 22.5 29 1.5"
        stroke="#9aa890"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={{ pathLength: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={t}
      />
    </motion.svg>
  );
}

/* -------------------------------- Component --------------------------------- */

export function WalletBalance({
  accounts = DEFAULT_ACCOUNTS,
  visible,
  defaultVisible = true,
  onVisibleChange,
  currency = "USD",
  locale = "en-US",
  totalLabel = "Total Balance",
  className = "",
  style,
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();

  const [inner, setInner] = useState(defaultVisible);
  const isVisible = visible ?? inner;
  const toggle = () => {
    const next = !isVisible;
    if (visible === undefined) setInner(next);
    onVisibleChange?.(next);
  };

  const list = accounts.slice(0, MAX_CARDS);
  const total = useMemo(() => list.reduce((s, a) => s + (Number(a.balance) || 0), 0), [list]);
  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );
  const plain = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);

  // Scale the fixed stage to whatever width we're given (mobile friendly)
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(null);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / STAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spring = (delay) =>
    reduce ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.16, delay };

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label="Wallet balances"
      className={`relative mx-auto w-full max-w-[400px] select-none ${className}`}
      style={{
        aspectRatio: `${STAGE_W} / ${STAGE_H}`,
        fontFamily: "var(--font-sans, 'Geist', sans-serif)",
        ...style,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale ?? 1})`,
          opacity: scale === null ? 0 : 1,
        }}
      >
        {/* Back of the pouch */}
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          width={STAGE_W}
          height={STAGE_H}
          className="absolute inset-0"
          style={{ filter: "drop-shadow(0 22px 26px rgba(31,48,22,0.26))" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-back`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35472b" />
              <stop offset="100%" stopColor="#2b3a22" />
            </linearGradient>
          </defs>
          <path
            d="M20 112C20 102 28 96 38 96H302C312 96 320 102 320 112V316A66 66 0 0 1 254 382H86A66 66 0 0 1 20 316Z"
            fill={`url(#${uid}-back)`}
          />
        </svg>

        {/* Cards */}
        {list.map((a, i) => {
          const n = list.length;
          const delay = (isVisible ? i : n - 1 - i) * 0.03;
          return (
            <motion.div
              key={a.id || i}
              className="absolute overflow-hidden rounded-[18px] will-change-transform"
              style={{
                left: CARD_LEFT,
                top: 0,
                width: CARD_W,
                height: CARD_H,
                zIndex: i + 1,
                transformOrigin: "50% 0%",
                background: `linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 45%), ${a.background}`,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.65), 0 -1px 0 rgba(0,0,0,0.04), 0 6px 14px rgba(0,0,0,0.10)",
              }}
              initial={false}
              animate={{
                y: isVisible ? visibleTop(i) : hiddenTop(i),
                scale: isVisible ? 1 : HIDE_SCALE,
              }}
              transition={spring(delay)}
            >
              <div className="flex h-[40px] items-center justify-between px-[16px]">
                <span aria-label={a.name} className="flex items-center">
                  {a.logo}
                </span>
                <span
                  className="text-[15px] font-medium tabular-nums tracking-[0.05em]"
                  style={{ fontFamily: MONO, color: a.amountColor ?? "rgba(0,0,0,0.45)" }}
                >
                  <Swap show={isVisible} value={money.format(a.balance)} />
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Front pocket */}
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          width={STAGE_W}
          height={STAGE_H}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 10 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-front`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#273921" />
              <stop offset="100%" stopColor="#202e1a" />
            </linearGradient>
          </defs>
          <path
            d={`M30 198C30 188 41 ${POCKET_TOP} 54 ${POCKET_TOP}L286 ${POCKET_TOP}C299 ${POCKET_TOP + 1} 310 188 310 198V322A56 56 0 0 1 254 378H86A56 56 0 0 1 30 322Z`}
            fill={`url(#${uid}-front)`}
            stroke="rgba(255,255,255,0.05)"
          />
          <path
            d="M38 199C38 192 46 187 56 187L284 187C294 187 302 192 302 199V322A48 48 0 0 1 254 370H86A48 48 0 0 1 38 322Z"
            fill="none"
            stroke="rgba(170,196,146,0.55)"
            strokeWidth={1}
            strokeDasharray="4 3.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Total + toggle (above the pocket) */}
        <div className="absolute inset-x-0 text-center" style={{ top: 191, zIndex: 11 }}>
          <div className="flex h-[36px] items-center justify-center">
            <Swap
              show={isVisible}
              value={currency === 'INR' ? `₹${plain.format(total)}` : plain.format(total)}
              className="text-[28px] font-medium tabular-nums tracking-[0.1em] text-[#e0e6d8]"
              maskClassName="text-[26px] font-medium tracking-[0.34em] text-[#a2aa98]"
            />
          </div>
          <p className="mt-[2px] text-[15px] tracking-[0.01em] text-[#8c9b83]">{totalLabel}</p>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-pressed={isVisible}
          aria-label={isVisible ? "Hide balances" : "Show balances"}
          className="absolute flex h-[56px] w-[56px] items-center justify-center rounded-full outline-none transition-transform duration-150 ease-out [-webkit-tap-highlight-color:transparent] active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-[#a4d37e]/70 cursor-pointer"
          style={{ left: STAGE_W / 2 - 28, top: 306, zIndex: 12 }}
        >
          <EyeIcon open={isVisible} />
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {isVisible ? `Total balance ${plain.format(total)}` : "Balances hidden"}
      </span>
    </div>
  );
}

export function WalletBalanceDemo() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#eef2d9] via-[#f3f4ee] to-[#f1f1f1] p-6">
      <WalletBalance className="max-w-[360px]" />
    </div>
  );
}

export default WalletBalance;
