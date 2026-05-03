import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { BackCard } from '@/client/components/Card/BackCard';
import { cardStyles, deckLeftInset, deckStackOffset, deckTopCardOriginInset } from '@/client/utils/constants';
import { logDeckRemaining } from '@/client/utils/functions';
import type { CardEntity, CardPosition, FullCard, HitRequest, Recipient } from '@/client/utils/types';

import { buildDeck, isFlippedAfterFly } from './helpers.functions';
import { useDealCards, useHitCard } from './Table.hooks';
import { TableCard } from './TableCard';

const cardHalfHeightPx = Math.round(cardStyles.height / 2);

interface TableProps {
    isDealing: boolean;
    dealerPositions: CardPosition[];
    playerPositions: CardPosition[];
    onDealComplete: (dealerCards: FullCard[], playerCards: FullCard[]) => void;
    hitRequest: HitRequest | null;
    onHitComplete: (recipient: Recipient, card: FullCard) => void;
}

export function Table({
    isDealing,
    dealerPositions,
    playerPositions,
    onDealComplete,
    hitRequest,
    onHitComplete,
}: TableProps) {
    const deckRef = useRef<View>(null);
    const [deckPosition, setDeckPosition] = useState<CardPosition>({ x: 0, y: 0 });
    const [deckReady, setDeckReady] = useState(false);
    const poolRef = useRef(buildDeck());
    const uniqueId = useRef(0);
    const dealerPositionsRef = useRef(dealerPositions);
    dealerPositionsRef.current = dealerPositions;
    const playerPositionsRef = useRef(playerPositions);
    playerPositionsRef.current = playerPositions;

    const [entities, setEntities] = useState<CardEntity[]>([]);

    const entitiesRef = useRef(entities);
    entitiesRef.current = entities;

    const pendingDealIdsRef = useRef<Set<number>>(new Set());

    const handleDealStart = useCallback(() => {
        pendingDealIdsRef.current.clear();
    }, []);

    const handleCardComplete = useCallback(
        (entityId: number) => {
            const entity = entitiesRef.current.find(e => e.id === entityId);
            if (!entity) return;

            // первая раздача завершена
            if (entity.origin === 'deal') {
                pendingDealIdsRef.current.add(entityId);
                const totalDealEntities = entitiesRef.current.filter(e => e.origin === 'deal').length;
                if (pendingDealIdsRef.current.size === totalDealEntities && totalDealEntities > 0) {
                    pendingDealIdsRef.current.clear();
                    // получаем все карты раздачи
                    const dealEntities = entitiesRef.current.filter(entity => entity.origin === 'deal');
                    const dealerCards = dealEntities.filter(entity => entity.recipient === 'dealer');
                    const playerCards = dealEntities.filter(entity => entity.recipient === 'player');
                    onDealComplete(
                        dealerCards.map(entity => ({ ...entity.card, isFlipped: isFlippedAfterFly(entity) })),
                        playerCards.map(entity => ({ ...entity.card, isFlipped: isFlippedAfterFly(entity) })),
                    );
                }
                return;
            }

            // хит завершен
            onHitComplete(entity.recipient, { ...entity.card, isFlipped: true });
        },
        [onDealComplete, onHitComplete],
    );

    const handleDeckLayout = useCallback((_e: LayoutChangeEvent) => {
        deckRef.current?.measureInWindow((x: number, y: number) => {
            setDeckPosition({ x, y });
            setDeckReady(true);
        });
    }, []);

    // logs
    useEffect(() => {
        if (!deckReady) return;
        logDeckRemaining(poolRef.current);
    }, [deckReady]);

    useDealCards({
        isDealing,
        deckReady,
        dealerPositionsRef,
        playerPositionsRef,
        poolRef,
        uniqueId,
        setEntities,
        onDealStart: handleDealStart,
    });

    useHitCard({
        hitRequest,
        deckReady,
        isDealing,
        dealerPositionsRef,
        playerPositionsRef,
        poolRef,
        uniqueId,
        setEntities,
    });

    return (
        <View style={styles.wrapper}>
            <View ref={deckRef} style={styles.tableAnchor} onLayout={handleDeckLayout}>
                <View style={[styles.stackCard, styles.stackCard1]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard2]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard3]}>
                    <BackCard />
                </View>
                {entities.map(entity => (
                    <TableCard
                        key={entity.id}
                        entity={entity}
                        deckPosition={deckPosition}
                        onComplete={handleCardComplete}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    tableAnchor: {
        position: 'absolute',
        left: deckLeftInset,
        top: '50%',
        width: cardStyles.width,
        height: cardStyles.height,
        marginTop: -cardHalfHeightPx,
    },
    stackCard: {
        position: 'absolute',
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        overflow: cardStyles.overflow,
    },
    stackCard1: {
        transform: [{ rotate: '-4deg' }],
        zIndex: 1,
    },
    stackCard2: {
        top: deckStackOffset,
        left: deckStackOffset,
        transform: [{ rotate: '2deg' }],
        zIndex: 2,
    },
    stackCard3: {
        top: deckTopCardOriginInset,
        left: deckTopCardOriginInset,
        zIndex: 3,
    },
});
