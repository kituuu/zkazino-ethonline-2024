import React, { useState, useEffect } from 'react';
import Card from './Card'; // Assuming Card component is defined elsewhere
import { Deck } from '@/games/pokerShowdown/utils/deck';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';
type Suit = 'DIAMONDS' | 'CLUBS' | 'SPADES' | 'HEARTS' | 'BACK';
type CardValue = number | 'J' | 'Q' | 'K' | 'A';
import CoinImg from '@/components/widgets/Header/assets/coin.svg';

const Coin = () => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 26C20.1797 26 26 20.1797 26 13C26 5.8203 20.1797 0 13 0C5.8203 0 0 5.8203 0 13C0 20.1797 5.8203 26 13 26Z"
        fill="#F9F8F4"
      />
      <path
        d="M23.7604 20.2973C25.0267 18.2915 25.7593 15.915 25.7593 13.3675C25.7593 6.18784 19.939 0.367531 12.7593 0.367531C8.28477 0.367531 4.33782 2.62849 1.99902 6.07028C4.30171 2.42265 8.36782 0 13.0001 0C20.1798 0 26.0001 5.82031 26.0001 13C26.0001 15.7051 25.1739 18.2169 23.7604 20.2973Z"
        fill="white"
      />
      <path
        d="M20.5842 5.41698C20.8021 5.63489 21.0095 5.86042 21.2058 6.09306C19.2748 4.46168 16.8545 3.57282 14.297 3.57282C11.4321 3.57282 8.73849 4.68838 6.71245 6.71441C4.68642 8.74044 3.57087 11.434 3.57087 14.299C3.57087 16.8564 4.45976 19.2768 6.0911 21.2078C5.85847 21.0114 5.63289 20.804 5.41502 20.5861C3.38899 18.5601 2.27316 15.8668 2.27344 13.0016C2.27316 10.1363 3.38899 7.44301 5.41502 5.41698C7.44106 3.39094 10.1343 2.27511 12.9996 2.27539C15.8649 2.27511 18.5581 3.39094 20.5842 5.41698Z"
        fill="#EFEFEF"
      />
      <path
        d="M20.5681 20.5842C20.3502 20.8021 20.1247 21.0095 19.892 21.2058C21.5234 19.2748 22.4123 16.8545 22.4123 14.297C22.4123 11.4321 21.2967 8.73849 19.2707 6.71246C17.2447 4.68646 14.5511 3.57087 11.6861 3.57087C9.12869 3.57087 6.70833 4.45976 4.77734 6.0911C4.97367 5.85847 5.18107 5.63289 5.39898 5.41502C7.42501 3.38899 10.1183 2.27316 12.9836 2.27344C15.8488 2.27316 18.5421 3.38899 20.5681 5.41502C22.5942 7.44106 23.71 10.1343 23.7097 12.9996C23.71 15.8649 22.5942 18.5581 20.5681 20.5842Z"
        fill="#E2E2E2"
      />
      <path
        d="M23.7263 13.0001C23.7263 13.1229 23.7243 13.2457 23.7203 13.3677C23.6292 10.6401 22.5242 8.08902 20.5847 6.14985C18.5588 4.12402 15.8653 3.00819 13.0001 3.00819C10.1349 3.00819 7.44143 4.12402 5.41559 6.14985C3.47603 8.08902 2.37103 10.6401 2.27995 13.3677C2.27593 13.2457 2.27393 13.1229 2.27393 13.0001C2.27393 10.1349 3.38936 7.44143 5.41559 5.41559C7.44143 3.38936 10.1349 2.27393 13.0001 2.27393C15.8653 2.27393 18.5588 3.38936 20.5847 5.41559C22.6109 7.44143 23.7263 10.1349 23.7263 13.0001Z"
        fill="#848483"
      />
      <path
        d="M23.1281 16.4006C22.6133 17.9963 21.7238 19.458 20.5036 20.6778C18.4778 22.704 15.7843 23.8194 12.9191 23.8194C10.0539 23.8194 7.36037 22.704 5.33454 20.6778C3.30831 18.6519 2.19287 15.9584 2.19287 13.0932C2.19287 11.8434 2.40513 10.626 2.81238 9.48291C2.46892 10.5414 2.29077 11.6588 2.29077 12.8035C2.29077 15.6687 3.40661 18.3622 5.43244 20.3881C7.45827 22.4143 10.1522 23.5297 13.0174 23.5297C15.8826 23.5297 18.5761 22.4143 20.6019 20.3881C21.7474 19.2425 22.6021 17.8836 23.1281 16.4006Z"
        fill="white"
      />
      <path
        d="M19.9044 13.0143L18.2661 15.0908L16.2831 19.5473L16.8579 17.6859C17.2049 16.5664 17.5522 15.4471 17.8992 14.3276L16.7473 11.9625L16.1584 11.7933L15.9455 14.3276L15.6342 15.4637L15.1326 16.4962L15.2709 14.8538V13.4915L15.0919 11.9782L14.6075 11.6279L13.8718 11.4761H12.1279L11.3925 11.6279L10.9078 11.9782L10.7292 13.4915V14.8538L10.8674 16.4962L10.3656 15.4637L10.0543 14.3276L9.84139 11.7933L9.25246 11.9625L8.10083 14.3276C8.44782 15.4471 8.79485 16.5664 9.14184 17.6859C9.33347 18.3064 9.52506 18.9268 9.71697 19.5473L7.73366 15.0908L6.0957 13.0143L6.14189 10.7147L6.91081 9.93798L7.64904 8.64593L7.71625 7.93755L8.18738 8.35367L8.36047 9.1356C8.65301 9.17789 8.94555 9.21993 9.23805 9.26222C9.57898 9.60315 9.92015 9.94404 10.2611 10.2853C10.1212 9.89401 9.98126 9.50248 9.84135 9.11124L9.2795 8.4728L7.7441 7.63943L8.43643 6.86938L8.95791 6.61279H9.53525L10.2356 7.06181C10.4936 6.99766 10.7518 6.93354 11.0098 6.86938C11.6645 6.86774 12.319 6.86633 12.9737 6.86469H13.0263C13.681 6.86633 14.3355 6.86774 14.99 6.86938C15.2482 6.93354 15.5062 6.99766 15.7644 7.06181L16.4648 6.61279H17.0421L17.5636 6.86938L18.2557 7.63943L16.7206 8.4728L16.1584 9.11124C16.0188 9.50248 15.8789 9.89401 15.739 10.2853C16.0799 9.94404 16.4208 9.60315 16.762 9.26222C17.0545 9.21993 17.3471 9.17789 17.6396 9.1356L17.8124 8.35367L18.2838 7.93755L18.3507 8.64593L19.0892 9.93798L19.8582 10.7147L19.9044 13.0143Z"
        fill="#252525"
      />
      <path
        d="M15.6252 19.672V20.4047L14.6074 20.94L13.0261 21.2571L12.9998 21.2624L12.9735 21.2571L11.3923 20.94L10.3745 20.4047V19.672L10.729 19.479V17.9668L11.0096 19.0557L11.5726 19.6183L11.7003 20.1616L12.9735 20.082L12.9998 20.0803L13.0261 20.082L14.2994 20.1616L14.4271 19.6183L14.9898 19.0557L15.2707 17.9668V19.479L15.6252 19.672Z"
        fill="#252525"
      />
      <path
        d="M13.5534 14.8714L13.0001 17.1083V17.109L12.9998 17.1083L12.4468 14.8714L13.0001 14.0425L13.5534 14.8714Z"
        fill="#252525"
      />
    </svg>
  );
};

interface CardsProps {
  numberOfTurns: number;
  player1Deck: Deck[];
  player2Deck: Deck[];
  houseDeck: Deck[];
  gameOver: boolean;
  currentUser: 'Player 1' | 'Player 2' | string;
  player1Chips: number;
  player2Chips: number;
  turn: 'Player 1' | 'Player 2' | string;
  winner: string | null;
  player1Name: string;
  player2Name: string;
}

export default function Cards({
  numberOfTurns,
  player1Deck,
  player2Deck,
  houseDeck,
  gameOver,
  currentUser,
  player1Chips,
  player2Chips,
  turn,
  winner,
  player1Name,
  player2Name,
}: CardsProps) {
  const [p1Heading, setP1Heading] = useState<string>('');
  const [p2Heading, setP2Heading] = useState<string>('');
  const [houseHeading, setHouseHeading] = useState<string>('');
  useEffect(() => {
    if (numberOfTurns < 2) setHouseHeading('Buy In to reveal cards');
    else if (numberOfTurns >= 2 && numberOfTurns < 4) setHouseHeading('Flop');
    else if (numberOfTurns >= 4 && numberOfTurns < 6) setHouseHeading('Turn');
    else if (numberOfTurns >= 6 && numberOfTurns < 8) setHouseHeading('River');
    else if (numberOfTurns >= 8) setHouseHeading('Game Over!');
  }, [numberOfTurns]);

  useEffect(() => {
    if (currentUser === 'Player 1' && winner === player1Name)
      setP1Heading(`👑 ${player1Name} (You)`);
    else if (currentUser === 'Player 1') setP1Heading(`${player1Name} (You)`);
    else if (winner === player1Name) setP1Heading(`👑 ${player1Name}`);
    else setP1Heading(player1Name);
    if (currentUser === 'Player 2' && winner === player2Name)
      setP2Heading(`👑 ${player2Name} (You)`);
    else if (currentUser === 'Player 2') setP2Heading(`${player2Name} (You)`);
    else if (winner === player2Name) setP2Heading(`👑 ${player2Name}`);
    else setP2Heading(player2Name);
  }, [winner, player1Name, player2Name, currentUser]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <h2
        style={{
          margin: '0.5rem 0',
          fontFamily: 'inherit',
          fontSize: '1.5rem',
          color: winner === 'Player 2' ? '#FFD700' : 'inherit',
        }}
      >
        {p2Heading}
      </h2>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {player2Deck &&
            player2Deck.map((item, index) => {
              if ((currentUser === 'Player 2' || gameOver === true) && item)
                return (
                  <Card
                    key={index}
                    className="h-60"
                    value={item.value as CardValue}
                    suit={item.suit as Suit}
                  />
                );
              else
                return (
                  <Card key={index} className="h-52" suit="BACK" value={1} />
                );
            })}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3 className="flex gap-2 text-xl font-bold capitalize text-orange-300">
            Chips: <Coin /> {player2Chips}
          </h3>
          {currentUser === 'Player 1' &&
            turn === 'Player 2' &&
            gameOver === false && <p>Loading</p>}
        </div>
      </div>

      <h2
        style={{
          margin: '0.5rem 0',
          fontFamily: 'inherit',
          fontSize: '1.5rem',
        }}
      >
        {houseHeading}
      </h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {houseDeck &&
          houseDeck.map((item, index) => {
            if (item)
              return (
                <Card
                  key={index}
                  value={item.value as CardValue}
                  suit={(numberOfTurns >= 2 ? item.suit : 'BACK') as Suit}
                  className="h-56"
                />
              );
          })}
      </div>

      <h2
        style={{
          margin: '0.5rem 0',
          fontFamily: 'inherit',
          fontSize: '1.5rem',
          color: winner === 'Player 1' ? '#FFD700' : 'inherit',
        }}
      >
        {p1Heading}
      </h2>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3 className="flex gap-2 text-xl font-bold capitalize text-orange-300">
            Chips: <Coin /> {player1Chips}
          </h3>
          {currentUser === 'Player 2' &&
            turn === 'Player 1' &&
            gameOver === false && <p>Loading</p>}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {player1Deck &&
            player1Deck.map((item, index) => {
              if ((currentUser === 'Player 1' || gameOver === true) && item)
                return (
                  <Card
                    key={index}
                    className="h-60"
                    value={item.value as CardValue}
                    suit={item.suit as Suit}
                  />
                );
              else
                return (
                  <Card key={index} className="h-52" suit="BACK" value={1} />
                );
            })}
        </div>
      </div>
    </div>
  );
}
