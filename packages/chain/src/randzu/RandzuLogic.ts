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
  Field,
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
          [
            deck.dealCard(),
            deck.dealCard(),
            deck.dealCard(),
            deck.dealCard(),
            deck.dealCard(),
          ],
          lobby.participationFee,
          lobby.participationFee,
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(0),
          ProtoUInt64.from(1),
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
  public async raise(gameId: UInt64, amount: ProtoUInt64): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );
    assert(game.isSome, 'Invalid game id');
    assert(gameInfo.currentMoveUser.equals(sender), `Not your move`);
    assert(gameInfo.winner.equals(PublicKey.empty()), `Game finished`);

    assert(amount.greaterThanOrEqual(ProtoUInt64.from(0)), 'Invalid amount');
    const currentChips = Provable.if(
      sender.equals(gameInfo.player1),
      ProtoUInt64,
      gameInfo.field.player1Chips,
      gameInfo.field.player2Chips,
    ) as ProtoUInt64;

    assert(amount.lessThanOrEqual(currentChips), 'Insufficient chips');

    gameInfo.field.pot = gameInfo.field.pot.add(amount);
    gameInfo.field.increment = amount;
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1bet');
    console.log(gameInfo.field.player1Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2bet');
    console.log(gameInfo.field.player2Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1chips');
    console.log(gameInfo.field.player1Chips.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2chips');
    console.log(gameInfo.field.player2Chips.value.value);
    const newPlayer1Chips = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player1),
      ProtoUInt64,
      gameInfo.field.player1Chips.sub(amount),
      gameInfo.field.player1Chips,
    ) as ProtoUInt64;

    const newPlayer2Chips = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player2),
      ProtoUInt64,
      gameInfo.field.player2Chips.sub(amount),
      gameInfo.field.player2Chips,
    ) as ProtoUInt64;
    gameInfo.field.player1Chips = newPlayer1Chips;

    gameInfo.field.player2Chips = newPlayer2Chips;

    const newPlayer1Bet = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player1),
      ProtoUInt64,
      gameInfo.field.player1Bet.add(amount),
      gameInfo.field.player1Bet,
    ) as ProtoUInt64;
    gameInfo.field.player1Bet = newPlayer1Bet;

    const newPlayer2Bet = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player2),
      ProtoUInt64,
      gameInfo.field.player2Bet.add(amount),
      gameInfo.field.player2Bet,
    ) as ProtoUInt64;
    gameInfo.field.player2Bet = newPlayer2Bet;
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1bet new');
    console.log(gameInfo.field.player1Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2bet new');
    console.log(gameInfo.field.player2Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1chips new');
    console.log(gameInfo.field.player1Chips.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2chips new');
    console.log(gameInfo.field.player2Chips.value.value);
    gameInfo.currentMoveUser = Provable.if(
      gameInfo.currentMoveUser.equals(game.value.player1),
      gameInfo.player2,
      gameInfo.player1,
    );

    gameInfo.lastMoveBlockHeight = this.network.block.height;
    await this.games.set(gameId, gameInfo);
  }

  @runtimeMethod()
  public async call(gameId: UInt64): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;
    const sessionSender = await this.sessions.get(
      this.transaction.sender.value,
    );
    const sender = Provable.if(
      sessionSender.isSome,
      sessionSender.value,
      this.transaction.sender.value,
    );
    assert(game.isSome, 'Invalid game id');
    assert(gameInfo.currentMoveUser.equals(sender), `Not your move`);
    assert(gameInfo.winner.equals(PublicKey.empty()), `Game finished`);

    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1bet');
    console.log(gameInfo.field.player1Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2bet');
    console.log(gameInfo.field.player2Bet.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1chips');
    console.log(gameInfo.field.player1Chips.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2chips');
    console.log(gameInfo.field.player2Chips.value.value);

    // const delta = Provable.if(
    //   gameInfo.currentMoveUser.equals(gameInfo.player2),
    //   ProtoUInt64,
    //   gameInfo.field.player1Bet,
    //   gameInfo.field.player2Bet,
    // ) as ProtoUInt64;
    const delta = gameInfo.field.increment;

    gameInfo.field.pot = gameInfo.field.pot.add(delta);

    const newPlayer2Chips = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player2),
      ProtoUInt64,
      gameInfo.field.player2Chips.sub(delta),
      gameInfo.field.player2Chips,
    ) as ProtoUInt64;
    const newPlayer1Chips = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player1),
      ProtoUInt64,
      gameInfo.field.player1Chips.sub(delta),
      gameInfo.field.player1Chips,
    ) as ProtoUInt64;
    gameInfo.field.player2Chips = newPlayer2Chips;
    gameInfo.field.player1Chips = newPlayer1Chips;
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 1chips new');
    console.log(gameInfo.field.player1Chips.value.value);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>> 2chips new');
    console.log(gameInfo.field.player2Chips.value.value);
    // console.log('hakuna');
    // console.log(typeof gameInfo.field.player2Chips);
    // console.log(gameInfo.field.player2Chips);
    // console.log(gameInfo.field.player2Chips.value);
    // console.log('hakuna');
    // console.log(typeof newPlayer2Chips);
    // console.log(newPlayer2Chips);
    // console.log(newPlayer2Chips.value);

    gameInfo.field.numberOfTurns = gameInfo.field.numberOfTurns.add(
      ProtoUInt64.from(1),
    );
    gameInfo.field.increment = ProtoUInt64.from(0);

    gameInfo.currentMoveUser = Provable.if(
      gameInfo.currentMoveUser.equals(gameInfo.player1),
      gameInfo.player2,
      gameInfo.player1,
    );

    gameInfo.lastMoveBlockHeight = this.network.block.height;
    await this.games.set(gameId, gameInfo);
  }

  @runtimeMethod()
  public async declareWinner(gameId: UInt64, winner: PublicKey): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(
      gameInfo.winner.equals(PublicKey.empty()),
      'Winner already declared',
    );

    gameInfo.winner = winner;
    await this.games.set(gameId, gameInfo);

    const totalPot = gameInfo.field.pot;
    await this.mintAndTransferPot(winner, totalPot);
  }

  private async mintAndTransferPot(
    winner: PublicKey,
    amount: ProtoUInt64,
  ): Promise<void> {
    await this.balances.mint(ZNAKE_TOKEN_ID, winner, amount);
  }

  @runtimeMethod()
  public async fold(gameId: UInt64): Promise<void> {
    const game = await this.games.get(gameId);
    assert(game.isSome, 'Invalid game id');
    const gameInfo = game.value;

    assert(
      gameInfo.currentMoveUser.equals(this.transaction.sender.value),
      'Not your move',
    );
    assert(gameInfo.winner.equals(PublicKey.empty()), 'Game already finished');

    const winner = gameInfo.currentMoveUser.equals(gameInfo.player1)
      ? gameInfo.player2
      : gameInfo.player1;

    await this.declareWinner(gameId, winner);
  }
}
