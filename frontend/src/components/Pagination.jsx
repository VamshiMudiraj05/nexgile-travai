import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  if (totalPages <= 1 && total === 0) return null;

  const start = total > 0 ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, total);

  // Generate responsive page number pills
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (page <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 sm:px-6 border-t border-[#2C315E] text-xs font-sans text-white/60 bg-[#13152C]">
      {/* Entry counter */}
      <div className="flex items-center gap-1.5 font-sans text-xs text-white/65">
        <span>Showing</span>
        <span className="font-semibold text-[#DFB76C]">{start}</span>
        <span>to</span>
        <span className="font-semibold text-[#DFB76C]">{end}</span>
        <span>of</span>
        <span className="font-semibold text-white">{total}</span>
        <span>entries</span>
      </div>

      {/* Controls & Page Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] text-white/80 hover:text-white hover:bg-[#24284F] hover:border-[#DFB76C]/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#1B1E3D] disabled:hover:border-[#2C315E] transition-all font-sans text-xs cursor-pointer shadow-sm select-none"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#DFB76C]" />
          <span>Previous</span>
        </button>

        {/* Number Pills */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-white/40 font-mono text-xs select-none">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-[2px] font-cinzel text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none ${
                  isCurrent
                    ? 'bg-[#DFB76C] text-[#13152C] border border-[#DFB76C] shadow-sm'
                    : 'bg-[#1B1E3D] text-white/70 hover:text-white hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/40'
                }`}
                title={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Compact Page Indicator on Mobile */}
        <span className="sm:hidden px-2.5 py-1.5 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] font-cinzel text-xs font-bold border border-[#2C315E]">
          {page} / {totalPages || 1}
        </span>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] text-white/80 hover:text-white hover:bg-[#24284F] hover:border-[#DFB76C]/60 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#1B1E3D] disabled:hover:border-[#2C315E] transition-all font-sans text-xs cursor-pointer shadow-sm select-none"
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#DFB76C]" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
