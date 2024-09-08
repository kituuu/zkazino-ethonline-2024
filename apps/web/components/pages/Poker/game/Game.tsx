import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Cards from './Cards';

import { Deck, getCards } from '@/games/pokerShowdown/utils/deck';
import RaiseModal from './RaiseModal';
import { IGameInfo } from '@/lib/stores/matchQueue';
import { Card, PokerCards } from 'zknoid-chain-dev';
import { PublicKey } from 'o1js';
import {
  getHand,
  getWinner,
  Hand,
} from '@/games/pokerShowdown/utils/gameFunctions';
import { useNetworkStore } from '@/lib/stores/network';
import { useRandzuMatchQueueStore } from '@/games/pokerShowdown/stores/matchQueue';
import { GameState } from '@/games/pokerShowdown/lib/gameState';
import ShimmerButton from '@/components/ui/ShimmerButton';
import { cn } from '@/lib/utils';

const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed';
interface IGameViewProps {
  gameInfo: IGameInfo<PokerCards> | undefined;
  setGameState: Dispatch<SetStateAction<GameState>>;
  handleCall: () => void;
  handleRaise: (amount: number) => void;
  handleFold: () => void;
  handleClaimFunds: (amount: PublicKey) => void;
}

const Game = ({
  gameInfo,
  setGameState,
  handleCall,
  handleRaise,
  handleFold,
  handleClaimFunds,
}: IGameViewProps) => {
  const currentUser = gameInfo?.currentUserIndex == 0 ? 'Player 1' : 'Player 2';
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
  const [winnerPk, setWinnerPk] = useState<undefined | PublicKey>(undefined);
  const [player1Chips, setPlayer1Chips] = useState(
    (gameInfo?.field.player1Chips.value.toString() as number) / 1000000000
  );
  const [player2Chips, setPlayer2Chips] = useState(
    (gameInfo?.field.player2Chips.value.toString() as number) / 1000000000
  );
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
    await handleRaise(amount * 1000000000);
  };

  const foldHandler = async () => {
    const res = await handleFold();
    const winner = getWinner(
      'Player 1',
      'Player 2',
      getHand(player1Deck, houseDeck) as Hand,
      getHand(player2Deck, houseDeck) as Hand
    );

    setWinner(winner);
    setWinnerPk(winner == 'Player 1' ? gameInfo?.player1 : gameInfo?.player2);
    setGameOver(true);
  };

  // const checkEnough = async (increment: number) => {
  //   const pid = gameInfo?.currentMoveUser.equals(gameInfo?.player1)
  //     ? gameInfo?.field.player1Chips
  //     : gameInfo?.field.player2Chips;
  //   return (pid?.value.toString() as number) > increment;
  // };

  const [restart, setRestart] = useState(false);
  useEffect(() => {
    setIncrement(Number(gameInfo?.field.increment.toBigInt()) / 1000000000);
    setPlayer1Chips(
      Number(gameInfo?.field.player1Chips.toBigInt()) / 1000000000
    );
    setPlayer2Chips(
      Number(gameInfo?.field.player2Chips.toBigInt()) / 1000000000
    );
    setPot(Number(gameInfo?.field.pot.toBigInt()) / 1000000000);
    setRaiseAmount(increment);
    setPlayer1Name(
      keyToPlayer[gameInfo?.player1?.toBase58() as string] || 'Player 1'
    );

    setPlayer2Name(
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
    if (numberOfTurns === 2) {
      setIncrement(Number(gameInfo?.field.increment.toBigInt()) / 1000000000);
    } else if (numberOfTurns === 4) {
      setHouseDeck(saarepatte.slice(0, 4));
      setIncrement(Number(gameInfo?.field.increment.toBigInt()) / 1000000000);
    } else if (numberOfTurns === 6) {
      setHouseDeck(saarepatte);
      setIncrement(Number(gameInfo?.field.increment.toBigInt()) / 1000000000);
    } else if (numberOfTurns === 8) {
      setGameOver(true);
      const winner = getWinner(
        'Player 1',
        'Player 2',
        getHand(player1Deck, houseDeck) as Hand,
        getHand(player2Deck, houseDeck) as Hand
      );
      setWinner(winner);
      setWinnerPk(winner == 'Player 1' ? gameInfo?.player1 : gameInfo?.player2);

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
      {gameOver &&
        !gameInfo?.winner &&
        winnerPk &&
        winnerPk?.toBase58() == address && (
          <button
            className="rounded-lg bg-green-500 p-3"
            onClick={() => {
              handleClaimFunds(winnerPk);
            }}
          >
            Claim Funds
          </button>
        )}
      <div className="game-board">
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
        <div className="game-controls flex flex-row items-center justify-center gap-5">
          {!gameOver && (
            <>
              <button
                disabled={
                  gameInfo?.currentMoveUser.toBase58() != address || gameOver
                }
                className={cn(
                  'group flex w-full cursor-pointer items-center justify-center lg:w-auto',
                  'gap-[10px] rounded px-2 py-3 text-header-menu lg:py-1',
                  ' transition duration-75 ease-in',
                  ' lg:justify-normal',
                  'bg-left-accent lg:bg-right-accent',
                  'bg-right-accent text-black hover:opacity-80',
                  'border border-bg-dark text-bg-dark hover:border-right-accent hover:bg-bg-dark hover:text-right-accent lg:text-black',
                  'p-4 text-2xl',
                  buttonDisabledStyle
                )}
                onClick={() => callHandler()}
              >
                {(raiseAmount / 1000000000 === 0 &&
                  increment &&
                  numberOfTurns < 2 &&
                  `Buy In(${increment})`) ||
                  (raiseAmount === 0 &&
                    increment &&
                    (gameInfo?.currentMoveUser.toBase58() ==
                    gameInfo?.player1.toBase58()
                      ? Number(gameInfo?.field.player1Chips.toBigInt())
                      : Number(gameInfo?.field.player2Chips.toBigInt())) /
                      1000000000 >
                      increment &&
                    `Call(${increment})`) ||
                  (raiseAmount > 0 && `Call(${raiseAmount})`) ||
                  'Check'}
              </button>
              <RaiseModal
                minRaise={
                  (raiseAmount > 0 ? raiseAmount : increment) > 0
                    ? (raiseAmount > 0 ? raiseAmount : increment) / 1000000000
                    : raiseAmount > 0
                      ? raiseAmount
                      : increment
                }
                maxRaise={
                  currentUser === 'Player 1' ? player1Chips : player2Chips
                }
                isDisabled={(turn !== currentUser || gameOver) as boolean}
                raiseHandler={(amount: number) => {
                  raiseHandler(amount);
                }}
              />

              <button
                disabled={currentUser !== turn || gameOver}
                className={cn(
                  'group flex w-full cursor-pointer items-center justify-center lg:w-auto',
                  'gap-[10px] rounded px-2 py-3 text-header-menu lg:py-1',
                  ' transition duration-75 ease-in',
                  ' lg:justify-normal',
                  'bg-left-accent lg:bg-middle-accent',
                  'bg-bg-dark text-foreground hover:opacity-80',
                  'border border-bg-dark text-bg-dark hover:border-middle-accent hover:bg-bg-dark hover:text-middle-accent lg:text-foreground',
                  'p-4 text-2xl disabled:opacity-50'
                )}
                onClick={() => foldHandler()}
              >
                Fold
              </button>
            </>
          )}

          {gameOver && (
            <ShimmerButton
              disabled={restart}
              onClick={() => {
                setRestart(true);
              }}
              className="shadow-2xl"
            >
              <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                Restart
              </span>
            </ShimmerButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
