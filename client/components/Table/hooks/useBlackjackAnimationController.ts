import { useCallback, useRef, useState } from 'react';

import { useGameStore } from '@/client/store';

import {
    createHitVisualCard,
    createInitialDealVisualCards,
    getInitialDealFaceUpCardIds,
    warnTableActionError,
} from '../functions/visualCard.functions';
import type { BlackjackAnimationControllerParams, TableAnimationActions, TableFlyResolverMap, TableVisualCard } from '../types/table.types';
import { getInitialLayoutError } from './useTableLayout';

export function useBlackjackAnimationController({
    layoutRef,
    onInteractionLockedChange,
}: BlackjackAnimationControllerParams): TableAnimationActions & {
    visualCards: TableVisualCard[];
    isInteractionLocked: boolean;
    handleFlyEnd: (cardId: string) => void;
    handleFlipEnd: (cardId: string) => void;
} {
    const operationIdRef = useRef(0);
    const visualCardsRef = useRef<TableVisualCard[]>([]);
    const isInteractionLockedRef = useRef(false);
    const flyResolversRef = useRef<TableFlyResolverMap>(new Map());
    const flipResolversRef = useRef<TableFlyResolverMap>(new Map());

    const [visualCards, setVisualCardsState] = useState<TableVisualCard[]>([]);
    const [isInteractionLocked, setIsInteractionLockedState] = useState(false);

    const setVisualCards = useCallback((update: TableVisualCard[] | ((cards: TableVisualCard[]) => TableVisualCard[])) => {
        setVisualCardsState(currentCards => {
            const nextCards = typeof update === 'function' ? update(currentCards) : update;
            visualCardsRef.current = nextCards;
            return nextCards;
        });
    }, []);

    const setInteractionLocked = useCallback(
        (isLocked: boolean) => {
            isInteractionLockedRef.current = isLocked;
            setIsInteractionLockedState(isLocked);
            onInteractionLockedChange?.(isLocked);
        },
        [onInteractionLockedChange],
    );

    const waitForFly = useCallback((cardId: string) => {
        return new Promise<void>(resolve => {
            flyResolversRef.current.set(cardId, resolve);
        });
    }, []);

    const waitForFlip = useCallback((cardId: string) => {
        return new Promise<void>(resolve => {
            flipResolversRef.current.set(cardId, resolve);
        });
    }, []);

    const resolveAndClear = useCallback((resolverMap: TableFlyResolverMap, cardId: string) => {
        const resolver = resolverMap.get(cardId);
        if (!resolver) return;

        resolver();
        resolverMap.delete(cardId);
    }, []);

    const resolveAllPendingAnimations = useCallback(() => {
        flyResolversRef.current.forEach(resolve => resolve());
        flipResolversRef.current.forEach(resolve => resolve());
        flyResolversRef.current.clear();
        flipResolversRef.current.clear();
    }, []);

    const cancelActiveOperation = useCallback(() => {
        operationIdRef.current++;
        resolveAllPendingAnimations();
        setInteractionLocked(false);
    }, [resolveAllPendingAnimations, setInteractionLocked]);

    const settleCards = useCallback(
        (cardIds: string[]) => {
            const cardIdSet = new Set(cardIds);

            setVisualCards(cards =>
                cards.map(card => {
                    if (!cardIdSet.has(card.id)) return card;
                    return { ...card, layoutMode: 'settled' };
                }),
            );
        },
        [setVisualCards],
    );

    const flipCards = useCallback(
        async (operationId: number, cardIds: string[]) => {
            const flipPromises = cardIds.map(cardId => waitForFlip(cardId));
            const cardIdSet = new Set(cardIds);

            setVisualCards(cards =>
                cards.map(card => {
                    if (!cardIdSet.has(card.id)) return card;
                    return { ...card, card: { ...card.card, isFlipped: true } };
                }),
            );

            await Promise.all(flipPromises);
            return operationIdRef.current === operationId;
        },
        [setVisualCards, waitForFlip],
    );

    const addAndFlyCards = useCallback(
        async (operationId: number, cards: TableVisualCard[]) => {
            const flyPromises = cards.map(card => waitForFly(card.id));
            setVisualCards(currentCards => [...currentCards, ...cards]);

            await Promise.all(flyPromises);
            if (operationIdRef.current !== operationId) return false;

            settleCards(cards.map(card => card.id));
            return true;
        },
        [setVisualCards, settleCards, waitForFly],
    );

    const runDealerSequence = useCallback(
        async (operationId: number) => {
            const dealerHiddenCard = visualCardsRef.current.find(card => card.recipient === 'dealer' && card.slotIndex === 1);
            if (!dealerHiddenCard) {
                warnTableActionError('Dealer hidden visual card is missing.');
                return false;
            }

            const didReveal = await flipCards(operationId, [dealerHiddenCard.id]);
            if (!didReveal) return false;

            const revealResult = useGameStore.getState().revealDealerHiddenCard();
            if (!revealResult.ok) {
                warnTableActionError(revealResult.reason);
                return false;
            }

            while (useGameStore.getState().dealerScore < 17) {
                const layoutSnapshot = layoutRef.current;
                const layoutError = getInitialLayoutError(layoutSnapshot);
                if (layoutError) {
                    warnTableActionError(layoutError);
                    return false;
                }

                const reservation = useGameStore.getState().reserveHit('dealer');
                if (!reservation.ok) {
                    warnTableActionError(reservation.reason);
                    return false;
                }

                const visualCard = createHitVisualCard(reservation.value, layoutSnapshot);
                if (!visualCard) {
                    warnTableActionError('Dealer hit target layout is missing.');
                    return false;
                }

                const didFly = await addAndFlyCards(operationId, [visualCard]);
                if (!didFly) return false;

                const didFlip = await flipCards(operationId, [visualCard.id]);
                if (!didFlip) return false;

                const commitResult = useGameStore.getState().commitHit(reservation.value);
                if (!commitResult.ok) {
                    warnTableActionError(commitResult.reason);
                    return false;
                }
            }

            const finishResult = useGameStore.getState().finishDealerTurn();
            if (!finishResult.ok) {
                warnTableActionError(finishResult.reason);
                return false;
            }

            return true;
        },
        [addAndFlyCards, flipCards, layoutRef],
    );

    const runExclusiveOperation = useCallback(
        (operation: (operationId: number) => Promise<void>) => {
            if (isInteractionLockedRef.current) return;

            const operationId = operationIdRef.current + 1;
            operationIdRef.current = operationId;
            setInteractionLocked(true);

            void operation(operationId).then(() => {
                if (operationIdRef.current === operationId) {
                    setInteractionLocked(false);
                }
            });
        },
        [setInteractionLocked],
    );

    const dealInitialCards = useCallback(() => {
        runExclusiveOperation(async operationId => {
            const layoutSnapshot = layoutRef.current;
            const layoutError = getInitialLayoutError(layoutSnapshot);
            if (layoutError) {
                warnTableActionError(layoutError);
                return;
            }

            const reservation = useGameStore.getState().reserveInitialDeal();
            if (!reservation.ok) {
                warnTableActionError(reservation.reason);
                return;
            }

            const cards = createInitialDealVisualCards(reservation.value, layoutSnapshot);
            if (!cards) {
                warnTableActionError('Initial deal target layout is missing.');
                return;
            }

            const didFly = await addAndFlyCards(operationId, cards);
            if (!didFly) return;

            const didFlip = await flipCards(operationId, getInitialDealFaceUpCardIds(cards));
            if (!didFlip) return;

            const commitResult = useGameStore.getState().commitInitialDeal(reservation.value);
            if (!commitResult.ok) {
                warnTableActionError(commitResult.reason);
            }
        });
    }, [addAndFlyCards, flipCards, layoutRef, runExclusiveOperation]);

    const hitPlayer = useCallback(() => {
        runExclusiveOperation(async operationId => {
            const layoutSnapshot = layoutRef.current;
            const layoutError = getInitialLayoutError(layoutSnapshot);
            if (layoutError) {
                warnTableActionError(layoutError);
                return;
            }

            const reservation = useGameStore.getState().reserveHit('player');
            if (!reservation.ok) {
                warnTableActionError(reservation.reason);
                return;
            }

            const visualCard = createHitVisualCard(reservation.value, layoutSnapshot);
            if (!visualCard) {
                warnTableActionError('Player hit target layout is missing.');
                return;
            }

            const didFly = await addAndFlyCards(operationId, [visualCard]);
            if (!didFly) return;

            const didFlip = await flipCards(operationId, [visualCard.id]);
            if (!didFlip) return;

            const commitResult = useGameStore.getState().commitHit(reservation.value);
            if (!commitResult.ok) {
                warnTableActionError(commitResult.reason);
                return;
            }

            if (commitResult.value.isBust) {
                await runDealerSequence(operationId);
            }
        });
    }, [addAndFlyCards, flipCards, layoutRef, runDealerSequence, runExclusiveOperation]);

    const stand = useCallback(() => {
        runExclusiveOperation(async operationId => {
            const startDealerTurnResult = useGameStore.getState().startDealerTurn();
            if (!startDealerTurnResult.ok) {
                warnTableActionError(startDealerTurnResult.reason);
                return;
            }

            await runDealerSequence(operationId);
        });
    }, [runDealerSequence, runExclusiveOperation]);

    const newRound = useCallback(() => {
        if (isInteractionLockedRef.current) return;

        const result = useGameStore.getState().newRound();
        if (!result.ok) {
            warnTableActionError(result.reason);
            return;
        }

        cancelActiveOperation();
        setVisualCards([]);
    }, [cancelActiveOperation, setVisualCards]);

    const resetTable = useCallback(() => {
        cancelActiveOperation();
        setVisualCards([]);
    }, [cancelActiveOperation, setVisualCards]);

    const handleFlyEnd = useCallback(
        (cardId: string) => {
            resolveAndClear(flyResolversRef.current, cardId);
        },
        [resolveAndClear],
    );

    const handleFlipEnd = useCallback(
        (cardId: string) => {
            resolveAndClear(flipResolversRef.current, cardId);
        },
        [resolveAndClear],
    );

    return {
        visualCards,
        isInteractionLocked,
        dealInitialCards,
        hitPlayer,
        stand,
        newRound,
        resetTable,
        handleFlyEnd,
        handleFlipEnd,
    };
}
