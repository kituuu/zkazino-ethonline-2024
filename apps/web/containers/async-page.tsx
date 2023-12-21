'use client';
import { useWalletStore } from '@/lib/stores/wallet';

import { useMemo, useState } from 'react';
import { GameView } from '@/components/GameView';
import {
  Bricks,
  GameInputs,
  Tick,
  loadGameContext,
  defaultLevel,
} from 'zknoid-chain';
import { Bool, UInt64 } from 'o1js';

enum GameState {
  NotStarted,
  Active,
  Won,
  Lost,
  Replay,
  Proofing,
}

interface UserTop {
  address: `0x${string}`;
  score: number;
}

export default function Home({
  params,
}: {
  params: { competitionId: string };
}) {
  const [address, setAddress] = useState('');
  const [gameState, setGameState] = useState(GameState.NotStarted);
  const [lastTicks, setLastTicks] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);

  const [topUsers, setTopUsers] = useState<UserTop[]>([
    {
      address: '0x2836eC28C32E232280F984d3980BA4e05d6BF68f',
      score: 100,
    },
    {
      address: '0xE314CE1514B21f4dc39C546b3c3bca317652d0Ac',
      score: 70,
    },
  ]);

  let [gameId, setGameId] = useState(0);
  let [debug, setDebug] = useState(true);
  const level: Bricks = useMemo(() => defaultLevel(), []);

  const connectWallet = async () => {
    const accounts = await (window as any).mina.requestAccounts();
    setAddress(accounts[0]);
  };

  const startGame = () => {
    setGameState(GameState.Active);
    setGameId(gameId + 1);
  };

  const proof = () => {
    console.log('Ticks', lastTicks);

    // @ts-expect-error
    let userInput = new GameInputs({
      tiks: lastTicks.map(
        // @ts-expect-error
        (elem) => new Tick({ action: UInt64.from(elem) }),
      ),
    });

    try {
      const gameContext = loadGameContext(level, new Bool(true));
      for (let i = 0; i < userInput.tiks.length; i++) {
        gameContext.processTick(userInput.tiks[i]);
        console.log('Game ctx', gameContext);
      }
    } catch (e) {
      console.log('Error while generating ZK proof');
      console.log(e);
    }
  };

  return (
    <main className="flex grow flex-col items-center gap-5 p-5">
      {address ? (
        <div className="flex flex-col gap-5">
          {gameState == GameState.Won && (
            <div>
              You won! Ticks verification:{' '}
              <input
                type="text"
                value={JSON.stringify(lastTicks)}
                readOnly
              ></input>
            </div>
          )}
          {gameState == GameState.Lost && (
            <div>You've lost! Nothing to prove</div>
          )}

          <div className="flex flex-row items-center justify-center gap-5">
            {(gameState == GameState.Won || gameState == GameState.Lost) && (
              <div
                className="rounded-xl bg-slate-300 p-5"
                onClick={() => startGame()}
              >
                Restart
              </div>
            )}
            {gameState == GameState.NotStarted && (
              <div
                className="rounded-xl bg-slate-300 p-5"
                onClick={() => startGame()}
              >
                Start
              </div>
            )}
            {gameState == GameState.Won && (
              <div
                className="rounded-xl bg-slate-300 p-5"
                onClick={() => proof()}
              >
                Send proof
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl bg-slate-300 p-5"
          onClick={() => connectWallet()}
        >
          Connect wallet
        </div>
      )}
      <GameView
        onWin={(ticks) => {
          console.log('Ticks', ticks);
          setLastTicks(ticks);
          setGameState(GameState.Won);
        }}
        onLost={(ticks) => {
          setLastTicks(ticks);
          setGameState(GameState.Lost);
        }}
        level={level}
        gameId={gameId}
        debug={debug}
        setScore={setScore}
      />
      <div>
        Score: {score}
      </div>
      <div className="grow"></div>
      <div>
        Leaderboard {params.competitionId}:
        <div>
          {topUsers.map((user) => (
            <div key={user.address}>
              {user.address} – {user.score} pts
            </div>
          ))}
        </div>
      </div>
      <div className="w-full text-end">
        Debug:{' '}
        <input
          type="checkbox"
          checked={debug}
          onChange={(event) => {
            setDebug(event.target.checked);
          }}
        ></input>
      </div>
    </main>
  );
}
