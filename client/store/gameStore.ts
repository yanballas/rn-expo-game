import { create } from 'zustand';

import { buildDeck, takeCardsFromPool } from '@/client/components/Table/functions/helpers.functions';
import { defaultHandSlotCount } from '@/client/utils/constants';
import { calculateScore } from '@/client/utils/functions';
import { logDeckRemaining, logGameReset } from '@/client/utils/logger';
import type {
    ActionResult,
    FrontCard,
    FullCard,
    GamePhase,
    InitialDealReservation,
    Recipient,
    SingleCardReservation,
} from '@/client/utils/types';

interface GameStore {
    phase: GamePhase;
    playerHand: FullCard[];
    dealerHand: FullCard[];
    playerScore: number;
    dealerScore: number;
    pool: FrontCard[];

    reserveInitialDeal: () => ActionResult<InitialDealReservation>;
    commitInitialDeal: (reservation: InitialDealReservation) => ActionResult<null>;
    reserveHit: (recipient: Recipient) => ActionResult<SingleCardReservation>;
    commitHit: (reservation: SingleCardReservation) => ActionResult<{ isBust: boolean }>;
    startDealerTurn: () => ActionResult<null>;
    revealDealerHiddenCard: () => ActionResult<null>;
    finishDealerTurn: () => ActionResult<null>;
    newRound: () => ActionResult<null>;
    resetGame: () => void;
}

function actionError(reason: string): ActionResult<never> {
    return { ok: false, reason };
}

function actionOk<T>(value: T): ActionResult<T> {
    return { ok: true, value };
}

function withFlipped(card: FrontCard, isFlipped: boolean): FullCard {
    return { ...card, isFlipped };
}

export const useGameStore = create<GameStore>()((set, get) => {
    const initialPool = buildDeck();
    logDeckRemaining(initialPool);

    return {
        phase: 'idle',
        playerHand: [],
        dealerHand: [],
        playerScore: 0,
        dealerScore: 0,
        pool: initialPool,

        reserveInitialDeal: () => {
            const { phase, pool } = get();
            if (phase !== 'idle') return actionError(`Initial deal is not allowed during "${phase}" phase.`);

            const cardsToPick = defaultHandSlotCount * 2;
            if (pool.length < cardsToPick) return actionError('Not enough cards for initial deal.');

            const { pickedCards, remainingCards } = takeCardsFromPool(pool, cardsToPick);
            const dealerCards = pickedCards.slice(0, defaultHandSlotCount);
            const playerCards = pickedCards.slice(defaultHandSlotCount);

            if (dealerCards.length !== defaultHandSlotCount || playerCards.length !== defaultHandSlotCount) {
                return actionError('Initial deal reservation produced an invalid card count.');
            }

            set({ pool: remainingCards });
            logDeckRemaining(remainingCards);

            return actionOk({ dealerCards, playerCards });
        },

        commitInitialDeal: reservation => {
            const { phase } = get();
            if (phase !== 'idle') return actionError(`Initial deal commit is not allowed during "${phase}" phase.`);

            const dealerHand = reservation.dealerCards.map((card, index) => withFlipped(card, index === 0));
            const playerHand = reservation.playerCards.map(card => withFlipped(card, true));

            set({
                dealerHand,
                playerHand,
                dealerScore: calculateScore(dealerHand),
                playerScore: calculateScore(playerHand),
                phase: 'playerTurn',
            });

            return actionOk(null);
        },

        reserveHit: recipient => {
            const { phase, pool, playerHand, dealerHand } = get();
            const isPlayerHit = recipient === 'player';
            const expectedPhase = isPlayerHit ? 'playerTurn' : 'dealerTurn';

            if (phase !== expectedPhase) return actionError(`${recipient} hit is not allowed during "${phase}" phase.`);
            if (pool.length === 0) return actionError('Deck is empty.');

            const { pickedCards, remainingCards } = takeCardsFromPool(pool, 1);
            const card = pickedCards[0];
            if (!card) return actionError('Hit reservation did not produce a card.');

            const slotIndex = isPlayerHit ? playerHand.length : dealerHand.length;

            set({ pool: remainingCards });
            logDeckRemaining(remainingCards);

            return actionOk({ recipient, card, slotIndex });
        },

        commitHit: reservation => {
            const { phase, playerHand, dealerHand } = get();
            const expectedPhase = reservation.recipient === 'player' ? 'playerTurn' : 'dealerTurn';

            if (phase !== expectedPhase) {
                return actionError(`${reservation.recipient} hit commit is not allowed during "${phase}" phase.`);
            }

            const nextCard = withFlipped(reservation.card, true);
            const nextHand = reservation.recipient === 'player' ? [...playerHand, nextCard] : [...dealerHand, nextCard];
            const nextScore = calculateScore(nextHand);
            const isBust = nextScore > 21;

            if (reservation.recipient === 'player') {
                set({
                    playerHand: nextHand,
                    playerScore: nextScore,
                    phase: isBust ? 'dealerTurn' : 'playerTurn',
                });
            } else {
                set({
                    dealerHand: nextHand,
                    dealerScore: nextScore,
                });
            }

            return actionOk({ isBust });
        },

        startDealerTurn: () => {
            const { phase } = get();
            if (phase !== 'playerTurn') return actionError(`Dealer turn cannot start during "${phase}" phase.`);

            set({ phase: 'dealerTurn' });
            return actionOk(null);
        },

        revealDealerHiddenCard: () => {
            const { phase, dealerHand } = get();
            if (phase !== 'dealerTurn') return actionError(`Dealer hidden card cannot reveal during "${phase}" phase.`);
            if (dealerHand.length < defaultHandSlotCount) return actionError('Dealer hidden card is missing.');

            const nextDealerHand = dealerHand.map((card, index) => {
                if (index !== 1) return card;
                return { ...card, isFlipped: true };
            });

            set({
                dealerHand: nextDealerHand,
                dealerScore: calculateScore(nextDealerHand),
            });

            return actionOk(null);
        },

        finishDealerTurn: () => {
            const { phase } = get();
            if (phase !== 'dealerTurn') return actionError(`Dealer turn cannot finish during "${phase}" phase.`);

            set({ phase: 'roundEnd' });
            return actionOk(null);
        },

        newRound: () => {
            const { phase } = get();
            if (phase !== 'roundEnd') return actionError(`New round is not allowed during "${phase}" phase.`);

            const newPool = buildDeck();

            set({
                phase: 'idle',
                playerHand: [],
                dealerHand: [],
                playerScore: 0,
                dealerScore: 0,
                pool: newPool,
            });

            logDeckRemaining(newPool);

            return actionOk(null);
        },

        resetGame: () => {
            const newPool = buildDeck();

            logGameReset();

            set({
                phase: 'idle',
                playerHand: [],
                dealerHand: [],
                playerScore: 0,
                dealerScore: 0,
                pool: newPool,
            });

            logDeckRemaining(newPool);
        },
    };
});
