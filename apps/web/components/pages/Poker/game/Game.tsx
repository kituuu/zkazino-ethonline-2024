import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Cards from './Cards';

import { Deck, getCards } from '@/games/pokerShowdown/utils/deck';
import RaiseModal from './RaiseModal';
import { IGameInfo, MatchQueueState } from '@/lib/stores/matchQueue';
import { Card, PokerCards } from 'zknoid-chain-dev';
import { PublicKey, UInt64 } from 'o1js';
import {
  getHand,
  getWinner,
  Hand,
} from '@/games/pokerShowdown/utils/gameFunctions';
import { useNetworkStore } from '@/lib/stores/network';
import { useRandzuMatchQueueStore } from '@/games/pokerShowdown/stores/matchQueue';
import { GameState } from '@/games/pokerShowdown/lib/gameState';

// let socket;
// const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
const buttonBaseStyle =
  'font-bold py-2 px-4 rounded-lg transition-colors duration-200';
const buttonEnabledStyle = 'hover:brightness-110 active:brightness-90';
const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed';
interface IGameViewProps {
  gameInfo: IGameInfo<PokerCards> | undefined;
  setGameState: Dispatch<SetStateAction<GameState>>;
  handleCall: () => void;
  handleRaise: (amount: number) => void;
  handleFold: () => void;
  // loadingElement: { x: number; y: number } | undefined;
  // loading: boolean;
}

const Game = ({
  gameInfo,
  setGameState,
  handleCall,
  handleRaise,
  handleFold,
}: IGameViewProps) => {
  const currentUser = gameInfo?.currentUserIndex == 0 ? 'Player 1' : 'Player 2';
  // const currentUser = gameInfo?.currentMoveUser.equals(gameInfo?.player1) ? 'Player 1' : 'Player 2';
  const { address } = useNetworkStore();

  // Initialize game state

  const [gameOver, setGameOver] = useState<boolean | undefined>(false);
  const [turn, setTurn] = useState('Player 1');
  const [numberOfTurns, setNumberOfTurns] = useState<number>(
    Number(gameInfo?.field.numberOfTurns.value.value[1][1])
  );
  const player1Deck: Deck[] = getCards(
    gameInfo?.field.player1Cards as Card[]
  ) as Deck[];
  const player2Deck: Deck[] = getCards(
    gameInfo?.field.player2Cards as Card[]
  ) as Deck[];
  const saarepatte: Deck[] = getCards(
    gameInfo?.field.houseCards as Card[]
  ) as Deck[];
  const [houseDeck, setHouseDeck] = useState<Deck[]>(saarepatte.slice(0, 3));
  const [winner, setWinner] = useState<string>('');
  const [player1Chips, setPlayer1Chips] = useState(0);
  const [player2Chips, setPlayer2Chips] = useState(0);
  const [increment, setIncrement] = useState(10);
  const [pot, setPot] = useState(0);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  const keyToPlayer = {
    [gameInfo?.player1?.toBase58() as string]: 'Player 1',
    [gameInfo?.player2?.toBase58() as string]: 'Player 2',
  };
  const matchQueue = useRandzuMatchQueueStore();
  const [localHand, setLocalHand] = useState('N/A');

  const callHandler = async () => {
    await handleCall();
  };

  const raiseHandler = async (amount: number) => {
    // TODO: add logic for raise transaction
    // await superIncrement(gameInfo?.currentMoveUser as PublicKey, amount);
    await handleRaise(amount * 1000000000);
  };

  const foldHandler = async () => {
    // Handle fold action -> me surrender
    await handleFold();
  };
  const [restart, setRestart] = useState(false);

  useEffect(() => {
    setIncrement(
      (gameInfo?.field.increment.value.toString() as number) / 1000000000
    );
    setPlayer1Chips(
      (gameInfo?.field.player1Chips.value.toString() as number) / 1000000000
    );
    setPlayer2Chips(
      (gameInfo?.field.player2Chips.value.toString() as number) / 1000000000
    );
    setPot((gameInfo?.field.pot.value.toString() as number) / 1000000000);
    setRaiseAmount(gameInfo?.field.player1Bet.value.toString());
    setPlayer1Name(
      //matchInfo?.player1Name
      keyToPlayer[gameInfo?.player1?.toBase58() as string] || 'Player 1'
    );

    setPlayer2Name(
      //matchInfo?.player2Name
      keyToPlayer[gameInfo?.player2?.toBase58() as string] || 'Player 2'
    );

    setTurn(
      gameInfo?.currentMoveUser.equals(gameInfo?.player1).toBoolean()
        ? 'Player 1'
        : 'Player 2'
    );
  }, [gameInfo]);

  useEffect(() => {
    setNumberOfTurns(Number(gameInfo?.field.numberOfTurns.value.value[1][1]));
    // if (numberOfTurns === 0) {
    //   setGameOver(true);
    //   setWinner(
    //     getWinner(
    //       'Player 1',
    //       'Player 2',
    //       getHand(player1Deck, houseDeck) as Hand,
    //       getHand(player2Deck, houseDeck) as Hand
    //     )
    //   );
    // }
    console.log(Number(numberOfTurns));
    console.log(numberOfTurns === 4);
    if (numberOfTurns === 2) {
      setIncrement(gameInfo?.field.increment.value.toString() as number);
    } else if (numberOfTurns === 4) {
      setHouseDeck(saarepatte.slice(0, 4));
      setIncrement(gameInfo?.field.increment.value.toString() as number);
    } else if (numberOfTurns === 6) {
      setHouseDeck(saarepatte);
      setIncrement(gameInfo?.field.increment.value.toString() as number);
    } else if (numberOfTurns === 8) {
      setGameOver(true);
      const winner = getWinner(
        'Player 1',
        'Player 2',
        getHand(player1Deck, houseDeck) as Hand,
        getHand(player2Deck, houseDeck) as Hand
      );
      setWinner(winner);
      console.log(winner);
      console.log(currentUser);
      if (winner == 'Player 2') {
        if (address == gameInfo?.player2.toBase58()) {
          matchQueue.setLastGameState('win');
        } else {
          matchQueue.setLastGameState('lost');
        }
      } else if (winner == 'Player 1') {
        if (address == gameInfo?.player1.toBase58()) {
          matchQueue.setLastGameState('win');
        } else {
          matchQueue.setLastGameState('lost');
        }
      }
    }

    if (!gameOver && currentUser === 'Player 1')
      setLocalHand(getHand(player1Deck, houseDeck) as string);
    else if (!gameOver && currentUser === 'Player 2')
      setLocalHand(getHand(player2Deck, houseDeck) as string);
  }, [gameInfo?.field.numberOfTurns]);
  return (
    <div className="game-bg noselect">
      <div className="game-board">
        asdfasjkdfhgjkasjkdg {winner}
        <Cards
          numberOfTurns={numberOfTurns}
          player1Deck={player1Deck}
          player2Deck={player2Deck}
          houseDeck={houseDeck}
          gameOver={gameOver as boolean}
          currentUser={currentUser}
          player1Chips={player1Chips}
          player2Chips={player2Chips}
          turn={turn}
          player1Name={player1Name}
          player2Name={player2Name}
          winner={winner}
        />
        <div className="pot-display">
          <h3>Pot 💰: {pot}</h3>
        </div>
        <div className="game-controls">
          {!gameOver && (
            <>
              <button
                className={`${buttonBaseStyle} ${buttonDisabledStyle} ${buttonEnabledStyle} bg-purple-500 text-white`}
                disabled={gameInfo?.currentMoveUser.toBase58() != address}
                onClick={() => callHandler()}
              >
                {(raiseAmount / 1000000000 === 0 &&
                  increment &&
                  numberOfTurns < 2 &&
                  `Buy In(${increment / 1000000000})`) ||
                  (raiseAmount === 0 &&
                    increment &&
                    `Call(${increment / 1000000000})`) ||
                  (raiseAmount > 0 && `Call(${raiseAmount / 1000000000})`) ||
                  'Check'}
              </button>
              <RaiseModal
                minRaise={
                  (raiseAmount > 0 ? raiseAmount : increment) / 1000000000
                }
                maxRaise={
                  currentUser === 'Player 1' ? player1Chips : player2Chips
                }
                // initialValue={raiseAmount > 0 ? raiseAmount + increment : undefined}
                isDisabled={(turn !== currentUser || gameOver) as boolean}
                // callHandler={() => {
                //     callHandler();
                // }}
                raiseHandler={(amount: number) => {
                  raiseHandler(amount);
                }}
              />
              <button
                disabled={currentUser !== turn || gameOver}
                onClick={() => foldHandler()}
              >
                Fold
              </button>
            </>
          )}

          {gameOver && (
            <button
              disabled={restart}
              onClick={() => {
                setRestart(true);
              }}
            >
              Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
