import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCY_CONFIG = {
  INR: {
    code: 'INR',
    symbol: '₹',
    rate: 1.0, // Base currency
    name: 'Indian Rupee',
    flag: '🇮🇳',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1 / 86, // ~₹86 per USD
    name: 'US Dollar',
    flag: '🇺🇸',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 1 / 92, // ~₹92 per EUR
    name: 'Euro',
    flag: '🇪🇺',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rate: 1 / 108, // ~₹108 per GBP
    name: 'British Pound',
    flag: '🇬🇧',
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    rate: 1 / 23.4, // ~₹23.4 per AED
    name: 'UAE Dirham',
    flag: '🇦🇪',
    decimals: 2,
  },
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('nexgile_selected_currency') || 'INR';
  });

  const setCurrency = (code) => {
    if (CURRENCY_CONFIG[code]) {
      setCurrencyState(code);
      localStorage.setItem('nexgile_selected_currency', code);
    }
  };

  const currentMeta = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;

  /**
   * Convert an INR amount to the currently selected currency (numeric)
   */
  const convertPrice = (amountInINR) => {
    if (amountInINR == null || isNaN(amountInINR)) return 0;
    const val = Number(amountInINR);
    const converted = val * currentMeta.rate;
    return currentMeta.decimals === 0 ? Math.round(converted) : Number(converted.toFixed(2));
  };

  /**
   * Format an INR amount with the active currency symbol and localization
   */
  const formatPrice = (amountInINR, showCode = false) => {
    if (amountInINR == null || isNaN(amountInINR)) return `${currentMeta.symbol}0`;
    const num = Number(amountInINR);
    const converted = num * currentMeta.rate;

    let formattedNumber;
    if (currentMeta.code === 'INR') {
      formattedNumber = Math.round(converted).toLocaleString('en-IN');
    } else {
      formattedNumber = converted.toLocaleString('en-US', {
        minimumFractionDigits: currentMeta.decimals,
        maximumFractionDigits: currentMeta.decimals,
      });
    }

    const result = `${currentMeta.symbol}${formattedNumber}`;
    return showCode ? `${result} ${currentMeta.code}` : result;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencies: CURRENCY_CONFIG,
        currentMeta,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
