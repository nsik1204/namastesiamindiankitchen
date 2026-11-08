import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartPillProps {
  totalCount: number;
  totalTHB: number;
  onClick: () => void;
}

export default function FloatingCartPill({ totalCount, totalTHB, onClick }: FloatingCartPillProps) {
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[calc(100%-2rem)] md:w-auto animate-in slide-in-from-bottom-5 duration-300">
      <button
        type="button"
        onClick={onClick}
        className="w-full md:w-auto bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] py-3.5 px-6 rounded-full shadow-[0_12px_32px_rgba(169,14,2,0.35)] flex items-center justify-between md:justify-start gap-4 transition-all duration-200 hover:scale-[1.02] border border-[#FFFDF9]/20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
            {totalCount}
          </div>
          <span className="font-bold text-sm tracking-wide">
            {totalCount === 1 ? 'Dish in Tray' : 'Dishes in Tray'}
          </span>
        </div>

        <div className="h-4 w-px bg-white/20 hidden md:block"></div>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-[#FFF4DC]">฿{totalTHB} THB</span>
          <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
        </div>
      </button>
    </div>
  );
}
