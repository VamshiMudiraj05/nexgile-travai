import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-3 border-t border-[#DFB76C]/25 text-xs text-[#13152C]/70 bg-[#FAF6F0]">
      <div className="font-sans">
        Showing{' '}
        <span className="font-semibold text-[#13152C]">
          {total > 0 ? (page - 1) * limit + 1 : 0}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-[#13152C]">
          {Math.min(page * limit, total)}
        </span>{' '}
        of <span className="font-semibold text-[#13152C]">{total}</span> entries
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] border border-[#13152C]/15 bg-[#FFFFFF] text-[#13152C] hover:bg-[#F4EFE6] hover:border-[#DFB76C] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-sans text-xs cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 rounded-[2px] bg-[#13152C] text-[#DFB76C] font-semibold text-xs border border-[#2C315E]">
          {page} / {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] border border-[#13152C]/15 bg-[#FFFFFF] text-[#13152C] hover:bg-[#F4EFE6] hover:border-[#DFB76C] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-sans text-xs cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
