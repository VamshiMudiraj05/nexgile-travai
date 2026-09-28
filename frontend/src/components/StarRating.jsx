import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 5, maxStars = 5, size = 16, interactive = false, onRatingChange }) {
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= Math.round(rating);
    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onRatingChange && onRatingChange(i)}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform focus:outline-none`}
      >
        <Star
          size={size}
          className={`${
            isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
          }`}
        />
      </button>
    );
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}
