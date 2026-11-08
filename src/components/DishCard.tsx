import React from 'react';
import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  onClick: () => void;
  idPrefix: string;
  key?: React.Key;
}

export default function DishCard({ dish, onClick, idPrefix }: DishCardProps) {
  const isVeg = dish.type === 'veg';

  return (
    <article
      className="dish-card"
        id={`${idPrefix}-${dish.id}`}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`${dish.name} - ฿${dish.priceTHB}`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <img
          className="dish-img"
          src={dish.image}
          alt={dish.name}
          loading="lazy"
        />

        <div className="dish-body" id={`${idPrefix}-body-${dish.id}`}>
          <div className="dish-top" id={`${idPrefix}-top-${dish.id}`}>
            <div className="dish-name" id={`${idPrefix}-name-${dish.id}`}>
              {dish.name}
            </div>
            <div className="dish-price" id={`${idPrefix}-price-${dish.id}`}>
              ฿{dish.priceTHB}
            </div>
          </div>

          {dish.description && (
            <div className="dish-desc" id={`${idPrefix}-desc-${dish.id}`}>
              {dish.description}
            </div>
          )}

          <div className="badges" id={`${idPrefix}-badges-${dish.id}`}>
            <span className={`badge ${isVeg ? 'green' : ''}`}>
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            {dish.chefSpecial && <span className="badge">Chef Special</span>}
            {dish.bestseller && <span className="badge">Bestseller</span>}
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
      </article>
  );
}