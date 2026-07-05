import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackCard } from '@/client/components/Card/BackCard';
import {
    bottomAreaPosition,
    cardStyles,
    deckCardOriginInset,
    deckPosition,
    deckStackOffset,
    defaultHandSlotCount,
    handCardsRowGap,
    topAreaPosition,
} from '@/client/utils/constants';

import { useBlackjackAnimationController } from './hooks/useBlackjackAnimationController';
import { resolveCardPosition, useTableLayout } from './hooks/useTableLayout';
import { TableCard } from './TableCard';
import type { TableHandle } from './types/table.types';

export type { TableHandle } from './types/table.types';

interface TableProps {
    onInteractionLockedChange?: (isLocked: boolean) => void;
}

export const Table = forwardRef<TableHandle, TableProps>(function Table({ onInteractionLockedChange }, ref) {
    const tableLayout = useTableLayout();
    const animationController = useBlackjackAnimationController({
        layoutRef: tableLayout.layoutRef,
        onInteractionLockedChange,
    });

    useImperativeHandle(ref, () => ({
        dealInitialCards: animationController.dealInitialCards,
        hitPlayer: animationController.hitPlayer,
        stand: animationController.stand,
        newRound: animationController.newRound,
        resetTable: animationController.resetTable,
    }), [animationController]);

    return (
        <View ref={tableLayout.refs.wrapperRef} style={styles.wrapper} onLayout={tableLayout.measureLayout}>
            <View ref={tableLayout.refs.deckRef} style={styles.tableAnchor} onLayout={tableLayout.measureLayout}>
                <View style={[styles.stackCard, styles.stackCard1]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard2]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard3]}>
                    <BackCard />
                </View>
            </View>

            <View style={styles.dealerSlots}>
                {Array.from({ length: defaultHandSlotCount }, (_, index) => (
                    <View
                        key={`dealer-slot-${index}`}
                        ref={slotRef => {
                            tableLayout.refs.dealerSlotRefs.current[index] = slotRef;
                        }}
                        style={styles.cardSlot}
                        onLayout={tableLayout.measureLayout}
                    />
                ))}
            </View>

            <View style={styles.playerSlots}>
                {Array.from({ length: defaultHandSlotCount }, (_, index) => (
                    <View
                        key={`player-slot-${index}`}
                        ref={slotRef => {
                            tableLayout.refs.playerSlotRefs.current[index] = slotRef;
                        }}
                        style={styles.cardSlot}
                        onLayout={tableLayout.measureLayout}
                    />
                ))}
            </View>

            {animationController.visualCards.map(visualCard => {
                const targetPosition = resolveCardPosition(
                    tableLayout.layout,
                    visualCard.recipient,
                    visualCard.slotIndex,
                );
                const currentPosition = visualCard.layoutMode === 'settled' && targetPosition
                    ? targetPosition
                    : visualCard.startPosition;

                return (
                    <TableCard
                        key={visualCard.id}
                        visualCard={visualCard}
                        currentPosition={currentPosition}
                        onFlyEnd={animationController.handleFlyEnd}
                        onFlipEnd={animationController.handleFlipEnd}
                    />
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        width: '100%',
        height: '100%',
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    tableAnchor: {
        position: 'absolute',
        left: deckPosition.left,
        top: deckPosition.top,
        width: cardStyles.width,
        height: cardStyles.height,
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
        top: deckCardOriginInset,
        left: deckCardOriginInset,
        zIndex: 3,
    },
    dealerSlots: {
        position: 'absolute',
        top: topAreaPosition.top,
        left: topAreaPosition.left,
        right: topAreaPosition.right,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: handCardsRowGap,
    },
    playerSlots: {
        position: 'absolute',
        bottom: bottomAreaPosition.bottom,
        left: bottomAreaPosition.left,
        right: bottomAreaPosition.right,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: handCardsRowGap,
    },
    cardSlot: {
        width: cardStyles.width,
        height: cardStyles.height,
    },
});
