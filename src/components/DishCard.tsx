import React from 'react';
import { Dish } from '../types';
import { Plus, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DishCardProps {
  dish: Dish;
  onClick: () => void;
  idPrefix: string;
  onAddToCart?: (dish: Dish, e: React.MouseEvent) => void;
  cartQuantity?: number;
  key?: React.Key;
}

export default function DishCard({ dish, onClick, idPrefix, onAddToCart, cartQuantity = 0 }: DishCardProps) {
  const { t, getDishName } = useLanguage();
  const isVeg = dish.type === 'veg';
  const displayName = getDishName(dish);

  return (
    <article
      className="dish-card group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FFF9EF] border border-[#E4D7BF] shadow-[0_4px_16px_rgba(48,37,30,0.06)] hover:shadow-[0_12px_28px_rgba(23,61,50,0.12)] hover:border-[#D9B66D] transition-all duration-200 cursor-pointer font-body"
      id={`${idPrefix}-${dish.id}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${displayName} - ฿${dish.priceTHB}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {/* 1. DISH IMAGE + VEG/NON-VEG BADGE */}
      <div className="relative w-full aspect-[4/3] bg-[#E4D7BF]/30 overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={dish.image}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* VEG / NON-VEG INDICATOR */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border backdrop-blur-md ${
              isVeg
                ? 'bg-[#FFF9EF]/95 text-[#386B4D] border-[#386B4D]/40'
                : 'bg-[#FFF9EF]/95 text-[#9B4935] border-[#9B4935]/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isVeg ? 'bg-[#386B4D]' : 'bg-[#9B4935]'
              }`}
            />
            {isVeg ? t('veg') : t('nonVeg')}
          </span>
        </div>

        {/* CART QUANTITY BADGE (IF IN TRAY) */}
        {cartQuantity > 0 && (
          <span className="absolute top-2.5 right-2.5 z-10 bg-[#173D32] text-[#FFF9EF] border border-[#D9B66D] text-[11px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <Check className="w-3 h-3 text-[#D9B66D]" /> {cartQuantity}
          </span>
        )}
      </div>

      {/* 2. COMPACT CONTENT: NAME + PRICE + QUICK ADD */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2" id={`${idPrefix}-body-${dish.id}`}>
        <div
          className="dish-name font-display font-bold text-[#30251E] text-[15px] sm:text-base leading-snug line-clamp-2 group-hover:text-[#173D32] transition-colors"
          id={`${idPrefix}-name-${dish.id}`}
        >
          {displayName}
        </div>

        <div className="flex items-center justify-between pt-1 mt-auto" id={`${idPrefix}-top-${dish.id}`}>
          <div
            className="dish-price font-display font-bold text-[#173D32] text-base sm:text-lg"
            id={`${idPrefix}-price-${dish.id}`}
          >
            ฿{dish.priceTHB}
          </div>

          {onAddToCart && (
            <button
              type="button"
              aria-label={`Add ${displayName} to order`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(dish, e);
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                cartQuantity > 0
                  ? 'bg-[#173D32] text-[#FFF9EF] hover:bg-[#102C25] border border-[#D9B66D]'
                  : 'bg-[#FFF9EF] text-[#173D32] border border-[#E4D7BF] hover:bg-[#173D32] hover:text-[#FFF9EF] hover:border-[#173D32]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{cartQuantity > 0 ? `${cartQuantity}` : t('addToOrder')}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
