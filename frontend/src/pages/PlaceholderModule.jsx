import React from 'react';
import { Clock, ShieldAlert, Sparkles } from 'lucide-react';

export const PlaceholderModule = ({ title, description, phase = 'Future Phase' }) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DFB76C]/20">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#B88E43] uppercase">
            Platform Expansion
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">{title}</h1>
          <p className="mt-1 font-sans text-xs text-[#13152C]/70">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 text-[#B88E43] font-cinzel text-[10px] tracking-wider uppercase font-bold self-start">
          <Clock className="w-3.5 h-3.5" />
          {phase}
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#2C315E]/15 rounded-[4px] p-16 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 flex items-center justify-center mx-auto mb-6 text-[#B88E43]">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[#13152C] mb-2">{title} Module</h2>
        <p className="font-sans text-xs text-[#13152C]/70 mb-6 leading-relaxed">
          This operational module is scheduled for forthcoming architecture updates.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[2px] bg-[#FAF6F0] border border-[#2C315E]/15 text-[#13152C] font-cinzel text-[10px] tracking-wider uppercase font-bold">
          <ShieldAlert className="w-4 h-4 text-[#B88E43]" />
          Reserved Module Feature
        </div>
      </div>
    </div>
  );
};
