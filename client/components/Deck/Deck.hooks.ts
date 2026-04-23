import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { Easing, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import {
    cardStyles,
    deckAnimation,
    deckStackOffset,
    defaultHandSlotCount,
    handCardsRowGap,
} from '@/client/utils/constants';
import type {
    CardPosition,
    DealFlightMotion,
    DeckFlyingCardItem,
    DeckPosRef,
    FlightSchedulingHandles,
    FullCard,
    HitRecipient,
    HitRequest,
    PoolRef,
    UniqueIdRef,
} from '@/client/utils/types';

import {
    clearFlightScheduling,
    pickRandomCards,
    resolveSlotPosition,
    runNextFrameAndAfterDelay,
} from './helpers.functions';

const { duration: animDuration, sequenceInterval, flyingCardCount, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

/** Matches `styles.stackCard3` in `Deck.tsx` — top card of the stack (flight origin). */
const deckTopCardOriginInset = deckStackOffset * 2;

export function useDealFlightMotion(): DealFlightMotion {
    const flightXToDealerFirst = useSharedValue(deckTopCardOriginInset);
    const flightYToDealerFirst = useSharedValue(deckTopCardOriginInset);
    const flightXToDealerSecond = useSharedValue(deckTopCardOriginInset);
    const flightYToDealerSecond = useSharedValue(deckTopCardOriginInset);
    const flightXToPlayerFirst = useSharedValue(deckTopCardOriginInset);
    const flightYToPlayerFirst = useSharedValue(deckTopCardOriginInset);
    const flightXToPlayerSecond = useSharedValue(deckTopCardOriginInset);
    const flightYToPlayerSecond = useSharedValue(deckTopCardOriginInset);

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

        const picked = pickRandomCards(poolRef.current, flyingCardCount);
        poolRef.current = poolRef.current.filter(c => !picked.some(p => p.rank === c.rank && p.suit === c.suit));

        const id = ++uniqueId.current;
        const cardItems = picked.map((card, i) => ({ id: id + i, card, targetIndex: i }));
        setFlyingCards(cardItems);

        const scheduling: FlightSchedulingHandles = { rafId: null, timeoutId: null };
        const totalDelay = flyingCardCount * sequenceInterval + animDuration;

        runNextFrameAndAfterDelay(
            scheduling,
            totalDelay,
            () => {
                for (let i = 0; i < flyingCardCount; i++) {
                    const targetX = targets[i].x - deckPos.current.x;
                    const targetY = targets[i].y - deckPos.current.y;
                    const delay = i * sequenceInterval;

                    translateXRefs[i].value = withDelay(delay, withTiming(targetX, { duration: animDuration, easing }));
                    translateYRefs[i].value = withDelay(delay, withTiming(targetY, { duration: animDuration, easing }));
                }
            },
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

        return () => clearFlightScheduling(scheduling);
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

        const picked = pickRandomCards(poolRef.current, 1)[0];
        if (!picked) return;
        poolRef.current = poolRef.current.filter(c => !(c.rank === picked.rank && c.suit === picked.suit));

        const flyId = ++uniqueId.current;
        setFlyingCards([{ id: flyId, card: picked, targetIndex: 0 }]);

        const recipient = hitRequest.recipient;
        const scheduling: FlightSchedulingHandles = { rafId: null, timeoutId: null };

        runNextFrameAndAfterDelay(
            scheduling,
            animDuration,
            () => {
                const targetX = target.x - deckPos.current.x;
                const targetY = target.y - deckPos.current.y;

                translateXRefs[0].value = withTiming(targetX, { duration: animDuration, easing });
                translateYRefs[0].value = withTiming(targetY, { duration: animDuration, easing });
            },
            () => {
                setFlyingCards([]);
                translateXRefs[0].value = deckTopCardOriginInset;
                translateYRefs[0].value = deckTopCardOriginInset;
                onHitComplete(recipient, { ...picked, isFlipped: true });
            },
        );

        return () => clearFlightScheduling(scheduling);
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
