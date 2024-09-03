import React, { useEffect, useState } from 'react';
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

// let socket;
// const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

interface IGameViewProps {
  gameInfo: IGameInfo<PokerCards> | undefined;
  matchInfo: MatchQueueState;
  superIncrement: (from: PublicKey, amount?: number) => Promise<void>;
  handleCall: () => void;
  handleRaise: (amount: number) => void;
  handleFold: () => void;
  // loadingElement: { x: number; y: number } | undefined;
  // loading: boolean;
}

const Game = ({ gameInfo, matchInfo, superIncrement, handleCall, handleRaise, handleFold }: IGameViewProps) => {
  const currentUser = gameInfo?.currentUserIndex == 0 ? 'Player 1' : 'Player 2';
  // Initialize game state
  const [gameOver, setGameOver] = useState<boolean | undefined>(false);
  const [turn, setTurn] = useState('');
  const [numberOfTurns, setNumberOfTurns] = useState(0);
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
  const [winner, setWinner] = useState('');
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
  }

  const [localHand, setLocalHand] = useState('N/A');

  const callHandler = async () => {
    await handleCall();
  };

  const raiseHandler = async (amount: number) => {
    // TODO: add logic for raise transaction
    // await superIncrement(gameInfo?.currentMoveUser as PublicKey, amount);
    await handleRaise(amount*1000000000);
  };

  const foldHandler = async () => {
    // Handle fold action -> me surrender
    await handleFold();
  };
  const [restart, setRestart] = useState(false);

  useEffect(() => {
    setIncrement((gameInfo?.field.increment.value.toString() as number)/1000000000);
    setPlayer1Chips((gameInfo?.field.player1Chips.value.toString() as number)/1000000000)
    setPlayer2Chips((gameInfo?.field.player2Chips.value.toString() as number)/1000000000);
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
    console.log('deep', player1Chips);
    console.log('azwesrdctfvyguinmoxdrcftvugybj',gameInfo?.field)
    setTurn(
      currentUser
    );
  }, [gameInfo]);


  

  useEffect(() => {
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
    if (numberOfTurns === 2) {
      setIncrement(0);
      // socket.emit('updateGameState', { increment: 0 });
      // playShufflingSound();
    } else if (numberOfTurns === 4) {
      // socket.emit('updateGameState', {
      setHouseDeck(saarepatte.slice(0, 4));

      setIncrement(0);
    } else if (numberOfTurns === 6) {
      console.log(
        'madfhajk sdjkfhjkahsjdhf jkdhsjahsdkjf hjkashdfjk hajksdh jkfahskj'
      );
      setHouseDeck(saarepatte);
      setIncrement(0);
    } else if (numberOfTurns === 8) {
      setGameOver(true);
      setWinner(
        getWinner(
          'Player 1',
          'Player 2',
          getHand(player1Deck, houseDeck) as Hand,
          getHand(player2Deck, houseDeck) as Hand
        )
      );
    }

    if (!gameOver && currentUser === 'Player 1')
      setLocalHand(getHand(player1Deck, houseDeck) as string);
    else if (!gameOver && currentUser === 'Player 2')
      setLocalHand(getHand(player2Deck, houseDeck) as string);
  }, [gameInfo?.field.numberOfTurns]);
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<saarepatte')
  console.log(gameInfo?.field);
  const a = {
    currentUser,
    turn,
    player1Chips,
    player2Chips,
    increment,
    gameOver
  }
  console.log("???>>>>>?", a)
  console.log("HALLL>>>>>>>", (currentUser !== turn ||
    (currentUser === 'Player 2' && player2Chips < increment) ||
    (currentUser === 'Player 1' && player1Chips < increment) ||
    gameOver))
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
                disabled={
                  currentUser !== turn ||
                  (currentUser === 'Player 2' && player2Chips < increment) ||
                  (currentUser === 'Player 1' && player1Chips < increment) ||
                  gameOver
                }
                onClick={() => callHandler()}
              >
                {(raiseAmount === 0 &&
                  increment &&
                  numberOfTurns < 2 &&
                  `Buy In(${increment})`) ||
                  (raiseAmount === 0 && increment && `Call(${increment})`) ||
                  (raiseAmount > 0 && `Call(${raiseAmount})`) ||
                  'Check'}
              </button>
              <RaiseModal
                minRaise={raiseAmount > 0 ? raiseAmount : increment}
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




