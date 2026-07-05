import { create } from 'zustand';

import { buildDeck, resolveSlotPosition, takeCardsFromPool } from '@/client/components/Table/helpers.functions';
import { deckAnimation, defaultHandSlotCount } from '@/client/utils/constants';
import {
    calculateScore,
    cancelRunningAnimation,
    generateId,
    notifyNextDealerCard,
    runAsync,
    waitForFlip,
    waitForFly,
    waitForNextDealerCard,
} from '@/client/utils/functions';
import { logDeckRemaining, logEntitiesCleared, logGameReset } from '@/client/utils/logger';
import type { CardEntity, CardPosition, FrontCard, FullCard, GamePhase, Recipient } from '@/client/utils/types';

const { flyingCardCount } = deckAnimation;

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
    requestCard: (recipient: Recipient) => void;
    stand: () => void;
    showDealerHiddenCard: () => void;
    endDealerTurn: () => void;
    newRound: () => void;

    resetGame: () => void;
    setDealerPositions: (positions: CardPosition[]) => void;
    setPlayerPositions: (positions: CardPosition[]) => void;
    setDeckPosition: (position: CardPosition) => void;
}

export const useGameStore = create<GameStore>()((set, get) => {
    async function landCards(flyIds: string[], flipIds: string[], expectedPhase: GamePhase): Promise<CardEntity[] | null> {
        await Promise.all(flyIds.map(id => waitForFly(id)));

        const { phase: afterFlyPhase, entities: afterFlyEntities } = get();
        if (afterFlyPhase !== expectedPhase) return null;

        const flipIdSet = new Set(flipIds);
        const updatedEntities = afterFlyEntities.map(entity => {
            if (flipIdSet.has(entity.id)) {
                return { ...entity, card: { ...entity.card, isFlipped: true } };
            }
            return entity;
        });
        set({ entities: updatedEntities });

        const { entities: flipEntities } = get();
        const presentFlipIds = flipIds.filter(id => flipEntities.some(e => e.id === id));
        if (presentFlipIds.length > 0) {
            await Promise.all(presentFlipIds.map(id => waitForFlip(id)));
        }

        const { phase: afterFlipPhase, entities: afterFlipEntities } = get();
        if (afterFlipPhase !== expectedPhase) return null;

        return afterFlipEntities;
    }

    async function runDealerTurnAsync() {
        const state = get();
        if (!state) return;
        const { phase: dealerPhase, entities: dealerEntities, showDealerHiddenCard, endDealerTurn, requestCard: reqCard } = state;
        if (dealerPhase !== 'dealerTurn') return;

        try {
            showDealerHiddenCard();

            const holeCard = dealerEntities.find(entity => entity.recipient === 'dealer' && entity.slotIndex === 1);
            if (holeCard) {
                await waitForFlip(holeCard.id);
            }

            while (true) {
                const { phase: holePhase, dealerScore } = get();
                if (holePhase !== 'dealerTurn') return;

                if (dealerScore >= 17) {
                    endDealerTurn();
                    return;
                }
                reqCard('dealer');
                await waitForNextDealerCard();
            }
        } catch (error) {
            console.error('[Dealer Turn Error]', error);
            throw error;
        }
    }

    const initialPool = buildDeck();
    logDeckRemaining(initialPool);

    return {
        phase: 'idle',
        playerHand: [],
        dealerHand: [],
        playerScore: 0,
        dealerScore: 0,
        entities: [],
        pool: initialPool,
        dealerPositions: [],
        playerPositions: [],
        deckPosition: { x: 0, y: 0 },

        startDeal: () => {
            const { phase, entities, pool, dealerPositions, playerPositions } = get();
            if (phase !== 'idle') return;

            if (entities.length > 0) logEntitiesCleared();

            const { pickedCards, remainingCards } = takeCardsFromPool(pool, flyingCardCount);

            const dealerCards = pickedCards.slice(0, defaultHandSlotCount);
            const playerCards = pickedCards.slice(defaultHandSlotCount);

            const dealerEntities: CardEntity[] = [];
            for (let index = 0; index < dealerCards.length; index++) {
                const card = dealerCards[index];
                if (!card) return;

                const targetPosition = resolveSlotPosition(dealerPositions, index);
                if (!targetPosition) return;

                dealerEntities.push({
                    id: generateId(),
                    card: { ...card, isFlipped: false },
                    origin: 'deal',
                    recipient: 'dealer',
                    slotIndex: index,
                    targetPosition,
                    animationChannel: index,
                });
            }

            const playerEntities: CardEntity[] = [];
            for (let index = 0; index < playerCards.length; index++) {
                const card = playerCards[index];
                if (!card) return;

                const targetPosition = resolveSlotPosition(playerPositions, index);
                if (!targetPosition) return;

                playerEntities.push({
                    id: generateId(),
                    card: { ...card, isFlipped: false },
                    origin: 'deal',
                    recipient: 'player',
                    slotIndex: index,
                    targetPosition,
                    animationChannel: index + defaultHandSlotCount,
                });
            }

            const newEntities = [...dealerEntities, ...playerEntities];

            set({ entities: newEntities, pool: remainingCards, phase: 'dealing' });

            logDeckRemaining(remainingCards);

            cancelRunningAnimation();

            runAsync(async () => {
                try {
                    const { phase: dealingPhase } = get();
                    if (dealingPhase !== 'dealing') return;

                    const flyIds = newEntities.map(entity => entity.id);
                    const flipIds = newEntities
                        .filter(entity => entity.recipient === 'player' || (entity.recipient === 'dealer' && entity.slotIndex === 0))
                        .map(entity => entity.id);

                    const afterFlipEntities = await landCards(flyIds, flipIds, 'dealing');
                    if (!afterFlipEntities) return;

                    set({
                        dealerHand: afterFlipEntities.filter(entity => entity.recipient === 'dealer').map(entity => ({ ...entity.card })),
                        playerHand: afterFlipEntities.filter(entity => entity.recipient === 'player').map(entity => ({ ...entity.card })),
                        dealerScore: calculateScore(
                            afterFlipEntities.filter(entity => entity.recipient === 'dealer').map(entity => ({ ...entity.card })),
                        ),
                        playerScore: calculateScore(
                            afterFlipEntities.filter(entity => entity.recipient === 'player').map(entity => ({ ...entity.card })),
                        ),
                        phase: 'playerTurn',
                    });
                } catch (error) {
                    console.error('[Start Deal Error]', error);
                }
            });
        },

        requestCard: (recipient: Recipient) => {
            const { phase, playerHand, dealerHand, playerPositions, dealerPositions, pool } = get();

            if (recipient === 'player' && phase !== 'playerTurn') return;
            if (recipient === 'dealer' && phase !== 'dealerTurn') return;
            if (pool.length === 0) return;

            const hand = recipient === 'player' ? playerHand : dealerHand;
            const positions = recipient === 'player' ? playerPositions : dealerPositions;
            const nextPhase = recipient === 'player' ? 'hitAnimating' : 'dealerTurn';

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

            const { entities: currentEntities } = get();
            set({ entities: [...currentEntities, entity], pool: remainingCards, phase: nextPhase });

            runAsync(async () => {
                try {
                    const afterFlipEntities = await landCards([entity.id], [entity.id], nextPhase);
                    if (!afterFlipEntities) return;

                    logEntitiesCleared();

                    const hand = afterFlipEntities.filter(e => e.recipient === recipient).map(e => ({ ...e.card }));
                    const newScore = calculateScore(hand);

                    if (recipient === 'player') {
                        if (newScore > 21) {
                            set({ playerHand: hand, playerScore: newScore, phase: 'dealerTurn' });
                            runAsync(runDealerTurnAsync);
                        } else {
                            set({ playerHand: hand, playerScore: newScore, phase: 'playerTurn' });
                        }
                    } else {
                        set({ dealerHand: hand, dealerScore: newScore });
                        logDeckRemaining(remainingCards);
                        notifyNextDealerCard();
                    }
                } catch (error) {
                    console.error(`[Request Card Error] ${recipient}:`, error);
                }
            });
        },

        stand: () => {
            const { phase } = get();
            if (phase !== 'playerTurn') return;
            set({ phase: 'dealerTurn' });
            runAsync(runDealerTurnAsync);
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
            cancelRunningAnimation();

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

            logDeckRemaining(newPool);
        },

        resetGame: () => {
            cancelRunningAnimation();
            logGameReset();

            set({
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
            });
        },

        setDealerPositions: (positions: CardPosition[]) => set({ dealerPositions: positions }),
        setPlayerPositions: (positions: CardPosition[]) => set({ playerPositions: positions }),
        setDeckPosition: (position: CardPosition) => set({ deckPosition: position }),
    };
});
