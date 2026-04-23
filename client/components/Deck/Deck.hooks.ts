import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { Easing, useSharedValue } from 'react-native-reanimated';

import {
    cardStyles,
    deckAnimation,
    deckTopCardOriginInset,
    defaultHandSlotCount,
    handCardsRowGap,
} from '@/client/utils/constants';
import type {
    CardPosition,
    DealFlightMotion,
    DeckFlyingCardItem,
    DeckPosRef,
    FullCard,
    HitRecipient,
    HitRequest,
    PoolRef,
    UniqueIdRef,
} from '@/client/utils/types';

import { animateCardFlight, resolveSlotPosition, takeRandomCardsFromPool } from './helpers.functions';

const { duration: animDuration, sequenceInterval, flyingCardCount, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

/**
 * Хранит «движок» анимации полёта карт из колоды: восемь `SharedValue` (четыре карты × ось X и Y),
 * сгруппированные в массивы `translateXRefs` / `translateYRefs`. Индексы 0–3 совпадают с порядком
 * раздачи (две карты дилера, две игрока). Значения — смещение от верхней карты колоды до цели;
 * старт совпадает с `deckTopCardOriginInset`, чтобы летающая карта лежала на стопке до анимации.
 * Массивы обёрнуты в `useRef`, чтобы ссылки не менялись между рендерами и эффекты могли
 * безопасно зависеть от них. `reset` сбрасывает первые `flyingCardCount` каналов в эту стартовую
 * точку после раздачи или перед следующим полётом.
 */
export function useDealFlightMotion(): DealFlightMotion {
    const flightXToDealerFirst = useSharedValue(deckTopCardOriginInset);
    const flightYToDealerFirst = useSharedValue(deckTopCardOriginInset);
    const flightXToDealerSecond = useSharedValue(deckTopCardOriginInset);
    const flightYToDealerSecond = useSharedValue(deckTopCardOriginInset);
    const flightXToPlayerFirst = useSharedValue(deckTopCardOriginInset);
    const flightYToPlayerFirst = useSharedValue(deckTopCardOriginInset);
    const flightXToPlayerSecond = useSharedValue(deckTopCardOriginInset);
    const flightYToPlayerSecond = useSharedValue(deckTopCardOriginInset);

    // Slot index → target mapping:
    //   0 = dealer 1st card, 1 = dealer 2nd card
    //   2 = player 1st card, 3 = player 2nd card
    const translateXRefs = useRef([
        flightXToDealerFirst,
        flightXToDealerSecond,
        flightXToPlayerFirst,
        flightXToPlayerSecond,
    ]).current;
    const translateYRefs = useRef([
        flightYToDealerFirst,
        flightYToDealerSecond,
        flightYToPlayerFirst,
        flightYToPlayerSecond,
    ]).current;

    const reset = useCallback(() => {
        for (let i = 0; i < flyingCardCount; i++) {
            translateXRefs[i].value = deckTopCardOriginInset;
            translateYRefs[i].value = deckTopCardOriginInset;
        }
    }, [translateXRefs, translateYRefs]);

    return { translateXRefs, translateYRefs, reset };
}

/** При старте раздачи: карты из пула, полёт к слотам дилера/игрока, затем `onDealComplete`. */
export function useDealFromDeck({
    isDealing,
    deckReady,
    dealerPositions,
    playerPositions,
    deckPos,
    poolRef,
    uniqueId,
    setFlyingCards,
    flightMotion,
    onDealComplete,
}: {
    isDealing: boolean;
    deckReady: boolean;
    dealerPositions: CardPosition[];
    playerPositions: CardPosition[];
    deckPos: DeckPosRef;
    poolRef: PoolRef;
    uniqueId: UniqueIdRef;
    setFlyingCards: Dispatch<SetStateAction<DeckFlyingCardItem[]>>;
    flightMotion: DealFlightMotion;
    onDealComplete: (dealerCards: FullCard[], playerCards: FullCard[]) => void;
}) {
    const { translateXRefs, translateYRefs, reset: resetCards } = flightMotion;

    useEffect(() => {
        if (!isDealing || !deckReady) return;
        if (dealerPositions.length < defaultHandSlotCount || playerPositions.length < defaultHandSlotCount) {
            return;
        }

        const targets: CardPosition[] = [
            ...dealerPositions.slice(0, defaultHandSlotCount),
            ...playerPositions.slice(0, defaultHandSlotCount),
        ];

        const { picked, remaining } = takeRandomCardsFromPool(poolRef.current, flyingCardCount);
        poolRef.current = remaining;

        const id = ++uniqueId.current;
        setFlyingCards(picked.map((card, i) => ({ id: id + i, card, targetIndex: i })));

        return animateCardFlight(
            targets,
            deckPos.current,
            translateXRefs,
            translateYRefs,
            { interval: sequenceInterval, duration: animDuration, easing },
            () => {
                const dealerCards: FullCard[] = picked.slice(0, defaultHandSlotCount).map(c => ({
                    ...c,
                    isFlipped: true,
                }));
                const playerCards: FullCard[] = picked.slice(defaultHandSlotCount, flyingCardCount).map(c => ({
                    ...c,
                    isFlipped: true,
                }));
                setFlyingCards([]);
                resetCards();
                onDealComplete(dealerCards, playerCards);
            },
        );
    }, [
        isDealing,
        deckReady,
        dealerPositions,
        playerPositions,
        deckPos,
        poolRef,
        uniqueId,
        setFlyingCards,
        onDealComplete,
        resetCards,
        translateXRefs,
        translateYRefs,
    ]);
}

/** По `hitRequest`: одна карта из колоды в слот игрока или дилера, затем `onHitComplete`. */
export function useHitCardFlight({
    hitRequest,
    deckReady,
    isDealing,
    dealerPositions,
    playerPositions,
    deckPos,
    poolRef,
    uniqueId,
    setFlyingCards,
    flightMotion,
    onHitComplete,
}: {
    hitRequest: HitRequest | null;
    deckReady: boolean;
    isDealing: boolean;
    dealerPositions: CardPosition[];
    playerPositions: CardPosition[];
    deckPos: DeckPosRef;
    poolRef: PoolRef;
    uniqueId: UniqueIdRef;
    setFlyingCards: Dispatch<SetStateAction<DeckFlyingCardItem[]>>;
    flightMotion: DealFlightMotion;
    onHitComplete: (recipient: HitRecipient, card: FullCard) => void;
}) {
    const { translateXRefs, translateYRefs } = flightMotion;

    useEffect(() => {
        if (!hitRequest || !deckReady || isDealing) return;

        const positions = hitRequest.recipient === 'player' ? playerPositions : dealerPositions;
        const target = resolveSlotPosition(positions, hitRequest.slotIndex, cardStyles.width, handCardsRowGap);
        if (!target) return;

        const { picked, remaining } = takeRandomCardsFromPool(poolRef.current, 1);
        poolRef.current = remaining;
        const card = picked[0];
        if (!card) return;

        const flyId = ++uniqueId.current;
        // targetIndex: 0 — после раздачи все 4 канала сброшены resetCards(),
        // channel 0 гарантированно свободен и не конфликтует с раздачей
        setFlyingCards([{ id: flyId, card, targetIndex: 0 }]);

        return animateCardFlight(
            [target],
            deckPos.current,
            [translateXRefs[0]],
            [translateYRefs[0]],
            { interval: 0, duration: animDuration, easing },
            () => {
                setFlyingCards([]);
                translateXRefs[0].value = deckTopCardOriginInset;
                translateYRefs[0].value = deckTopCardOriginInset;
                onHitComplete(hitRequest.recipient, { ...card, isFlipped: true });
            },
        );
    }, [
        hitRequest,
        deckReady,
        isDealing,
        dealerPositions,
        playerPositions,
        deckPos,
        poolRef,
        uniqueId,
        setFlyingCards,
        onHitComplete,
        translateXRefs,
        translateYRefs,
    ]);
}
