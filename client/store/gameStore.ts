import { create } from 'zustand';

import {
    buildDeck,
    isFlippedAfterFly,
    resolveSlotPosition,
    takeCardsFromPool,
} from '@/client/components/Table/helpers.functions';
import { deckAnimation, defaultHandSlotCount } from '@/client/utils/constants';
import { calculateScore, generateId, logDeckRemaining, logEntitiesCleared } from '@/client/utils/functions';
import type { CardEntity, CardPosition, FrontCard, FullCard, GamePhase } from '@/client/utils/types';

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
    completeHit: (entityId: string) => void;
    completeEntityAnimation: (entityId: string) => void;
    requestHit: () => void;
    stand: () => void;
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

    completeHit: (entityId: string) => {
        const { entities, playerHand } = get();
        if (entities.length === 0) return;

        const entity = entities.find(entity => entity.id === entityId);
        if (!entity) return;

        const newHand = [...playerHand, { ...entity.card, isFlipped: true }];

        set({
            playerHand: newHand,
            playerScore: calculateScore(newHand),
            phase: 'playerTurn',
        });
    },

    completeEntityAnimation: (entityId: string) => {
        const { phase, entities } = get();

        if (phase === 'dealing') {
            completedDealFlies.add(entityId);
            const dealEntityCount = entities.filter(entity => entity.origin === 'deal').length;
            if (completedDealFlies.size === dealEntityCount && dealEntityCount > 0) {
                completedDealFlies.clear();
                get().completeDeal();
            }
        } else if (phase === 'hitAnimating') {
            get().completeHit(entityId);
        }
    },

    requestHit: () => {
        const { phase, playerHand, playerPositions, pool } = get();

        if (phase !== 'playerTurn') return;
        if (pool.length === 0) return;

        const slotIndex = playerHand.length;
        const target = resolveSlotPosition(playerPositions, slotIndex);
        if (!target) return;

        const { pickedCards, remainingCards } = takeCardsFromPool(pool, 1);
        const card = pickedCards[0];
        if (!card) return;

        const entity: CardEntity = {
            id: generateId(),
            card: { ...card, isFlipped: false },
            origin: 'hit',
            recipient: 'player',
            slotIndex,
            targetPosition: target,
            animationChannel: 0,
        };

        set({ entities: [...get().entities, entity], pool: remainingCards, phase: 'hitAnimating' });

        // logs
        logDeckRemaining(remainingCards);
    },

    stand: () => {
        const { phase, dealerHand, entities } = get();
        if (phase !== 'playerTurn') return;

        const updatedDealerHand = dealerHand.map((card, i) => (i === 1 ? { ...card, isFlipped: true } : card));

        const updatedEntities = entities.map(entity =>
            entity.recipient === 'dealer' && entity.slotIndex === 1
                ? { ...entity, card: { ...entity.card, isFlipped: true } }
                : entity,
        );

        set({ dealerHand: updatedDealerHand, entities: updatedEntities, phase: 'roundEnd' });
    },

    newRound: () => {
        if (get().phase !== 'roundEnd') return;
        set({ playerHand: [], dealerHand: [], playerScore: 0, dealerScore: 0, entities: [], phase: 'idle' });
    },

    setDealerPositions: (positions: CardPosition[]) => set({ dealerPositions: positions }),
    setPlayerPositions: (positions: CardPosition[]) => set({ playerPositions: positions }),
    setDeckPosition: (position: CardPosition) => set({ deckPosition: position }),
}));
