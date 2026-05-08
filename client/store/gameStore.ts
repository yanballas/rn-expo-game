import { create } from 'zustand';

import { buildDeck, isFlippedAfterFly, resolveSlotPosition, takeCardsFromPool } from '@/client/components/Table/helpers.functions';
import { deckAnimation, defaultHandSlotCount } from '@/client/utils/constants';
import { calculateScore, generateId, logDeckRemaining, logEntitiesCleared } from '@/client/utils/functions';
import type { CardEntity, CardPosition, FrontCard, FullCard, GamePhase, Recipient } from '@/client/utils/types';

const { flyingCardCount } = deckAnimation;
const completedDealFlies = new Set<string>();

interface GameStore {
    phase: GamePhase;
    playerHand: FullCard[];
    dealerHand: FullCard[];
    playerScore: number;
    dealerScore: number;
    entities: CardEntity[];
    pool: FrontCard[];
    dealerPositions: CardPosition[];
    playerPositions: CardPosition[];
    deckPosition: CardPosition;

    startDeal: () => void;
    completeDeal: () => void;
    completeCard: (entityId: string, recipient: Recipient) => void;
    completeEntityAnimation: (entityId: string, recipient: Recipient) => void;
    requestCard: (recipient: Recipient) => void;
    stand: () => void;
    continueDealerTurn: (score: number) => void;
    showDealerHiddenCard: () => void;
    endDealerTurn: () => void;
    newRound: () => void;

    setDealerPositions: (positions: CardPosition[]) => void;
    setPlayerPositions: (positions: CardPosition[]) => void;
    setDeckPosition: (position: CardPosition) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
    phase: 'idle',
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    entities: [],
    pool: buildDeck(),
    dealerPositions: [],
    playerPositions: [],
    deckPosition: { x: 0, y: 0 },

    startDeal: () => {
        const { phase, dealerPositions, playerPositions, pool, entities } = get();

        if (phase !== 'idle') return;

        //logs
        if (entities.length > 0) logEntitiesCleared();

        const targets: CardPosition[] = [
            ...dealerPositions.slice(0, defaultHandSlotCount),
            ...playerPositions.slice(0, defaultHandSlotCount),
        ];

        const { pickedCards, remainingCards } = takeCardsFromPool(pool, flyingCardCount);

        const dealerCards = pickedCards.slice(0, defaultHandSlotCount);
        const playerCards = pickedCards.slice(defaultHandSlotCount);

        const dealerEntities: CardEntity[] = dealerCards.map((card, i) => ({
            id: generateId(),
            card: { ...card, isFlipped: false },
            origin: 'deal',
            recipient: 'dealer',
            slotIndex: i,
            targetPosition: targets[i],
            animationChannel: i,
        }));

        const playerEntities: CardEntity[] = playerCards.map((card, i) => ({
            id: generateId(),
            card: { ...card, isFlipped: false },
            origin: 'deal',
            recipient: 'player',
            slotIndex: i,
            targetPosition: targets[i + defaultHandSlotCount],
            animationChannel: i + defaultHandSlotCount,
        }));

        const newEntities = [...dealerEntities, ...playerEntities];

        set({ entities: newEntities, pool: remainingCards, phase: 'dealing' });

        //logs
        logDeckRemaining(remainingCards);
    },

    completeDeal: () => {
        const { entities } = get();
        const dealEntities = entities.filter(entity => entity.origin === 'deal');

        const dealerCards = dealEntities
            .filter(entity => entity.recipient === 'dealer')
            .map(entity => ({ ...entity.card, isFlipped: isFlippedAfterFly(entity) }));

        const playerCards = dealEntities
            .filter(entity => entity.recipient === 'player')
            .map(entity => ({ ...entity.card, isFlipped: isFlippedAfterFly(entity) }));

        set({
            dealerHand: dealerCards,
            playerHand: playerCards,
            dealerScore: calculateScore(dealerCards),
            playerScore: calculateScore(playerCards),
            phase: 'playerTurn',
        });
    },

    completeCard: (entityId: string, recipient: Recipient) => {
        const { phase, entities, playerHand, dealerHand, dealerScore, showDealerHiddenCard, continueDealerTurn } = get();
        if (entities.length === 0) return;

        const entity = entities.find(entity => entity.id === entityId);
        if (!entity) return;

        const isPlayer = recipient === 'player';
        const hand = isPlayer ? playerHand : dealerHand;

        const newHand = [...hand, { ...entity.card, isFlipped: true }];
        const newScore = calculateScore(newHand);

        if (isPlayer) {
            set({ playerHand: newHand, playerScore: newScore });
        } else {
            set({ dealerHand: newHand, dealerScore: newScore });
        }

        if (phase === 'hitAnimating') {
            if (newScore <= 21) {
                set({ phase: 'playerTurn' });
                return;
            }

            showDealerHiddenCard();
            set({ phase: 'dealerTurn' });
            continueDealerTurn(dealerScore);
            return;
        }

        if (phase === 'dealerTurn') {
            continueDealerTurn(newScore);
        }
    },

    completeEntityAnimation: (entityId: string, recipient: Recipient) => {
        const { phase, entities, completeDeal, completeCard } = get();

        if (phase === 'dealing') {
            completedDealFlies.add(entityId);
            const dealEntityCount = entities.filter(entity => entity.origin === 'deal').length;
            if (completedDealFlies.size === dealEntityCount && dealEntityCount > 0) {
                completedDealFlies.clear();
                completeDeal();
            }
            return;
        }

        const isCardCompletionPhase = phase === 'hitAnimating' || phase === 'dealerTurn';
        if (isCardCompletionPhase) {
            completeCard(entityId, recipient);
        }
    },

    requestCard: (recipient: Recipient) => {
        const { phase, playerHand, dealerHand, playerPositions, dealerPositions, pool, entities } = get();

        if (recipient === 'player' && phase !== 'playerTurn') return;
        if (recipient === 'dealer' && phase !== 'dealerTurn') return;
        if (pool.length === 0) return;

        let hand: typeof playerHand;
        let positions: typeof playerPositions;
        let nextPhase: typeof phase;

        if (recipient === 'player') {
            hand = playerHand;
            positions = playerPositions;
            nextPhase = 'hitAnimating';
        } else {
            hand = dealerHand;
            positions = dealerPositions;
            nextPhase = 'dealerTurn';
        }

        const slotIndex = hand.length;

        const target = resolveSlotPosition(positions, slotIndex);
        if (!target) return;

        const { pickedCards, remainingCards } = takeCardsFromPool(pool, 1);
        const card = pickedCards[0];
        if (!card) return;

        const entity: CardEntity = {
            id: generateId(),
            card: { ...card, isFlipped: false },
            origin: 'hit',
            recipient,
            slotIndex,
            targetPosition: target,
            animationChannel: 0,
        };

        set({
            entities: [...entities, entity],
            pool: remainingCards,
            phase: nextPhase,
        });

        // logs
        logDeckRemaining(remainingCards);
    },

    stand: () => {
        const { phase, dealerScore, showDealerHiddenCard, continueDealerTurn } = get();
        if (phase !== 'playerTurn') return;

        showDealerHiddenCard();
        set({ phase: 'dealerTurn' });
        continueDealerTurn(dealerScore);
    },

    continueDealerTurn: (score: number) => {
        const { requestCard, endDealerTurn } = get();

        if (score >= 17) {
            endDealerTurn();
        } else {
            requestCard('dealer');
        }
    },

    showDealerHiddenCard: () => {
        const { dealerHand, entities } = get();

        const updatedDealerHand = dealerHand.map((dealerCard, cardIndex) => {
            const isDealerSecondCard = cardIndex === 1;
            if (!isDealerSecondCard) return dealerCard;
            return { ...dealerCard, isFlipped: true };
        });

        const updatedEntities = entities.map(cardEntity => {
            const shouldFlipDealerSecondCard = cardEntity.recipient === 'dealer' && cardEntity.slotIndex === 1;
            if (!shouldFlipDealerSecondCard) return cardEntity;
            return { ...cardEntity, card: { ...cardEntity.card, isFlipped: true } };
        });

        set({ dealerHand: updatedDealerHand, entities: updatedEntities });
    },

    endDealerTurn: () => {
        set({ phase: 'roundEnd' });
    },

    newRound: () => {
        const { phase, entities } = get();
        if (phase !== 'roundEnd') return;

        const newPool = buildDeck();
        completedDealFlies.clear();

        // logs
        if (entities.length > 0) logEntitiesCleared();

        set({
            playerHand: [],
            dealerHand: [],
            playerScore: 0,
            dealerScore: 0,
            entities: [],
            pool: newPool,
            phase: 'idle',
        });

        // logs
        logDeckRemaining(newPool);
    },

    setDealerPositions: (positions: CardPosition[]) => set({ dealerPositions: positions }),
    setPlayerPositions: (positions: CardPosition[]) => set({ playerPositions: positions }),
    setDeckPosition: (position: CardPosition) => set({ deckPosition: position }),
}));
