import { UInt64 } from '@proto-kit/library';
import { Card as backendCard } from 'zknoid-chain-dev';

export type Suit = 'diamonds' | 'clubs' | 'spades' | 'hearts';
export type CardValue = number | 'J' | 'Q' | 'K' | 'A';

export interface Deck {
  value: CardValue;
  suit: Suit;
}

export const DECK_OF_CARDS: Deck[] = [
  {
    suit: 'hearts',
    value: 2,
  },
  {
    suit: 'hearts',
    value: 3,
  },
  {
    suit: 'hearts',
    value: 4,
  },
  {
    suit: 'hearts',
    value: 5,
  },
  {
    suit: 'hearts',
    value: 6,
  },
  {
    suit: 'hearts',
    value: 7,
  },
  {
    suit: 'hearts',
    value: 8,
  },
  {
    suit: 'hearts',
    value: 9,
  },
  {
    suit: 'hearts',
    value: 10,
  },
  {
    suit: 'hearts',
    value: 'J',
  },
  {
    suit: 'hearts',
    value: 'Q',
  },
  {
    suit: 'hearts',
    value: 'K',
  },
  {
    suit: 'hearts',
    value: 'A',
  },
  {
    suit: 'diamonds',
    value: 2,
  },
  {
    suit: 'diamonds',
    value: 3,
  },
  {
    suit: 'diamonds',
    value: 4,
  },
  {
    suit: 'diamonds',
    value: 5,
  },
  {
    suit: 'diamonds',
    value: 6,
  },
  {
    suit: 'diamonds',
    value: 7,
  },
  {
    suit: 'diamonds',
    value: 8,
  },
  {
    suit: 'diamonds',
    value: 9,
  },
  {
    suit: 'diamonds',
    value: 10,
  },
  {
    suit: 'diamonds',
    value: 'J',
  },
  {
    suit: 'diamonds',
    value: 'Q',
  },
  {
    suit: 'diamonds',
    value: 'K',
  },
  {
    suit: 'diamonds',
    value: 'A',
  },
  {
    suit: 'clubs',
    value: 2,
  },
  {
    suit: 'clubs',
    value: 3,
  },
  {
    suit: 'clubs',
    value: 4,
  },
  {
    suit: 'clubs',
    value: 5,
  },
  {
    suit: 'clubs',
    value: 6,
  },
  {
    suit: 'clubs',
    value: 7,
  },
  {
    suit: 'clubs',
    value: 8,
  },
  {
    suit: 'clubs',
    value: 9,
  },
  {
    suit: 'clubs',
    value: 10,
  },
  {
    suit: 'clubs',
    value: 'J',
  },
  {
    suit: 'clubs',
    value: 'Q',
  },
  {
    suit: 'clubs',
    value: 'K',
  },
  {
    suit: 'clubs',
    value: 'A',
  },
  {
    suit: 'spades',
    value: 2,
  },
  {
    suit: 'spades',
    value: 3,
  },
  {
    suit: 'spades',
    value: 4,
  },
  {
    suit: 'spades',
    value: 5,
  },
  {
    suit: 'spades',
    value: 6,
  },
  {
    suit: 'spades',
    value: 7,
  },
  {
    suit: 'spades',
    value: 8,
  },
  {
    suit: 'spades',
    value: 9,
  },
  {
    suit: 'spades',
    value: 10,
  },
  {
    suit: 'spades',
    value: 'J',
  },
  {
    suit: 'spades',
    value: 'Q',
  },
  {
    suit: 'spades',
    value: 'K',
  },
  {
    suit: 'spades',
    value: 'A',
  },
];

export const cardToDeck = (card: backendCard): Deck | null => {
  if (!card) {
    return null;
  }
  const [suitNum, valueNum] = [card.suit?.toString(), card.rank?.toString()];
  const suitnumTosuit: {
    [key: string]: Suit;
  } = {
    1: 'hearts',
    2: 'diamonds',
    3: 'clubs',
    4: 'spades',
  };
  const valuenumToValue: {
    [key: string]: CardValue;
  } = {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 8,
    8: 9,
    9: 10,
    10: 'J',
    11: 'Q',
    12: 'K',
    13: 'A',
  };

  return {
    suit: suitnumTosuit[suitNum],
    value: valuenumToValue[valueNum],
  };
};

export const getCards = (cards: backendCard[]): (Deck | null)[] => {
  return cards?.map(cardToDeck);
};
