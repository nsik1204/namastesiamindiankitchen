import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  onClick: () => void;
  idPrefix: string;
  key?: string;
}

export default function DishCard({ dish, onClick, idPrefix }: DishCardProps) {
  const isVeg = dish.type === 'veg';

  return (
    <>
      <style>{`
        .dish-card {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border: 1px solid rgba(122, 74, 34, 0.18);
          border-radius: 22px;
          background: #fffdf9;
          color: #2b1a0e;
          box-shadow: 0 10px 30px rgba(61, 31, 0, 0.08);
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          outline: none;
        }

        .dish-card:hover {
          transform: translateY(-5px);
          border-color: rgba(224, 138, 43, 0.6);
          box-shadow: 0 18px 36px rgba(61, 31, 0, 0.15);
        }

        .dish-card:focus-visible {
          box-shadow: 0 0 0 4px rgba(224, 138, 43, 0.35), 0 18px 36px rgba(61, 31, 0, 0.15);
        }

        .dish-img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          background: #eadfce;
        }

        .dish-body {
          display: flex;
          flex-direction: column;
          gap: 11px;
          padding: 18px;
        }

        .dish-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .dish-name {
          color: #2b1a0e;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.12rem, 2vw, 1.38rem);
          font-weight: 800;
          line-height: 1.15;
        }

        .dish-price {
          flex: none;
          color: #a90e02;
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1.2;
          white-space: nowrap;
        }

        .dish-desc {
          min-height: 1.35em;
          color: #8c7358;
          font-size: 0.93rem;
          line-height: 1.5;
        }

        .badges,
        .ingredients {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .badge,
        .ingredient,
        .spice {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1;
        }

        .badge {
          padding: 7px 9px;
          background: rgba(224, 138, 43, 0.13);
          color: #8b4b13;
        }

        .badge.green {
          background: rgba(74, 122, 68, 0.13);
          color: #386334;
        }

        .spice {
          padding: 7px 9px;
          background: rgba(169, 14, 2, 0.08);
          color: #a90e02;
        }

        .ingredient {
          padding: 6px 8px;
          border: 1px solid rgba(122, 74, 34, 0.15);
          color: #735b43;
          font-size: 0.72rem;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .dish-body {
            padding: 15px;
          }

          .dish-name {
            font-size: 1.16rem;
          }
        }
      `}</style>

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
    </>
  );
}