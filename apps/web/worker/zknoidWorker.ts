import 'reflect-metadata';

import { LOTTERY_CACHE } from '@/constants/contracts_cache';
import { FetchedCache, WebFileSystem, fetchCache } from '@/lib/cache';
import { mockProof } from '@/lib/utils';

import {
  Field as Field014,
  UInt64,
  PublicKey,
  Field,
  MerkleMapWitness,
  MerkleMap,
  UInt32,
  Mina,
  fetchAccount,
  NetworkId,
  type JsonProof,
} from 'o1js';
import {
  checkMapGeneration,
  checkGameRecord,
  Bricks,
  GameInputs,
  GameRecord,
  MapGenerationProof,
  initGameProcess,
  GameProcessProof,
  processTicks,
  GameRecordProof,
  client,
  Tick,
} from 'zknoid-chain-dev';
import {
  Ticket,
  PLottery,
  TicketReduceProgram,
  DistibutionProgram,
  PStateManager,
  NumberPacked,
  getNullifierId,
  DistributionProof,
  DistributionProofPublicInput,
  MerkleMap20Witness,
} from 'l1-lottery-contracts';

import {
  BuyTicketEvent,
  GetRewardEvent,
  ProduceResultEvent,
} from 'l1-lottery-contracts';
import { NETWORKS } from '@/app/constants/networks';
import { number } from 'zod';
import { lotteryBackendRouter } from '@/server/api/routers/lottery-backend';
import { api } from '@/trpc/vanilla';
// import { DummyBridge } from 'zknoidcontractsl1';

// ---------------------------------------------------------------------------------------
type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  gameRecord: null as null | typeof GameRecord,
  Lottery: null as null | typeof PLottery,
  lotteryGame: null as null | PLottery,
  lotteryCache: null as null | FetchedCache,
  buyTicketTransaction: null as null | Transaction,
  getRewardTransaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  loadContracts: async (args: {}) => {
    state.gameRecord = GameRecord;
    // state.dummyBridge = DummyBridge;
  },
  downloadLotteryCache: async () => {
    state.lotteryCache = await fetchCache(LOTTERY_CACHE);
  },
  compileContracts: async (args: {}) => {},
  compileReduceProof: async (args: {}) => {
    await TicketReduceProgram.compile({
      cache: WebFileSystem(state.lotteryCache!),
    });
  },
  compileDistributionProof: async (args: {}) => {
    await DistibutionProgram.compile({
      cache: WebFileSystem(state.lotteryCache!),
    });
  },
  compileLotteryContracts: async (args: {}) => {
    await PLottery.compile({
      cache: WebFileSystem(state.lotteryCache!),
    });
  },
  initLotteryInstance: async (args: {
    lotteryPublicKey58: string;
    networkId: NetworkId;
  }) => {
    const publicKey = PublicKey.fromBase58(args.lotteryPublicKey58);
    state.lotteryGame = new PLottery(publicKey);

    const Network = Mina.Network({
      mina: NETWORKS[args.networkId.toString()].graphql,
      archive: NETWORKS[args.networkId.toString()].archive,
    });

    Mina.setActiveInstance(Network);

    await functions.fetchOnchainState();
  },
  async fetchOnchainState() {
    const account = await fetchAccount({
      publicKey: state.lotteryGame!.address,
    });
  },
  buyTicket: async (args: {
    senderAccount: string;
    startBlock: number;
    roundId: number;
    ticketNums: number[];
    amount: number;
  }) => {
    const senderAccount = PublicKey.fromBase58(args.senderAccount);

    const ticket = Ticket.from(args.ticketNums, senderAccount, args.amount);

    let tx = await Mina.transaction(senderAccount, async () => {
      await state.lotteryGame!.buyTicket(ticket, Field014.from(args.roundId));
    });

    state.buyTicketTransaction = tx;
  },
  getReward: async (args: {
    networkId: string;
    senderAccount: string;
    startBlock: number;
    roundId: number;
    ticketNums: number[];
    amount: number;
  }) => {
    const senderAccount = PublicKey.fromBase58(args.senderAccount);

    const claimData = await fetch(
      'https://api2.zknoid.io/claim-api/get-claim-data',
      {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          roundId: args.roundId,
          networkID: args.networkId,
          ticketNums: args.ticketNums,
          senderAccount,
          amount: args.amount,
        }),
      }
    );

    const { rp } = await claimData.json();

    const ticket = Ticket.from(args.ticketNums, senderAccount, args.amount);

    let tx = await Mina.transaction(senderAccount, async () => {
      await state.lotteryGame!.getReward(
        ticket,
        MerkleMap20Witness.fromJSON(rp.roundWitness) as MerkleMap20Witness,
        MerkleMap20Witness.fromJSON(
          rp.roundTicketWitness
        ) as MerkleMap20Witness,
        //@ts-ignore
        await DistributionProof.fromJSON(rp.dp),
        Field.fromJSON(rp.winningNumbers),
        MerkleMap20Witness.fromJSON(rp.resultWitness) as MerkleMap20Witness,
        Field.fromJSON(rp.bankValue),
        MerkleMap20Witness.fromJSON(rp.bankWitness) as MerkleMap20Witness,
        MerkleMapWitness.fromJSON(rp.nullifierWitness) as MerkleMapWitness
      );
    });

    state.getRewardTransaction = tx;
  },
  proveBuyTicketTransaction: async () => {
    const provingStartTime = Date.now() / 1000;
    await state.buyTicketTransaction!.prove();
    const provingEnd = Date.now() / 1000;

    return state.buyTicketTransaction!.toJSON();
  },
  proveGetRewardTransaction: async () => {
    const provingStartTime = Date.now() / 1000;

    await state.getRewardTransaction!.prove();

    const provingEnd = Date.now() / 1000;

    return state.getRewardTransaction!.toJSON();
  },
  getLotteryState: async () => {
    return {
      ticketRoot: state.lotteryGame?.ticketRoot.get().toJSON(),
      ticketNullifier: state.lotteryGame?.ticketNullifier.get().toJSON(),
      bankRoot: state.lotteryGame?.startBlock.get().toJSON(),
      roundResultRoot: state.lotteryGame?.roundResultRoot.get().toJSON(),
      startBlock: state.lotteryGame?.startBlock.get()?.toBigint(),
    };
  },
  initZkappInstance: async (args: { bridgePublicKey58: string }) => {
    // const publicKey = PublicKey.fromBase58(args.bridgePublicKey58);
    // state.dummyBridgeApp = new state.dummyBridge!(publicKey);
  },
  bridge: async (amount: UInt64) => {
    // const transaction = await Mina.transaction(() => {
    //   state.dummyBridgeApp!.bridge(amount);
    // });
    // state.transaction = transaction;
  },
  proveBridgeTransaction: async (args: {}) => {
    // await state.transaction!.prove();
  },
  getBridgeTransactionJSON: async (args: {}) => {
    // return state.transaction!.toJSON();
  },
  proveGameRecord: async (args: { seedJson: any; inputs: any; debug: any }) => {
    let seed = Field014.fromJSON(args.seedJson);
    let userInputs = (<any[]>JSON.parse(args.inputs)).map((elem) => {
      return GameInputs.fromJSON(elem);
    });

    let gameContext = await checkMapGeneration(seed);
    const mapGenerationProof = await mockProof(gameContext, MapGenerationProof);

    let currentGameState = await initGameProcess(gameContext);
    let currentGameStateProof = await mockProof(
      currentGameState,
      GameProcessProof
    );

    for (let i = 0; i < userInputs.length; i++) {
      currentGameState = await processTicks(
        currentGameStateProof,
        userInputs[i] as GameInputs
      );
      currentGameStateProof = await mockProof(
        currentGameState,
        GameProcessProof
      );
    }

    const gameProof = await mockProof(
      await checkGameRecord(mapGenerationProof, currentGameStateProof),
      GameRecordProof
    );

    gameProof.verify();

    return gameProof.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZknoidWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZknoidWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== 'undefined') {
  addEventListener(
    'message',
    async (event: MessageEvent<ZknoidWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZknoidWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

const message: ZknoidWorkerReponse = {
  id: 0,
  data: {},
};

postMessage(message);
