import React from 'react';
import { Sparkles } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No records present',
  description = 'Your items and operational updates will appear here.',
  action = null,
}) => {
  return (
    <div className="relative overflow-hidden bg-[#13152C] border border-[#2C315E] rounded-[4px] p-10 md:p-14 text-center max-w-lg mx-auto my-8 shadow-xl">
      <div className="absolute inset-0 bg-radial-vignette opacity-20 pointer-events-none" />
      <div className="w-14 h-14 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 flex items-center justify-center mx-auto mb-5 text-[#DFB76C] shadow-inner relative z-10">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="font-editorial text-2xl font-normal text-white mb-2 relative z-10">{title}</h3>
      <p className="text-xs text-white/60 mb-6 leading-relaxed max-w-sm mx-auto font-sans relative z-10">
        {description}
      </p>
      {action && <div className="inline-flex relative z-10">{action}</div>}
    </div>
  );
};

export default EmptyState;
