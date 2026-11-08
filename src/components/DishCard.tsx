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
  const { t, getDishName, getDishDescription } = useLanguage();
  const isVeg = dish.type === 'veg';
  const displayName = getDishName(dish);
  const displayDesc = getDishDescription(dish);

  return (
    <article
      className="dish-card flex flex-col justify-between"
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
      <div>
        <div className="relative">
          <img
            className="dish-img"
            src={dish.image}
            alt={displayName}
            loading="lazy"
          />
          {cartQuantity > 0 && (
            <span className="absolute top-2.5 right-2.5 bg-[#A90E02] text-[#FFFDF9] text-xs font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Check className="w-3 h-3" /> {cartQuantity}
            </span>
          )}
        </div>

        <div className="dish-body" id={`${idPrefix}-body-${dish.id}`}>
          <div className="dish-top" id={`${idPrefix}-top-${dish.id}`}>
            <div className="dish-name" id={`${idPrefix}-name-${dish.id}`}>
              {displayName}
            </div>
            <div className="dish-price" id={`${idPrefix}-price-${dish.id}`}>
              ฿{dish.priceTHB}
            </div>
          </div>

          {displayDesc && (
            <div className="dish-desc" id={`${idPrefix}-desc-${dish.id}`}>
              {displayDesc}
            </div>
          )}

          <div className="badges" id={`${idPrefix}-badges-${dish.id}`}>
            <span className={`badge ${isVeg ? 'green' : ''}`}>
              {isVeg ? t('veg') : t('nonVeg')}
            </span>
            {dish.chefSpecial && <span className="badge">{t('chefSpecial')}</span>}
            {dish.bestseller && <span className="badge">{t('bestseller')}</span>}
          </div>

          {dish.spiceLevel && <div className="spice">🌶 {dish.spiceLevel}</div>}

          {dish.ingredients?.length > 0 && (
            <div className="ingredients">
              {dish.ingredients.map((ingredient, index) => (
                <span
                  key={`${idPrefix}-ing-${dish.id}-${index}`}
                  className="ingredient"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {onAddToCart && (
        <div className="px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(dish, e);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              cartQuantity > 0
                ? 'bg-[#FDF3E3] border border-[#E5A33C]/60 text-[#A65B0A] hover:bg-[#FBE9CE]'
                : 'bg-[#FDF8F1] border border-[rgba(122,74,34,0.22)] text-[#A90E02] hover:bg-[#A90E02] hover:text-[#FFFDF9] hover:border-[#A90E02]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {cartQuantity > 0 ? `${t('addAnother')} (${cartQuantity} ${t('inTray')})` : t('addToOrder')}
          </button>
        </div>
      )}
    </article>
  );
}
