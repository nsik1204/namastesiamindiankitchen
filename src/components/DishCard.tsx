import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  onClick: () => void;
  idPrefix: string;
  key?: string;
}

export default function DishCard({ dish, onClick, idPrefix }: DishCardProps) {
  return (
    <article
      className="dish-card"
      id={`${idPrefix}-${dish.id}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${dish.name} - ฿${dish.priceTHB}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <img className="dish-img" src={dish.image} alt={dish.name} loading="lazy" />
      <div className="dish-body" id={`${idPrefix}-body-${dish.id}`}>
        <div className="dish-top" id={`${idPrefix}-top-${dish.id}`}>
          <div className="dish-name" id={`${idPrefix}-name-${dish.id}`}>{dish.name}</div>
          <div className="dish-price" id={`${idPrefix}-price-${dish.id}`}>฿{dish.priceTHB}</div>
        </div>
        <div className="dish-desc" id={`${idPrefix}-desc-${dish.id}`}>{dish.description}</div>
        <div className="badges" id={`${idPrefix}-badges-${dish.id}`}>
          <span className={`badge ${dish.type === 'veg' ? 'green' : ''}`}>
            {dish.type === 'veg' ? 'Veg' : 'Non-Veg'}
          </span>
          {dish.chefSpecial && <span className="badge">Chef Special</span>}
          {dish.bestseller && <span className="badge">Bestseller</span>}
        </div>
        <div className="spice">{dish.spiceLevel}</div>
        <div className="ingredients">
          {dish.ingredients.slice(0, 5).map((ing, index) => (
            <span key={`${idPrefix}-ing-${dish.id}-${index}`} className="ingredient">{ing}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
