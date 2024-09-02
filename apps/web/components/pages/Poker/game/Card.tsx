import { CardValue, Suit } from '@/games/pokerShowdown/utils/deck';
import React from 'react';
function Card({
  value,
  suit,
  className,
}: {
  value: CardValue;
  suit: Suit;
  className: string;
}) {
  return (
    <>
      {suit !== 'BACK' && (
        <img
          className={className}
          alt={suit + '-' + value}
          src={`/cards/${suit}/${suit}_${value}.svg`}
        />
      )}
      {suit === 'BACK' && (
        <img
          className={className}
          alt={suit + '-' + value}
          src={`/cards/${suit}.svg`}
        />
      )}
    </>
  );
}

export default Card;
