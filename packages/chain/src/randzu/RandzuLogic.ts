import { state, runtimeMethod, runtimeModule } from '@proto-kit/module';
import type { Option } from '@proto-kit/protocol';
import { State, StateMap, assert } from '@proto-kit/protocol';
import {
  PublicKey,
  Struct,
  UInt64,
  Provable,
  Bool,
  Poseidon,
} from 'o1js';
import { MatchMaker } from '../engine/MatchMaker';
import { UInt64 as ProtoUInt64 } from '@proto-kit/library';
import { Lobby } from '../engine/LobbyManager';
import { Deck, Card } from './poker';
import { ZNAKE_TOKEN_ID } from '../constants';

export class PokerCards extends Struct({
  player1Cards: Provable.Array(Card, 2),
  player2Cards: Provable.Array(Card, 2),
  houseCards: Provable.Array(Card, 5),
  player1Chips: ProtoUInt64,
  player2Chips: ProtoUInt64,
  pot: ProtoUInt64,
  player1Bet: ProtoUInt64,
  player2Bet: ProtoUInt64,
  numberOfTurns: ProtoUInt64,
  increment: ProtoUInt64,
}) {
  static from(
    player1Cards: Card[],
    player2Cards: Card[],
    houseCards: Card[],
    player1Chips: ProtoUInt64,
    player2Chips: ProtoUInt64,
    pot: ProtoUInt64,
    player1Bet: ProtoUInt64,
    player2Bet: ProtoUInt64,
    numberOfTurns: ProtoUInt64,
    increment: ProtoUInt64,
  ) {
    return new PokerCards({
      player1Cards,
      player2Cards,
      houseCards,
      player1Chips,
      player2Chips,
      pot,
      player1Bet,
      player2Bet,
      numberOfTurns,
      increment,
    });
  }
}

export class GameInfo extends Struct({
  player1: PublicKey,
  player2: PublicKey,
  currentMoveUser: PublicKey,
  lastMoveBlockHeight: UInt64,
  winner: PublicKey,
  field: PokerCards,
}) {}

@runtimeModule()
export class RandzuLogic extends MatchMaker {
  @state() public games = StateMap.from<UInt64, GameInfo>(UInt64, GameInfo);

  @state() public gamesNum = State.from<UInt64>(UInt64);

  public override async initGame(
    lobby: Lobby,
    shouldUpdate: Bool,
  ): Promise<UInt64> {
    const currentGameId = lobby.id;
    const deck: Deck = new Deck();

    await this.games.set(
      Provable.if(shouldUpdate, currentGameId, UInt64.from(0)),
      new GameInfo({
        player1: lobby.players[0],
        player2: lobby.players[1],
        currentMoveUser: lobby.players[0],
        lastMoveBlockHeight: this.network.block.height,
        winner: PublicKey.empty(),
        field: PokerCards.from(
          [deck.dealCard(), deck.dealCard()],
          [deck.dealCard(), deck.dealCard()],
          [deck.dealCard(), deck.dealCard(), deck.dealCard(), deck.dealCard(), deck.dealCard()],
          lobby.participationFee,
          lobby.participationFee,
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(1)
        ),
      }),
    );

    await this.gameFund.set(
      currentGameId,
      ProtoUInt64.from(lobby.participationFee).mul(2),
    );

    return await super.initGame(lobby, shouldUpdate);
  }

  @runtimeMethod()
  public async raise(
    gameId: UInt64,
    amount: ProtoUInt64
  ): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(gameInfo.currentMoveUser.equals(this.transaction.sender.value), 'Not your move');
    assert(gameInfo.winner.equals(PublicKey.empty()), 'Game already finished');

    assert(amount.greaterThanOrEqual(ProtoUInt64.from(0)), 'Invalid amount');
    const currentChips = gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.field.player1Chips
      : gameInfo.field.player2Chips;
    assert(amount.lessThanOrEqual(currentChips), 'Insufficient chips');

    gameInfo.field.pot = gameInfo.field.pot.add(amount);
    gameInfo.field.increment = amount;
    if (gameInfo.currentMoveUser.equals(gameInfo.player1)) {
      gameInfo.field.player1Chips = gameInfo.field.player1Chips.sub(amount);
      gameInfo.field.player1Bet = gameInfo.field.player1Bet.add(amount);
    } else {
      gameInfo.field.player2Chips = gameInfo.field.player2Chips.sub(amount);
      gameInfo.field.player2Bet = gameInfo.field.player2Bet.add(amount);
    }

    gameInfo.currentMoveUser = gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.player2
      : gameInfo.player1;

    gameInfo.lastMoveBlockHeight = this.network.block.height;
    await this.games.set(gameId, gameInfo);
  }

  @runtimeMethod()
  public async call(gameId: UInt64): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(gameInfo.currentMoveUser.equals(this.transaction.sender.value), 'Not your move');
    assert(gameInfo.winner.equals(PublicKey.empty()), 'Game already finished');

    const betDifference: ProtoUInt64 = (gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.field.player2Bet
      : gameInfo.field.player1Bet).sub(
        gameInfo.currentMoveUser.equals(gameInfo.player1)
          ? gameInfo.field.player1Bet
          : gameInfo.field.player2Bet
      );

    assert(betDifference.greaterThanOrEqual(ProtoUInt64.from(0)), 'Invalid call amount');

    gameInfo.field.pot = gameInfo.field.pot.add(betDifference);
    if (gameInfo.currentMoveUser.equals(gameInfo.player1)) {
      gameInfo.field.player1Chips = gameInfo.field.player1Chips.sub(betDifference);
    } else {
      gameInfo.field.player2Chips = gameInfo.field.player2Chips.sub(betDifference);
    }

    gameInfo.field.numberOfTurns = gameInfo.field.numberOfTurns.add(ProtoUInt64.from(1));
    gameInfo.field.increment = ProtoUInt64.from(0);
    
    gameInfo.currentMoveUser = gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.player2
      : gameInfo.player1;

    gameInfo.lastMoveBlockHeight = this.network.block.height;
    await this.games.set(gameId, gameInfo);
  }

  @runtimeMethod()
  public async declareWinner(gameId: UInt64, winner: PublicKey): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(gameInfo.winner.equals(PublicKey.empty()), 'Winner already declared');
    assert(winner.equals(gameInfo.player1) || winner.equals(gameInfo.player2), 'Invalid winner');

    gameInfo.winner = winner;
    await this.games.set(gameId, gameInfo);

    const totalPot = gameInfo.field.pot;
    await this.mintAndTransferPot(winner, totalPot);
  }

  private async mintAndTransferPot(winner: PublicKey, amount: ProtoUInt64): Promise<void> {
    await this.balances.mint(ZNAKE_TOKEN_ID, winner, amount);
  }

  @runtimeMethod()
  public async fold(gameId: UInt64): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(gameInfo.currentMoveUser.equals(this.transaction.sender.value), 'Not your move');
    assert(gameInfo.winner.equals(PublicKey.empty()), 'Game already finished');

    const winner = gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.player2
      : gameInfo.player1;

    await this.declareWinner(gameId, winner);
  }
}