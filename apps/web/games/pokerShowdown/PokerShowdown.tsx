'use client';

import { useContext, useEffect, useState } from 'react';
import { GameView } from './components/GameView';
import { Int64, PublicKey, UInt32, UInt64 } from 'o1js';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';
import { useNetworkStore } from '@/lib/stores/network';
import {
  useObserveRandzuMatchQueue,
  useRandzuMatchQueueStore,
} from '@/games/pokerShowdown/stores/matchQueue';
import { useStore } from 'zustand';
import { useSessionKeyStore } from '@/lib/stores/sessionKeyStorage';
import { ClientAppChain, PENDING_BLOCKS_NUM_CONST } from 'zknoid-chain-dev';
import GamePage from '@/components/framework/GamePage';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { useProtokitChainStore } from '@/lib/stores/protokitChain';
import { MainButtonState } from '@/components/framework/GamePage/PvPGameView';
import { api } from '@/trpc/react';
import { DEFAULT_PARTICIPATION_FEE } from 'zknoid-chain-dev/dist/src/engine/LobbyManager';
import { MOVE_TIMEOUT_IN_BLOCKS } from 'zknoid-chain-dev/dist/src/engine/MatchMaker';
import GameWidget from '@/components/framework/GameWidget';
import { motion } from 'framer-motion';
import { formatPubkey } from '@/lib/utils';
import Button from '@/components/shared/Button';
import { Currency } from '@/constants/currency';
import { formatUnits } from '@/lib/unit';
import znakesImg from '@/public/image/tokens/znakes.svg';
import Image from 'next/image';
import { UnsetCompetitionPopup } from '@/components/framework/GameWidget/ui/popups/UnsetCompetitionPopup';
import { Win } from '@/components/framework/GameWidget/ui/popups/Win';
import { Lost } from '@/components/framework/GameWidget/ui/popups/Lost';
import { walletInstalled } from '@/lib/helpers';
import { ConnectWallet } from '@/components/framework/GameWidget/ui/popups/ConnectWallet';
import { InstallWallet } from '@/components/framework/GameWidget/ui/popups/InstallWallet';
import { GameWrap } from '@/components/framework/GamePage/GameWrap';
import { RateGame } from '@/components/framework/GameWidget/ui/popups/RateGame';
import toast from '@/components/shared/Toast';
import { useToasterStore } from '@/lib/stores/toasterStore';
import { useRateGameStore } from '@/lib/stores/rateGameStore';
import { GameState } from './lib/gameState';
import { useStartGame } from '@/games/pokerShowdown/features/startGame';
import {
  useLobbiesStore,
  useObserveLobbiesStore,
} from '@/lib/stores/lobbiesStore';
import Game from '@/components/pages/Poker/game/Game';
import { pokerShowdownConfig } from './config';
import RulesAccordion from './ui/RulesAccordion';
//import { Poker } from '../poker/Poker';
import { GameInfo } from 'zknoid-chain-dev/dist/src/randzu/RandzuLogic';
import { getCards } from './utils/deck';

const competition = {
  id: 'global',
  name: 'Global competition',
  enteringPrice: BigInt(+DEFAULT_PARTICIPATION_FEE.toString()),
  prizeFund: 0n,
};

export default function PokerShowdown({
  params,
}: {
  params: { competitionId: string };
}) {
  const [gameState, setGameState] = useState(GameState.NotStarted);

  const [isRateGame, setIsRateGame] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [loadingElement, setLoadingElement] = useState<
    { x: number; y: number } | undefined
  >({ x: 0, y: 0 });
  const { client } = useContext(ZkNoidGameContext);

  if (!client) {
    throw Error('Context app chain client is not set');
  }

  const networkStore = useNetworkStore();
  const matchQueue = useRandzuMatchQueueStore();
  const toasterStore = useToasterStore();
  const rateGameStore = useRateGameStore();
  const protokitChain = useProtokitChainStore();
  useObserveRandzuMatchQueue();
  const sessionPrivateKey = useStore(useSessionKeyStore, (state) =>
    state.getSessionKey()
  );
  const progress = api.progress.setSolvedQuests.useMutation();
  const startGame = useStartGame(competition.id, setGameState);
  const getRatingQuery = api.ratings.getGameRating.useQuery({
    gameId: 'randzu',
  });

  const client_ = client as ClientAppChain<
    typeof pokerShowdownConfig.runtimeModules,
    any,
    any,
    any
  >;

  const query = networkStore.protokitClientStarted
    ? client_.query.runtime.RandzuLogic
    : undefined;

  useObserveLobbiesStore(query);
  const lobbiesStore = useLobbiesStore();

  const getPot: any = async (gameId: UInt64) => {
    const pot: ProtoUInt64 | undefined = await query?.gameFund.get(
      UInt64.from(gameId)
    );
    if (pot) {
      const finalPot = pot.div(ProtoUInt64.from(1000000000));
      return finalPot;
    }
  };
  const callT = async () => {
    if (matchQueue.gameInfo != undefined) {
    }
  };

  callT();
  const restart = () => {
    matchQueue.resetLastGameState();
    setGameState(GameState.NotStarted);
  };

  // nonSSR

  const collectPending = async () => {
    const randzuLogic = client.runtime.resolve('RandzuLogic');

    const tx = await client.transaction(
      sessionPrivateKey.toPublicKey(),
      async () => {
        randzuLogic.collectPendingBalance();
      }
    );

    tx.transaction = tx.transaction?.sign(sessionPrivateKey);

    await tx.send();
  };

  // nonSSR
  const proveOpponentTimeout = async () => {
    const randzuLogic = client.runtime.resolve('RandzuLogic');

    const tx = await client.transaction(
      PublicKey.fromBase58(networkStore.address!),
      async () => {
        randzuLogic.proveOpponentTimeout(
          UInt64.from(matchQueue.gameInfo!.gameId)
        );
      }
    );

    await tx.sign();
    await tx.send();
  };

  const handleCall = async () => {
    try {
      const randzuLogic = client.runtime.resolve('RandzuLogic');

      const tx = await client.transaction(
        PublicKey.fromBase58(networkStore.address!),
        async () => {
          randzuLogic.call(UInt64.from(matchQueue.gameInfo?.gameId));
        }
      );

      await tx.sign();
      await tx.send();
    } catch (error) {
      toast.error(toasterStore, error as string);
    }
  };
  const handleRaise = async (amount: number) => {
    const randzuLogic = client.runtime.resolve('RandzuLogic');

    const tx = await client.transaction(
      PublicKey.fromBase58(networkStore.address!),
      async () => {
        randzuLogic.raise(
          UInt64.from(matchQueue.gameInfo?.gameId),
          ProtoUInt64.from(amount)
        );
      }
    );

    await tx.sign();
    await tx.send();
  };
  const handleClaimFunds = async (winner: PublicKey) => {
    const randzuLogic = client.runtime.resolve('RandzuLogic');

    const tx = await client.transaction(
      PublicKey.fromBase58(networkStore.address!),
      async () => {
        randzuLogic.declareWinner(
          UInt64.from(matchQueue.gameInfo?.gameId),
          winner
        );
      }
    );

    await tx.sign();
    await tx.send();
  };

  const handleFold = async () => {
    const randzuLogic = client.runtime.resolve('RandzuLogic');

    const tx = await client.transaction(
      PublicKey.fromBase58(networkStore.address!),
      async () => {
        randzuLogic.fold(UInt64.from(matchQueue.gameInfo?.gameId));
      }
    );

    await tx.sign();
    await tx.send();
  };

  useEffect(() => {
    setLoading(false);
    setLoadingElement(undefined);
  }, [matchQueue.gameInfo?.isCurrentUserMove]);

  useEffect(() => {
    if (matchQueue.pendingBalance && !matchQueue.inQueue) {
      collectPending();
    }
    if (!walletInstalled()) {
      setGameState(GameState.WalletNotInstalled);
    } else if (!networkStore.address) {
      setGameState(GameState.WalletNotConnected);
    } else if (matchQueue.inQueue && !matchQueue.activeGameId) {
      setGameState(GameState.Matchmaking);
    } else if (
      matchQueue.activeGameId &&
      matchQueue.gameInfo?.isCurrentUserMove
    ) {
      setGameState(GameState.CurrentPlayerTurn);
    } else if (
      matchQueue.gameInfo &&
      !matchQueue.gameInfo?.isCurrentUserMove &&
      BigInt(protokitChain?.block?.height || '0') -
        matchQueue.gameInfo?.lastMoveBlockHeight >
        MOVE_TIMEOUT_IN_BLOCKS
    ) {
      setGameState(GameState.OpponentTurn);
    } else if (
      matchQueue.activeGameId &&
      !matchQueue.gameInfo?.isCurrentUserMove
    ) {
      setGameState(GameState.OpponentTurn);
    } else {
      if (matchQueue.lastGameState == 'win') setGameState(GameState.Won);
      else if (matchQueue.lastGameState == 'lost') setGameState(GameState.Lost);
      else setGameState(GameState.NotStarted);
    }
  }, [
    matchQueue.activeGameId,
    matchQueue.gameInfo,
    matchQueue.inQueue,
    matchQueue.lastGameState,
    networkStore.address,
  ]);

  const mainButtonState = loading
    ? MainButtonState.TransactionExecution
    : (
        {
          [GameState.CurrentPlayerTurn]: MainButtonState.YourTurn,
          [GameState.OpponentTurn]: MainButtonState.OpponentsTurn,
          [GameState.OpponentTimeout]: MainButtonState.OpponentTimeOut,
          [GameState.NotStarted]: MainButtonState.NotStarted,
          [GameState.WalletNotInstalled]: MainButtonState.WalletNotInstalled,
          [GameState.WalletNotConnected]: MainButtonState.WalletNotConnected,
        } as Record<GameState, MainButtonState>
      )[gameState] || MainButtonState.None;

  const statuses = {
    [GameState.WalletNotInstalled]: 'WALLET NOT INSTALLED',
    [GameState.WalletNotConnected]: 'WALLET NOT CONNECTED',
    [GameState.NotStarted]: 'NOT STARTED',
    [GameState.MatchRegistration]: 'MATCH REGISTRATION',
    [GameState.Matchmaking]: `MATCHMAKING ${
      (protokitChain.block?.height ?? 0) % PENDING_BLOCKS_NUM_CONST
    }  / ${PENDING_BLOCKS_NUM_CONST} 🔍`,
    [GameState.CurrentPlayerTurn]: `YOUR TURN`,
    [GameState.OpponentTurn]: `OPPONENT TURN`,
    [GameState.OpponentTimeout]: `OPPONENT TIMEOUT ${
      Number(protokitChain?.block?.height) -
      Number(matchQueue.gameInfo?.lastMoveBlockHeight)
    }`,
    [GameState.Won]: 'YOU WON',
    [GameState.Lost]: 'YOU LOST',
  } as Record<GameState, string>;

  useEffect(() => {
    if (gameState == GameState.Won)
      toast.success(
        toasterStore,
        `You are won! Winnings: ${formatUnits(matchQueue.pendingBalance)} ${Currency.ZNAKES}`,
        true
      );
  }, [gameState]);

  return (
    <GamePage gameConfig={pokerShowdownConfig} defaultPage={'Game'}>
      <motion.div
        className={'flex flex-col-reverse gap-4 pt-10 lg:flex-row lg:pt-0'}
        animate={'windowed'}
      >
        <div className={'flex h-full w-full flex-col gap-4 lg:w-2/5'}>
          <div
            className={
              'flex w-full gap-2 font-plexsans text-[20px]/[20px] uppercase text-left-accent'
            }
          >
            <span>Game status:</span>
            <span>{statuses[gameState]}</span>
          </div>
          <div
            className={
              'flex w-full gap-2 font-plexsans text-[20px]/[20px] text-foreground'
            }
          >
            <span>Your opponent:</span>
            <span>{formatPubkey(matchQueue.gameInfo?.opponent)}</span>
          </div>
          {mainButtonState == MainButtonState.YourTurn && (
            <Button
              startContent={
                <svg
                  width="26"
                  height="18"
                  viewBox="0 0 26 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 7L10 16L25 1" stroke="#252525" strokeWidth="2" />
                </svg>
              }
              label={'YOUR TURN'}
              isReadonly
            />
          )}
          {/* {mainButtonState == MainButtonState.OpponentsTurn && (
            <Button
              startContent={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.5134 10.5851L1.476 0L0.00136988 1.41421L11.0387 11.9994L0 22.5858L1.47463 24L12.5134 13.4136L22.5242 23.0143L23.9989 21.6001L13.988 11.9994L23.9975 2.39996L22.5229 0.98575L12.5134 10.5851Z"
                    fill="#252525"
                  />
                </svg>
              }
              label={"OPPONENT'S TURN"}
              isReadonly
            />
          )}
          {mainButtonState == MainButtonState.OpponentTimeOut && (
            <Button label={'OPPONENT TIMED OUT'} isReadonly />
          )} */}
          {mainButtonState == MainButtonState.TransactionExecution && (
            <Button
              startContent={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 12C24 15.1826 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1826 24 12 24C8.8174 24 5.76515 22.7357 3.51472 20.4853C1.26428 18.2348 0 15.1826 0 12C0 11.633 0.017 11.269 0.049 10.91L2.041 11.091C2.01367 11.3903 2 11.6933 2 12C2 13.9778 2.58649 15.9112 3.6853 17.5557C4.78412 19.2002 6.3459 20.4819 8.17317 21.2388C10.0004 21.9957 12.0111 22.1937 13.9509 21.8079C15.8907 21.422 17.6725 20.4696 19.0711 19.0711C20.4696 17.6725 21.422 15.8907 21.8079 13.9509C22.1937 12.0111 21.9957 10.0004 21.2388 8.17317C20.4819 6.3459 19.2002 4.78412 17.5557 3.6853C15.9112 2.58649 13.9778 2 12 2C11.6933 2 11.3903 2.01367 11.091 2.041L10.91 0.049C11.269 0.017 11.633 0 12 0C15.1815 0.00344108 18.2318 1.26883 20.4815 3.51852C22.7312 5.76821 23.9966 8.81846 24 12ZM5.663 4.263L4.395 2.717C3.78121 3.2216 3.2185 3.78531 2.715 4.4L4.262 5.665C4.68212 5.15305 5.15135 4.68348 5.663 4.263ZM9.142 2.415L8.571 0.5C7.80965 0.726352 7.0727 1.02783 6.371 1.4L7.31 3.166C7.89418 2.85539 8.50789 2.60381 9.142 2.415ZM3.164 7.315L1.4 6.375C1.02801 7.07678 0.726533 7.81372 0.5 8.575L2.417 9.146C2.60454 8.51172 2.85478 7.89769 3.164 7.313V7.315ZM11 6V10.277C10.7004 10.4513 10.4513 10.7004 10.277 11H7V13H10.277C10.4297 13.2652 10.6414 13.4917 10.8958 13.662C11.1501 13.8323 11.4402 13.9417 11.7436 13.9818C12.047 14.0219 12.3556 13.9917 12.6454 13.8934C12.9353 13.7951 13.1986 13.6314 13.415 13.415C13.6314 13.1986 13.7951 12.9353 13.8934 12.6454C13.9917 12.3556 14.0219 12.047 13.9818 11.7436C13.9417 11.4402 13.8323 11.1501 13.662 10.8958C13.4917 10.6414 13.2652 10.4297 13 10.277V6H11Z"
                    fill="#252525"
                  />
                </svg>
              }
              label={'TRANSACTION EXECUTION'}
              isReadonly
            />
          )}
          <div className={'flex w-full flex-col'}>
            <span
              className={'h-[54px] pb-4 font-museo text-headline-3 font-bold'}
            >
              Rules
            </span>
            <RulesAccordion
              title={'Game overwiew'}
              rules={
                'Players aim to make the best five-card hand using a combination of their own hole cards and the community cards available to all players. It can be played with 2 to 6 players. The game consists of several rounds of betting, followed by the dealing of community cards.'
              }
              defaultOpen
            />
            <RulesAccordion
              title={'Blinds'}
              rules={
                'Each hand begins with two players posting forced bets called the small blind and the big blind. The player to the left of the dealer posts the small blind, and the player to their left posts the big blind. The blinds ensure there is money in the pot and create action. The size of the blinds is determined by lobby settings.'
              }
              defaultOpen
            />
            <RulesAccordion
              title={'Betting Stage'}
              rules={
                'After the blinds are posted, each player is dealt two private cards (hole cards) face down. The first round of betting begins with the player to the left of the big blind. Players can call (match the current bet), raise (increase the bet), or fold (discard their cards and forfeit the hand). Betting continues clockwise around the table until all players have either folded or called the highest bet.'
              }
              defaultOpen
            />
          </div>
          <div className={'flex w-full flex-col'}>
            <div className={'h-[54px]'} />
            <RulesAccordion
              title={'Opening Stage'}
              rules={
                'After the initial round of betting, the dealer places three community cards face-up on the table. This is called the flop. Another round of betting occurs, starting with the player to the left of the dealer. Following the flop, the dealer places a fourth community card face-up on the table. This is called the turn. Another round of betting occurs, starting with the player to the left of the dealer. Finally, the dealer places a fifth and final community card face-up on the table. This is called the rive. A final round of betting occurs.'
              }
              defaultOpen
            />
            <RulesAccordion
              title={'Determining the Winner'}
              rules={
                'After the final round of betting, if there are two or more players remaining, a showdown occurs. Players reveal their hole cards, and the best five-card hand wins the pot. Players can use any combination of their hole cards and the community cards to form their hand. The player with the highest-ranking hand wins the pot. If two or more players have the same hand, the pot is split evenly among them. The game then moves to the next hand, and the dealer button rotates clockwise to the next player, and the process repeats.'
              }
              defaultOpen
            />
          </div>
        </div>
        <GameWidget
          author={pokerShowdownConfig.author}
          isPvp
          playersCount={matchQueue.getQueueLength()}
          gameId="randzu"
        >
          {networkStore.address ? (
            <>
              {!competition ? (
                <GameWrap>
                  <UnsetCompetitionPopup gameId={pokerShowdownConfig.id} />
                </GameWrap>
              ) : (
                <>
                  {gameState == GameState.Won &&
                    (isRateGame &&
                    !rateGameStore.ratedGamesIds.includes(
                      pokerShowdownConfig.id
                    ) ? (
                      <GameWrap>
                        <RateGame
                          gameId={pokerShowdownConfig.id}
                          onClick={() => setIsRateGame(false)}
                        />
                      </GameWrap>
                    ) : (
                      <GameWrap>
                        <Win
                          onBtnClick={restart}
                          title={'You won! Congratulations!'}
                          btnText={'Find new game'}
                        />
                      </GameWrap>
                    ))}
                  {gameState == GameState.Lost && (
                    <GameWrap>
                      <Lost startGame={restart} />
                    </GameWrap>
                  )}
                  {gameState === GameState.NotStarted && (
                    <GameWrap>
                      <Button
                        label={`START FOR ${formatUnits(
                          competition.enteringPrice
                        )}`}
                        onClick={startGame}
                        className={'max-w-[40%]'}
                        endContent={
                          <Image
                            src={znakesImg}
                            alt={'Znakes token'}
                            className={'h-[24px] w-[24px] pb-0.5'}
                          />
                        }
                      />
                    </GameWrap>
                  )}
                </>
              )}
            </>
          ) : walletInstalled() ? (
            <GameWrap>
              <ConnectWallet
                connectWallet={() => networkStore.connectWallet(false)}
              />
            </GameWrap>
          ) : (
            <GameWrap>
              <InstallWallet />
            </GameWrap>
          )}

          {(gameState === GameState.Matchmaking ||
            gameState === GameState.MatchRegistration ||
            gameState === GameState.CurrentPlayerTurn ||
            gameState === GameState.OpponentTurn) && (
            <Game
              gameInfo={matchQueue.gameInfo}
              setGameState={setGameState}
              handleCall={handleCall}
              handleRaise={handleRaise}
              handleFold={handleFold}
              handleClaimFunds={handleClaimFunds}
            />
          )}
        </GameWidget>

        <div
          className={
            'flex flex-row gap-4 font-plexsans text-[14px]/[14px] text-left-accent lg:hidden lg:text-[20px]/[20px]'
          }
        >
          <span className={'uppercase'}>Players in queue: {2}</span>
        </div>
        <div className={'flex h-full w-full flex-col gap-4 lg:hidden'}>
          <span className={'w-full text-headline-2 font-bold'}>Game</span>
          <div
            className={
              'flex w-full gap-2 font-plexsans text-[16px]/[16px] uppercase text-left-accent lg:text-[20px]/[20px]'
            }
          >
            <span>Game status:</span>
            <span>{statuses[gameState]}</span>
          </div>
          <div
            className={
              'flex w-full items-center gap-2 font-plexsans text-[14px]/[14px] text-foreground lg:text-[20px]/[20px]'
            }
          >
            <span>Your opponent:</span>
            <span>{formatPubkey(matchQueue.gameInfo?.opponent)}</span>
          </div>
        </div>
      </motion.div>
    </GamePage>
  );
}
