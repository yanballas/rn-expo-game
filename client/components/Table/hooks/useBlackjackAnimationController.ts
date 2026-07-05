import { useCallback, useRef, useState } from 'react';

import { useGameStore } from '@/client/store';
import { animationWaitTimeoutMarginMs, deckAnimation, flipTransition } from '@/client/utils/constants';

import {
    createHitVisualCard,
    createInitialDealVisualCards,
    getInitialDealFaceUpCardIds,
    warnTableActionError,
} from '../functions/visualCard.functions';
import type {
    TableAnimationResolverMap,
    BlackjackAnimationControllerParams,
    TableAnimationActions,
    TableAnimationWaitResult,
    TableOperationResult,
    TableVisualCard,
} from '../types/table.types';
import { getInitialLayoutError } from './useTableLayout';

function operationOk(): TableOperationResult {
    return { ok: true };
}

function operationError(reason: string): TableOperationResult {
    warnTableActionError(reason);
    return { ok: false, reason };
}

function operationCancelled(): TableOperationResult {
    return { ok: false, isCancelled: true };
}

function getFlyTimeoutMs(card: TableVisualCard): number {
    return card.sequenceIndex * deckAnimation.sequenceInterval + deckAnimation.duration + animationWaitTimeoutMarginMs;
}

function failRoundFromOperation(result: TableOperationResult) {
    if (result.ok || 'isCancelled' in result) return;
    useGameStore.getState().failRound(result.reason);
}

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
    const flyResolversRef = useRef<TableAnimationResolverMap>(new Map());
    const flipResolversRef = useRef<TableAnimationResolverMap>(new Map());

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

    const waitForAnimationEnd = useCallback(({
        cardId,
        resolverMap,
        timeoutMs,
        timeoutReason,
    }: {
        cardId: string;
        resolverMap: TableAnimationResolverMap;
        timeoutMs: number;
        timeoutReason: string;
    }) => {
        return new Promise<TableAnimationWaitResult>(resolve => {
            const timeoutId = setTimeout(() => {
                resolverMap.delete(cardId);
                resolve(operationError(timeoutReason));
            }, timeoutMs);

            resolverMap.set(cardId, result => {
                clearTimeout(timeoutId);
                resolve(result);
            });
        });
    }, []);

    const waitForFly = useCallback(
        (card: TableVisualCard) => waitForAnimationEnd({
            cardId: card.id,
            resolverMap: flyResolversRef.current,
            timeoutMs: getFlyTimeoutMs(card),
            timeoutReason: 'Card fly animation did not complete in time.',
        }),
        [waitForAnimationEnd],
    );

    const waitForFlip = useCallback(
        (cardId: string) => waitForAnimationEnd({
            cardId,
            resolverMap: flipResolversRef.current,
            timeoutMs: flipTransition.duration + animationWaitTimeoutMarginMs,
            timeoutReason: 'Card flip animation did not complete in time.',
        }),
        [waitForAnimationEnd],
    );

    const resolveAndClear = useCallback((resolverMap: TableAnimationResolverMap, cardId: string, result: TableAnimationWaitResult) => {
        const resolver = resolverMap.get(cardId);
        if (!resolver) return;

        resolverMap.delete(cardId);
        resolver(result);
    }, []);

    const resolveAllPendingAnimations = useCallback(() => {
        flyResolversRef.current.forEach(resolve => resolve(operationCancelled()));
        flipResolversRef.current.forEach(resolve => resolve(operationCancelled()));
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
        async (operationId: number, cardIds: string[]): Promise<TableOperationResult> => {
            const flipPromises = cardIds.map(cardId => waitForFlip(cardId));
            const cardIdSet = new Set(cardIds);

            setVisualCards(cards =>
                cards.map(card => {
                    if (!cardIdSet.has(card.id)) return card;
                    return { ...card, card: { ...card.card, isFlipped: true } };
                }),
            );

            const results = await Promise.all(flipPromises);
            const failedResult = results.find(result => !result.ok);
            if (failedResult) return failedResult;
            if (operationIdRef.current !== operationId) return operationCancelled();

            return operationOk();
        },
        [setVisualCards, waitForFlip],
    );

    const addAndFlyCards = useCallback(
        async (operationId: number, cards: TableVisualCard[]): Promise<TableOperationResult> => {
            const flyPromises = cards.map(card => waitForFly(card));
            setVisualCards(currentCards => [...currentCards, ...cards]);

            const results = await Promise.all(flyPromises);
            const failedResult = results.find(result => !result.ok);
            if (failedResult) return failedResult;
            if (operationIdRef.current !== operationId) return operationCancelled();

            settleCards(cards.map(card => card.id));
            return operationOk();
        },
        [setVisualCards, settleCards, waitForFly],
    );

    const runDealerSequence = useCallback(
        async (operationId: number): Promise<TableOperationResult> => {
            const dealerHiddenCard = visualCardsRef.current.find(card => card.recipient === 'dealer' && card.slotIndex === 1);
            if (!dealerHiddenCard) {
                return operationError('Dealer hidden visual card is missing.');
            }

            const revealAnimationResult = await flipCards(operationId, [dealerHiddenCard.id]);
            if (!revealAnimationResult.ok) return revealAnimationResult;

            const revealResult = useGameStore.getState().revealDealerHiddenCard();
            if (!revealResult.ok) {
                return operationError(revealResult.reason);
            }

            while (useGameStore.getState().dealerScore < 17) {
                const layoutSnapshot = layoutRef.current;
                const layoutError = getInitialLayoutError(layoutSnapshot);
                if (layoutError) {
                    return operationError(layoutError);
                }

                const reservation = useGameStore.getState().reserveHit('dealer');
                if (!reservation.ok) {
                    return operationError(reservation.reason);
                }

                const visualCard = createHitVisualCard(reservation.value, layoutSnapshot);
                if (!visualCard) {
                    return operationError('Dealer hit target layout is missing.');
                }

                const flyResult = await addAndFlyCards(operationId, [visualCard]);
                if (!flyResult.ok) return flyResult;

                const flipResult = await flipCards(operationId, [visualCard.id]);
                if (!flipResult.ok) return flipResult;

                const commitResult = useGameStore.getState().commitHit(reservation.value);
                if (!commitResult.ok) {
                    return operationError(commitResult.reason);
                }
            }

            const finishResult = useGameStore.getState().finishDealerTurn();
            if (!finishResult.ok) {
                return operationError(finishResult.reason);
            }

            return operationOk();
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

            const flyResult = await addAndFlyCards(operationId, cards);
            if (!flyResult.ok) {
                failRoundFromOperation(flyResult);
                return;
            }

            const flipResult = await flipCards(operationId, getInitialDealFaceUpCardIds(cards));
            if (!flipResult.ok) {
                failRoundFromOperation(flipResult);
                return;
            }

            const commitResult = useGameStore.getState().commitInitialDeal(reservation.value);
            if (!commitResult.ok) {
                warnTableActionError(commitResult.reason);
                useGameStore.getState().failRound(commitResult.reason);
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

            const flyResult = await addAndFlyCards(operationId, [visualCard]);
            if (!flyResult.ok) {
                failRoundFromOperation(flyResult);
                return;
            }

            const flipResult = await flipCards(operationId, [visualCard.id]);
            if (!flipResult.ok) {
                failRoundFromOperation(flipResult);
                return;
            }

            const commitResult = useGameStore.getState().commitHit(reservation.value);
            if (!commitResult.ok) {
                warnTableActionError(commitResult.reason);
                useGameStore.getState().failRound(commitResult.reason);
                return;
            }

            if (commitResult.value.isBust) {
                const dealerSequenceResult = await runDealerSequence(operationId);
                failRoundFromOperation(dealerSequenceResult);
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

            const dealerSequenceResult = await runDealerSequence(operationId);
            failRoundFromOperation(dealerSequenceResult);
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
            resolveAndClear(flyResolversRef.current, cardId, operationOk());
        },
        [resolveAndClear],
    );

    const handleFlipEnd = useCallback(
        (cardId: string) => {
            resolveAndClear(flipResolversRef.current, cardId, operationOk());
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
