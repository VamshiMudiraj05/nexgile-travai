import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Curating details...', text }) => {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-[#13152C]/70">
      <div className="relative mb-3 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border border-[#DFB76C]/30 animate-pulse"></div>
        <Loader2 className="w-6 h-6 animate-spin text-[#B88E43] absolute" />
      </div>
      <span className="font-cinzel text-[11px] font-semibold text-[#13152C]/80 tracking-[0.2em] uppercase">
        {text || message}
      </span>
      <span className="text-[10px] text-[#13152C]/40 mt-1 tracking-wider uppercase font-sans">
        Nexgile-TravAI Intelligence
      </span>
    </div>
  );
};

export default LoadingSpinner;
