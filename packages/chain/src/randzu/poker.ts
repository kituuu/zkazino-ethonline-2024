import { Struct, Provable, Bool } from 'o1js';
import { UInt64,  } from '@proto-kit/library';


export class Card extends Struct({
  suit: UInt64,  
  rank: UInt64,  
}) {
  static from(suit: number, rank: number): Card {
    return new Card({
      suit: UInt64.from(suit),
      rank: UInt64.from(rank),
    });
  }


  static randomCard(): Card {
    const suit = Math.floor(Math.random() * 4) + 1;
    const rank = Math.floor(Math.random() * 13) + 1;
    return Card.from(suit, rank);
  }

  equals(card: Card): Bool {
    return this.suit.equals(card.suit).and(this.rank.equals(card.rank));
  }
}


export class Deck extends Struct({
  cards: Provable.Array(Card, 52),
}) {
  constructor() {
    super({
      cards: Deck.initializeDeck(),  
    });
  }

  static initializeDeck(): Card[] {
    const cards: Card[] = [];
    for (let suit = 1; suit <= 4; suit++) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push(Card.from(suit, rank));
      }
    }
    return Deck.shuffleDeck(cards);
  }

  static shuffleDeck(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  dealCard(): Card {
    const [dealtCard, ...remainingCards] = this.cards;
    this.cards = remainingCards as any;
    return dealtCard;
  }
}









