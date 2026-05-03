import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';

import { cardStyles, deckAnimation, defaultHandSlotCount, handCardsRowGap } from '@/client/utils/constants';
import type { CardEntity, CardPosition, HitRequest, PoolRef, UniqueIdRef } from '@/client/utils/types';

import { resolveSlotPosition, takeRandomCardsFromPool } from './helpers.functions';

const { flyingCardCount } = deckAnimation;

export function useDealCards({
    isDealing,
    deckReady,
    dealerPositionsRef,
    playerPositionsRef,
    poolRef,
    uniqueId,
    setEntities,
    onDealStart,
}: {
    isDealing: boolean;
    deckReady: boolean;
    dealerPositionsRef: RefObject<CardPosition[]>;
    playerPositionsRef: RefObject<CardPosition[]>;
    poolRef: PoolRef;
    uniqueId: UniqueIdRef;
    setEntities: Dispatch<SetStateAction<CardEntity[]>>;
    onDealStart?: () => void;
}) {
    useEffect(() => {
        if (!isDealing || !deckReady) return;
        const dealerPositions = dealerPositionsRef.current;
        const playerPositions = playerPositionsRef.current;
        if (!dealerPositions || !playerPositions) return;
        if (dealerPositions.length < defaultHandSlotCount || playerPositions.length < defaultHandSlotCount) {
            return;
        }

        const targets: CardPosition[] = [
            ...dealerPositions.slice(0, defaultHandSlotCount),
            ...playerPositions.slice(0, defaultHandSlotCount),
        ];

        const { picked, remaining } = takeRandomCardsFromPool(poolRef.current, flyingCardCount);
        poolRef.current = remaining;

        const entities: CardEntity[] = picked.map((card, i) => {
            const isDealer = i < defaultHandSlotCount;
            return {
                id: ++uniqueId.current,
                card: { ...card, isFlipped: false },
                origin: 'deal',
                recipient: isDealer ? 'dealer' : 'player',
                slotIndex: isDealer ? i : i - defaultHandSlotCount,
                targetPosition: targets[i],
                animationChannel: i,
            };
        });

        onDealStart?.();
        setEntities(entities);
    }, [isDealing, deckReady, dealerPositionsRef, playerPositionsRef, poolRef, uniqueId, setEntities, onDealStart]);
}

export function useHitCard({
    hitRequest,
    deckReady,
    isDealing,
    dealerPositionsRef,
    playerPositionsRef,
    poolRef,
    uniqueId,
    setEntities,
}: {
    hitRequest: HitRequest | null;
    deckReady: boolean;
    isDealing: boolean;
    dealerPositionsRef: RefObject<CardPosition[]>;
    playerPositionsRef: RefObject<CardPosition[]>;
    poolRef: PoolRef;
    uniqueId: UniqueIdRef;
    setEntities: Dispatch<SetStateAction<CardEntity[]>>;
}) {
    useEffect(() => {
        if (!hitRequest || !deckReady || isDealing) return;

        const positions = hitRequest.recipient === 'player' ? playerPositionsRef.current : dealerPositionsRef.current;
        if (!positions) return;
        const target = resolveSlotPosition(positions, hitRequest.slotIndex, cardStyles.width, handCardsRowGap);
        if (!target) return;

        const { picked, remaining } = takeRandomCardsFromPool(poolRef.current, 1);
        poolRef.current = remaining;
        const card = picked[0];
        if (!card) return;

        const flyId = ++uniqueId.current;
        const entity: CardEntity = {
            id: flyId,
            card: { ...card, isFlipped: false },
            origin: 'hit',
            recipient: hitRequest.recipient,
            slotIndex: hitRequest.slotIndex,
            targetPosition: target,
            animationChannel: 0,
        };

        setEntities(prev => [...prev, entity]);
    }, [hitRequest, deckReady, isDealing, dealerPositionsRef, playerPositionsRef, poolRef, uniqueId, setEntities]);
}
