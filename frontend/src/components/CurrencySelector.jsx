import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronDown, Globe } from 'lucide-react';

export const CurrencySelector = ({ compact = false, className = '' }) => {
  const { currency, setCurrency, currencies, currentMeta } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 text-[#FAF6F0] text-xs font-sans transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#DFB76C]/40"
        title="Change Display Currency"
      >
        <span className="text-sm leading-none">{currentMeta.flag}</span>
        <span className="font-semibold tracking-wider text-[#DFB76C] font-mono text-[11px]">
          {currentMeta.code}
        </span>
        <span className="text-[#FAF6F0]/60 text-[10px]">({currentMeta.symbol.trim()})</span>
        <ChevronDown className={`w-3 h-3 text-[#DFB76C]/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-[2px] bg-[#0E1024] border border-[#2C315E] shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-[100] py-1 divide-y divide-[#2C315E]/40 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[9px] font-cinzel font-bold tracking-[0.2em] text-[#DFB76C]/70 uppercase">
            Display Currency
          </div>
          <div className="py-0.5">
            {Object.values(currencies).map((curr) => {
              const isSelected = curr.code === currency;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    setCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-[#1B1E3D] text-[#DFB76C] font-semibold border-l-2 border-[#DFB76C]'
                      : 'text-[#FAF6F0]/80 hover:bg-[#13152C] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{curr.flag}</span>
                    <span className="font-mono text-[11px] font-medium">{curr.code}</span>
                    <span className="text-[#FAF6F0]/50 text-[10px] hidden sm:inline">{curr.name}</span>
                  </div>
                  <span className="font-mono text-xs text-[#DFB76C]">{curr.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
