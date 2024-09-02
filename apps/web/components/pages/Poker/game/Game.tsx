import React, { useState } from 'react';
import Cards from './Cards';

import { Deck, getCards } from '@/games/pokershowdown/utils/deck';
import RaiseModal from './RaiseModal';
import { IGameInfo, MatchQueueState } from '@/lib/stores/matchQueue';
import { Card, PokerCards } from 'zknoid-chain-dev';

// let socket;
// const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

interface IGameViewProps {
  gameInfo: IGameInfo<PokerCards> | undefined;
  matchInfo: MatchQueueState;
  // loadingElement: { x: number; y: number } | undefined;
  // loading: boolean;
}

const Game = ({ gameInfo, matchInfo }: IGameViewProps) => {
  const currentUser = gameInfo?.currentUserIndex == 0 ? 'Player 1' : 'Player 2';
  // Initialize game state
  const [gameOver, setGameOver] = useState<boolean | undefined>();
  const [winner, setWinner] = useState('');
  const [turn, setTurn] = useState('');
  const [numberOfTurns, setNumberOfTurns] = useState(0);
  const player1Deck: Deck[] = getCards(
    gameInfo?.field.player1Cards as Card[]
  ) as Deck[];
  const player2Deck: Deck[] = getCards(
    gameInfo?.field.player2Cards as Card[]
  ) as Deck[];
  const houseDeck: Deck[] = getCards(
    gameInfo?.field.houseCards as Card[]
  ) as Deck[];
  const [player1Chips, setPlayer1Chips] = useState(0);
  const [player2Chips, setPlayer2Chips] = useState(0);
  const [increment, setIncrement] = useState(0);
  const [pot, setPot] = useState(0);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');

  const [localHand, setLocalHand] = useState('N/A');

  const callHandler = () => {
    // Handle call/buyin/increment (basically match the previous bet)
  };

  const raiseHandler = (amount: number) => {
    // TODO: add logic for raise transaction
  };

  const foldHandler = () => {
    // Handle fold action -> me surrender
  };
  const [restart, setRestart] = useState(false);
  return (
    <div className="game-bg noselect">
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
