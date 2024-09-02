import { Card as backendCard } from 'zknoid-chain-dev';

export type Suit = 'DIAMONDS' | 'CLUBS' | 'SPADES' | 'HEARTS' | 'BACK';
export type CardValue = number | 'J' | 'Q' | 'K' | 'A';

export interface Deck {
  value: CardValue;
  suit: Suit;
}

export const DECK_OF_CARDS: Deck[] = [
  {
    suit: 'HEARTS',
    value: 2,
  },
  {
    suit: 'HEARTS',
    value: 3,
  },
  {
    suit: 'HEARTS',
    value: 4,
  },
  {
    suit: 'HEARTS',
    value: 5,
  },
  {
    suit: 'HEARTS',
    value: 6,
  },
  {
    suit: 'HEARTS',
    value: 7,
  },
  {
    suit: 'HEARTS',
    value: 8,
  },
  {
    suit: 'HEARTS',
    value: 9,
  },
  {
    suit: 'HEARTS',
    value: 10,
  },
  {
    suit: 'HEARTS',
    value: 'J',
  },
  {
    suit: 'HEARTS',
    value: 'Q',
  },
  {
    suit: 'HEARTS',
    value: 'K',
  },
  {
    suit: 'HEARTS',
    value: 'A',
  },
  {
    suit: 'DIAMONDS',
    value: 2,
  },
  {
    suit: 'DIAMONDS',
    value: 3,
  },
  {
    suit: 'DIAMONDS',
    value: 4,
  },
  {
    suit: 'DIAMONDS',
    value: 5,
  },
  {
    suit: 'DIAMONDS',
    value: 6,
  },
  {
    suit: 'DIAMONDS',
    value: 7,
  },
  {
    suit: 'DIAMONDS',
    value: 8,
  },
  {
    suit: 'DIAMONDS',
    value: 9,
  },
  {
    suit: 'DIAMONDS',
    value: 10,
  },
  {
    suit: 'DIAMONDS',
    value: 'J',
  },
  {
    suit: 'DIAMONDS',
    value: 'Q',
  },
  {
    suit: 'DIAMONDS',
    value: 'K',
  },
  {
    suit: 'DIAMONDS',
    value: 'A',
  },
  {
    suit: 'CLUBS',
    value: 2,
  },
  {
    suit: 'CLUBS',
    value: 3,
  },
  {
    suit: 'CLUBS',
    value: 4,
  },
  {
    suit: 'CLUBS',
    value: 5,
  },
  {
    suit: 'CLUBS',
    value: 6,
  },
  {
    suit: 'CLUBS',
    value: 7,
  },
  {
    suit: 'CLUBS',
    value: 8,
  },
  {
    suit: 'CLUBS',
    value: 9,
  },
  {
    suit: 'CLUBS',
    value: 10,
  },
  {
    suit: 'CLUBS',
    value: 'J',
  },
  {
    suit: 'CLUBS',
    value: 'Q',
  },
  {
    suit: 'CLUBS',
    value: 'K',
  },
  {
    suit: 'CLUBS',
    value: 'A',
  },
  {
    suit: 'SPADES',
    value: 2,
  },
  {
    suit: 'SPADES',
    value: 3,
  },
  {
    suit: 'SPADES',
    value: 4,
  },
  {
    suit: 'SPADES',
    value: 5,
  },
  {
    suit: 'SPADES',
    value: 6,
  },
  {
    suit: 'SPADES',
    value: 7,
  },
  {
    suit: 'SPADES',
    value: 8,
  },
  {
    suit: 'SPADES',
    value: 9,
  },
  {
    suit: 'SPADES',
    value: 10,
  },
  {
    suit: 'SPADES',
    value: 'J',
  },
  {
    suit: 'SPADES',
    value: 'Q',
  },
  {
    suit: 'SPADES',
    value: 'K',
  },
  {
    suit: 'SPADES',
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
    1: 'HEARTS',
    2: 'DIAMONDS',
    3: 'CLUBS',
    4: 'SPADES',
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
