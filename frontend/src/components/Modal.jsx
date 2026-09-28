import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0E20]/65 backdrop-blur-[4px] transition-all duration-300">
      <div
        className={`w-full ${maxWidth} bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[4px] shadow-[0_20px_50px_rgba(13,14,32,0.3)] overflow-hidden flex flex-col max-h-[92vh] text-[#13152C]`}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#DFB76C]/30 flex items-center justify-between">
          <div>
            <span className="font-cinzel text-[10px] tracking-[0.24em] uppercase text-[#B88E43] font-bold block mb-0.5">
              Nexgile Concierge
            </span>
            <h3 className="font-editorial text-xl font-normal text-[#13152C] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#13152C]/60 mt-0.5 font-sans">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#13152C] hover:bg-[#F4EFE6] transition-colors border border-transparent hover:border-[#13152C]/10 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Hairline gold accent */}
        <div className="h-[1px] bg-gradient-to-r from-[#DFB76C] via-[#F2D59B] to-transparent"></div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FAF6F0]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
