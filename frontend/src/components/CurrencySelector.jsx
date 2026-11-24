import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { GooeyMenu } from './ui/gooey-menu';
import { ChevronDown } from 'lucide-react';

const CURRENCY_LIST = [
  { code: 'INR', label: '🇮🇳 INR (₹) - Indian Rupee' },
  { code: 'USD', label: '🇺🇸 USD ($) - US Dollar' },
  { code: 'EUR', label: '🇪🇺 EUR (€) - Euro' },
  { code: 'GBP', label: '🇬🇧 GBP (£) - British Pound' },
  { code: 'AED', label: '🇦🇪 AED (AED) - UAE Dirham' },
];

export const CurrencySelector = ({ compact = false, className = '' }) => {
  const { currency, setCurrency, currentMeta } = useCurrency();

  const options = CURRENCY_LIST.map((c) => c.label);
  const currentItem = CURRENCY_LIST.find((c) => c.code === currency) || CURRENCY_LIST[0];

  return (
    <div className={`relative inline-block ${className}`}>
      <GooeyMenu
        options={options}
        value={currentItem.label}
        onSelect={(opt) => {
          const matched = CURRENCY_LIST.find((c) => c.label === opt);
          if (matched) {
            setCurrency(matched.code);
          }
        }}
        align="end"
        width={230}
        surfaceClassName="bg-[#13152C]"
        triggerClassName="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 text-[#FAF6F0] text-xs font-sans transition-all duration-150 focus:outline-none"
        trigger={
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{currentMeta.flag}</span>
            <span className="font-semibold tracking-wider text-[#DFB76C] font-mono text-[11px]">
              {currentMeta.code}
            </span>
            <span className="text-[#FAF6F0]/60 text-[10px]">({currentMeta.symbol.trim()})</span>
            <ChevronDown className="w-3 h-3 text-[#DFB76C]/70 shrink-0 ml-0.5" />
          </div>
        }
      />
    </div>
  );
};

export default CurrencySelector;
