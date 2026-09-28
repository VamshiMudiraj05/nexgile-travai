import React from 'react';
import { Sparkles } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No records present',
  description = 'Your items and operational updates will appear here.',
  action = null,
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 rounded-[4px] p-10 md:p-12 text-center max-w-lg mx-auto my-8 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
      <div className="w-12 h-12 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 flex items-center justify-center mx-auto mb-4 text-[#B88E43]">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="font-editorial text-xl font-normal text-[#13152C] mb-1.5">{title}</h3>
      <p className="text-xs text-[#13152C]/60 mb-6 leading-relaxed max-w-sm mx-auto font-sans">
        {description}
      </p>
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
};

export default EmptyState;
